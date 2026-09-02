// API route: authenticates a user with email and employee code, issuing an auth cookie on success.
import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { getEmployeeByEmailAndPassword } from "@/lib/db/employees";
import { buildAuthUserFromEmployee } from "@/lib/auth";

// Handles the POST request for credential-based login and validates input before issuing the cookie.
export async function POST(request: NextRequest) {
  try {
    // Parse the request body and validate it against the login schema.
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    // Return the first validation error when input is invalid.
    if (!parsed.success) {
      const errorMessage =
        parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Extract validated credentials from the parsed request.
    const { email, password } = parsed.data;

    // Verify the email and employee code against stored credentials.
    const employee = await getEmployeeByEmailAndPassword(email, password);

    // Reject the login when credentials do not match.
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Invalid email or employee code" },
        { status: 401 }
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

    if (user.role === "agent") {
      return NextResponse.json(
        { success: false, error: "Invalid email or employee code" },
        { status: 401 }
      );
    }

    // Build the success response and attach the auth cookie.
    const response = NextResponse.json({ success: true, user });

    // Persistent cookie when "Remember me" is checked, otherwise a 24-hour session.
    response.cookies.set("qa-rey-auth", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: parsed.data.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
    });

    return response;
  // Catch unexpected failures and return a generic server error.
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
