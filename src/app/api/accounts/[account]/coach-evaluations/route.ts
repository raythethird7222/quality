// Returns all evaluation history for agents coached by the logged-in employee.
import { NextRequest } from "next/server";
import { requireAccountAccess } from "@/server/auth/session";
import {
  getCoachEvaluationPerformance,
  getEvaluatedAgentIdsForUser,
} from "@/lib/db/quality";
import { jsonError, jsonOk } from "@/server/security/http";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> },
) {
  try {
    const { account } = await params;
    const { user, accountCode } = await requireAccountAccess(account);
    const evaluationDate = request.nextUrl.searchParams.get("date") ?? undefined;
    const [coachHistory, evaluatedAgentIds] = await Promise.all([
      getCoachEvaluationPerformance(accountCode, user.employee_id, evaluationDate),
      getEvaluatedAgentIdsForUser(accountCode, user),
    ]);
    return jsonOk({ coachHistory, evaluatedAgentIds });
  } catch (error) {
    return jsonError(error);
  }
}
