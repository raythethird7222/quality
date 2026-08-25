// API route: clears the authentication cookie to sign the user out.
import { NextResponse } from "next/server";

// Handles the POST request for logout by expiring the auth cookie.
export async function POST() {
  // Build the success response.
  const response = NextResponse.json({ success: true });

  // Expire the auth cookie by overwriting it with an empty value and zero max age.
  response.cookies.set("qa-rey-auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
