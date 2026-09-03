// API route: returns raw evaluations for an account within a date period.
// Enforces account-level authorization.

import { NextRequest } from "next/server";
import { requireAccountAccess } from "@/server/auth/session";
import { getAccountEvaluationsForPeriod } from "@/lib/db/quality";
import { jsonError, jsonOk } from "@/server/security/http";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { evaluationsQuerySchema } from "@/lib/validation";
import { ValidationError } from "@/server/security/errors";

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit("evaluations", 60, 60_000);

    const params = {
      account: req.nextUrl.searchParams.get("account") ?? "",
      dateFrom: req.nextUrl.searchParams.get("dateFrom") ?? undefined,
      dateTo: req.nextUrl.searchParams.get("dateTo") ?? undefined,
      agent: req.nextUrl.searchParams.get("agent") ?? undefined,
    };

    const parsed = evaluationsQuerySchema.safeParse(params);
    if (!parsed.success) {
      throw new ValidationError("Invalid parameters: " + parsed.error.issues[0]?.message);
    }

    const { user, accountCode } = await requireAccountAccess(parsed.data.account);

    const evaluations = await getAccountEvaluationsForPeriod(
      accountCode,
      user,
      parsed.data.dateFrom,
      parsed.data.dateTo,
      parsed.data.agent
    );

    return jsonOk({ evaluations });
  } catch (error) {
    return jsonError(error);
  }
}
