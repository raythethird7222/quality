// API route: returns analytics for an account, used by Realtime refetch and filter-driven re-fetches.
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getAccountQaName } from "@/lib/db/employees";
import { getAccountEvaluationAnalytics } from "@/lib/db/quality";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");
  if (!account) {
    return NextResponse.json(
      { error: "Missing account parameter" },
      { status: 400 }
    );
  }

  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lob = req.nextUrl.searchParams.get("lob") ?? undefined;
  const guideline = req.nextUrl.searchParams.get("guideline") ?? undefined;
  const timeframe = req.nextUrl.searchParams.get("timeframe") ?? undefined;
  const dateFrom = req.nextUrl.searchParams.get("dateFrom") ?? undefined;
  const dateTo = req.nextUrl.searchParams.get("dateTo") ?? undefined;

  const qaName = await getAccountQaName(account, user.employee_name);
  const analytics = await getAccountEvaluationAnalytics(account, user, {
    lob,
    guideline,
    timeframe,
    dateFrom,
    dateTo,
  });

  return NextResponse.json({ qaName, ...analytics });
}
