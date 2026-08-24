import { NextRequest, NextResponse } from "next/server";
import { getEmployeeByEmail } from "@/lib/db/employees";
import { buildAuthUserFromEmployee } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing email" },
        { status: 400 }
      );
    }

    const employee = await getEmployeeByEmail(email);

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No employee record found for this Google account. Please contact your administrator.",
        },
        { status: 403 }
      );
    }

    const user = await buildAuthUserFromEmployee(employee);

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

    const response = NextResponse.json({ success: true, user });

    response.cookies.set("qa-rey-auth", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
