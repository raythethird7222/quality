// API route: uploads a user's avatar image and persists its public URL to their employee record.
import { NextRequest } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth/session";
import { jsonError, jsonOk } from "@/server/security/http";
import { ValidationError } from "@/server/security/errors";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { assertTrustedOrigin } from "@/server/security/origin";
import { auditLog } from "@/server/audit";

const BUCKET = "avatar";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

// Magic-byte prefixes for supported image formats.
const MAGIC_BYTES: { magic: number[]; mime: string }[] = [
  { magic: [0xff, 0xd8, 0xff], mime: "image/jpeg" },
  {
    magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    mime: "image/png",
  },
  {
    magic: [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
    mime: "image/webp",
  },
];

function detectMime(buffer: Buffer): string | null {
  for (const { magic } of MAGIC_BYTES) {
    if (buffer.length >= magic.length) {
      const match = magic.every((b, i) => buffer[i] === b);
      if (match) {
        return MAGIC_BYTES.find((m) => m.magic === magic)?.mime ?? null;
      }
    }
  }
  return null;
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
  if (!match) return null;
  return {
    buffer: Buffer.from(match[2], "base64"),
    mime: match[1],
  };
}

const avatarSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1, "Missing imageDataUrl")
    .regex(/^data:image\/(jpeg|png|webp);base64,/, "Unsupported image format"),
});

export async function POST(request: NextRequest) {
  try {
    await assertTrustedOrigin();
    await enforceRateLimit("avatar", 10, 60_000); // 10 uploads per minute

    const user = await requireUser();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    const parsed = avatarSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const decoded = dataUrlToBuffer(parsed.data.imageDataUrl);
    if (!decoded) {
      throw new ValidationError("Unsupported image format");
    }

    if (decoded.buffer.byteLength > MAX_BYTES) {
      throw new ValidationError("Image exceeds 2 MB limit");
    }

    // Verify magic bytes match the claimed MIME type.
    const detectedMime = detectMime(decoded.buffer);
    if (!detectedMime) {
      throw new ValidationError("Image file is not a valid JPEG, PNG, or WebP");
    }

    const supabase = await createServerClient();
    const safeId = user.employee_code.replace(/[^a-zA-Z0-9_-]/g, "");
    const path = `${safeId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, decoded.buffer, {
        contentType: detectedMime,
        upsert: true,
      });

    if (uploadError) {
      console.error("[avatar] Storage upload error:", uploadError);
      throw new ValidationError("Failed to upload avatar");
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);
    const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("employees")
      .update({ avatar_url: avatarUrl })
      .eq("employee_email", user.employee_email);

    if (updateError) {
      console.error("[avatar] DB update error:", updateError);
      throw new ValidationError("Failed to update profile");
    }

    auditLog("avatar.uploaded", { employee_id: user.employee_id });

    return jsonOk({ success: true, avatarUrl });
  } catch (error) {
    return jsonError(error);
  }
}
