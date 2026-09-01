// API route: uploads a user's avatar image and persists its public URL to their employee record.
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

// Storage bucket and size constraints used for avatar uploads.
const BUCKET = "avatar";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

// Parses a base64 data URL into a binary buffer and its content type, rejecting unsupported formats.
function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; type: string } | null {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
  if (!match) return null;
  return {
    buffer: Buffer.from(match[2], "base64"),
    type: match[1],
  };
}

// Handles the POST request for avatar upload: validates, stores, and updates the user's avatar.
export async function POST(request: NextRequest) {
  // Resolve the authenticated user before allowing an upload.
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Parse the JSON body, returning 400 on malformed input.
  let body: { imageDataUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Ensure the request included a usable image data URL.
  const imageDataUrl = body.imageDataUrl;
  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    return NextResponse.json(
      { success: false, error: "Missing imageDataUrl" },
      { status: 400 }
    );
  }

  // Decode the data URL into a buffer and validated content type.
  const parsed = dataUrlToBuffer(imageDataUrl);
  if (!parsed) {
    return NextResponse.json(
      { success: false, error: "Unsupported image format" },
      { status: 400 }
    );
  }

  // Reject uploads that exceed the 2 MB size limit.
  if (parsed.buffer.byteLength > MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: "Image exceeds 2 MB limit" },
      { status: 413 }
    );
  }

  // Create a Supabase server client and derive a sanitized storage path.
  const supabase = createServerClient();
  const safeId = user.employee_code.replace(/[^a-zA-Z0-9_-]/g, "");
  const path = `${safeId}.jpg`;

  // Upload the image bytes to the avatar bucket (overwriting any existing file).
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, parsed.buffer, {
      contentType: parsed.type,
      upsert: true,
    });

  // Surface any storage upload failure as a 500 response.
  if (uploadError) {
    console.error("[avatar] Storage upload error:", uploadError);
    return NextResponse.json(
      { success: false, error: uploadError.message },
      { status: 500 }
    );
  }

  // Retrieve the public URL of the uploaded avatar and bust caches with a timestamp.
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);
  const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  // Persist the new avatar URL onto the employee record.
  const { data: employee, error: updateError } = await supabase
    .from("employees")
    .update({ avatar_url: avatarUrl })
    .eq("employee_email", user.employee_email)
    .select("id, employee_code, employee_name, employee_email, avatar_url")
    .maybeSingle();

  // Surface any database update failure or missing record as a 500 response.
  if (updateError || !employee) {
    console.error("[avatar] DB update error:", updateError);
    return NextResponse.json(
      { success: false, error: updateError?.message ?? "employee not found" },
      { status: 500 }
    );
  }

  // Build the updated user object and the JSON success response.
  const updatedUser = { ...user, avatar_url: avatarUrl };
  const response = NextResponse.json({ success: true, avatarUrl, user: updatedUser });

  // Refresh the auth cookie with the updated user (including the new avatar URL).
  response.cookies.set("qa-rey-auth", JSON.stringify(updatedUser), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}
