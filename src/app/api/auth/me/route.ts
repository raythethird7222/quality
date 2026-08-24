import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getEmployeeAvatarUrl } from "@/lib/db/employees";

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const avatarUrl = await getEmployeeAvatarUrl(user.employee_email);

  return NextResponse.json({
    success: true,
    user: { ...user, avatar_url: avatarUrl ?? undefined },
  });
}
