// API route: authenticates a user via Google OAuth by matching their email to an employee record.
import { NextRequest, NextResponse } from "next/server";
import { getEmployeeByEmail } from "@/lib/db/employees";
import { buildAuthUserFromEmployee } from "@/lib/auth";

// Handles the POST request for Google-based authentication and issues an auth cookie on success.
export async function POST(request: NextRequest) {
  try {
    // Parse the request body and normalize the email to lowercase for lookup.
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    // Reject requests that do not include an email address.
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing email" },
        { status: 400 }
      );
    }

    // Look up the employee record matching the provided email.
    const employee = await getEmployeeByEmail(email);

    // Deny access when no employee record matches the Google email.
    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error:
            `No employee record found for "${email}". This Google account is not registered. ` +
            "Please use your work email or contact your administrator.",
        },
        { status: 403 }
      );
    }

    // Build the authenticated user (with assignments) from the employee record.
    const user = await buildAuthUserFromEmployee(employee);

    // Deny access when the employee has no valid account assignments.
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No account assignments found. Please contact your administrator.",
        },
        { status: 403 }
      );
    }

    // Build the success response and attach the auth cookie.
    const response = NextResponse.json({ success: true, user });

    response.cookies.set("qa-rey-auth", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  // Catch any unexpected failures and return a generic server error.
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
