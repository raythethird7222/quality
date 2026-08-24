import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { getEmployeeByEmailAndPassword } from "@/lib/db/employees";
import { buildAuthUserFromEmployee } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const errorMessage =
        parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const employee = await getEmployeeByEmailAndPassword(email, password);

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Invalid email or employee ID" },
        { status: 401 }
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
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
