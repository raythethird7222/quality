import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

const BUCKET = "avatar";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; type: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
  if (!match) return null;
  return {
    buffer: Buffer.from(match[2], "base64"),
    type: match[1],
  };
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  let body: { imageDataUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const imageDataUrl = body.imageDataUrl;
  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing imageDataUrl" },
      { status: 400 }
    );
  }

  const parsed = dataUrlToBuffer(imageDataUrl);
  if (!parsed) {
    return NextResponse.json(
      { success: false, error: "Unsupported image format" },
      { status: 400 }
    );
  }

  if (parsed.buffer.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: "Image exceeds 2 MB limit" },
      { status: 413 }
    );
  }

  const supabase = createServerClient();
  const safeId = user.employee_id.replace(/[^a-zA-Z0-9_-]/g, "");
  const path = `${safeId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, parsed.buffer, {
      contentType: parsed.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("[avatar] Storage upload error:", uploadError);
    return NextResponse.json(
      { success: false, error: uploadError.message },
      { status: 500 }
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { data: employee, error: updateError } = await supabase
    .from("employees")
    .update({ avatar_url: avatarUrl })
    .eq("employee_email", user.employee_email)
    .select("id, employee_id, employee_name, employee_email, avatar_url")
    .maybeSingle();

  if (updateError || !employee) {
    console.error("[avatar] DB update error:", updateError);
    return NextResponse.json(
      { success: false, error: updateError?.message ?? "employee not found" },
      { status: 500 }
    );
  }

  const updatedUser = { ...user, avatar_url: avatarUrl };
  const response = NextResponse.json({ success: true, avatarUrl, user: updatedUser });

  response.cookies.set("qa-rey-auth", JSON.stringify(updatedUser), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}
