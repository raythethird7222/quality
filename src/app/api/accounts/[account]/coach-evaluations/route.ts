// Returns all evaluation history for agents coached by the logged-in employee.
import { NextRequest } from "next/server";
import { requireAccountAccess } from "@/server/auth/session";
import { getCoachEvaluationPerformance } from "@/lib/db/quality";
import { jsonError, jsonOk } from "@/server/security/http";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> },
) {
  try {
    const { account } = await params;
    const { user, accountCode } = await requireAccountAccess(account);
    const evaluationDate = request.nextUrl.searchParams.get("date") ?? undefined;
    const coachHistory = await getCoachEvaluationPerformance(
      accountCode,
      user.employee_id,
      evaluationDate,
    );
    return jsonOk({ coachHistory });
  } catch (error) {
    return jsonError(error);
  }
}
