// API route: returns the currently authenticated user, including their avatar URL.
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getEmployeeAvatarUrl } from "@/lib/db/employees";

// Handles the GET request for the current session user, returning 401 if not authenticated.
export async function GET() {
  // Resolve the currently authenticated user from the session.
  const user = await getAuthUser();

  // Return 401 when no authenticated user is present.
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  // Fetch the employee's avatar URL to include in the response.
  const avatarUrl = await getEmployeeAvatarUrl(user.employee_email);

  return NextResponse.json({
    success: true,
    user: { ...user, avatar_url: avatarUrl ?? undefined },
  });
}
