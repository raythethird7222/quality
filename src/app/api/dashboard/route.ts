// API route: returns chart analytics for the dashboard, used by Realtime refetch.
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/db/employees";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overview = await getDashboardOverview(user);
  return NextResponse.json({ overview });
}
