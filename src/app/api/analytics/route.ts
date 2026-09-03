// API route: returns analytics for an account with authorization checks.

import { NextRequest } from "next/server";
import { requireAccountAccess } from "@/server/auth/session";
import { getAccountQaName } from "@/lib/db/employees";
import { getAccountEvaluationAnalytics } from "@/lib/db/quality";
import { jsonError, jsonOk } from "@/server/security/http";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { analyticsQuerySchema } from "@/lib/validation";
import { ValidationError } from "@/server/security/errors";

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit("analytics", 60, 60_000);

    const params = {
      account: req.nextUrl.searchParams.get("account") ?? "",
      lob: req.nextUrl.searchParams.get("lob") ?? undefined,
      guideline: req.nextUrl.searchParams.get("guideline") ?? undefined,
      timeframe: req.nextUrl.searchParams.get("timeframe") ?? undefined,
      dateFrom: req.nextUrl.searchParams.get("dateFrom") ?? undefined,
      dateTo: req.nextUrl.searchParams.get("dateTo") ?? undefined,
    };

    const parsed = analyticsQuerySchema.safeParse(params);
    if (!parsed.success) {
      throw new ValidationError("Invalid parameters: " + parsed.error.issues[0]?.message);
    }

    const { user, accountCode } = await requireAccountAccess(parsed.data.account);

    const [qaName, analytics] = await Promise.all([
      getAccountQaName(accountCode, user.employee_name),
      getAccountEvaluationAnalytics(accountCode, user, {
        lob: parsed.data.lob,
        guideline: parsed.data.guideline,
        timeframe: parsed.data.timeframe,
        dateFrom: parsed.data.dateFrom,
        dateTo: parsed.data.dateTo,
      }),
    ]);

    return jsonOk({ qaName, ...analytics });
  } catch (error) {
    return jsonError(error);
  }
}
