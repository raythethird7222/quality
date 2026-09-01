// API route: returns raw evaluations for an account within a date period,
// used by the calendar "Evaluate" modal to list evaluations for a selected month.
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getAccountEvaluationsForPeriod } from "@/lib/db/quality";

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

  const dateFrom = req.nextUrl.searchParams.get("dateFrom") ?? undefined;
  const dateTo = req.nextUrl.searchParams.get("dateTo") ?? undefined;

  const evaluations = await getAccountEvaluationsForPeriod(
    account,
    user,
    dateFrom,
    dateTo
  );

  return NextResponse.json({ evaluations });
}