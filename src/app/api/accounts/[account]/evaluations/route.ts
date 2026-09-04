// API route: persists a manually-created evaluation from the roster calendar
// "Evaluate" form with full authorization checks.

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { createEvaluation } from "@/lib/db/quality";
import { jsonError, jsonOk } from "@/server/security/http";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { assertTrustedOrigin } from "@/server/security/origin";
import { auditLog } from "@/server/audit";
import { ValidationError, AuthorizationError } from "@/server/security/errors";
import { accountParamSchema } from "@/lib/validation";

const createEvaluationBodySchema = z.object({
  agentName: z.string().trim().min(1, "Agent name is required").max(200),
  guideline: z.string().trim().min(1, "Guideline is required").max(200),
  evaluationDate: z.string().trim().min(1, "Evaluation date is required").max(50),
  qaScore: z.number().min(0).max(100),
  ticketBill: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
  checked: z
    .array(
      z.object({
        parameterId: z.number().int().positive(),
        checked: z.boolean(),
      })
    ),
});

const EVALUATION_CREATOR_ROLES = ["admin", "account_manager", "quality_coordinator", "qa_supervisor", "qa"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    await assertTrustedOrigin();
    await enforceRateLimit("evaluations-create", 30, 60_000);

    const { account } = await params;
    const accountParsed = accountParamSchema.safeParse({ account });
    if (!accountParsed.success) {
      throw new ValidationError("Invalid account code");
    }

    const user = await requireUser();
    const normalized = account.trim().toUpperCase();
    const assignment = user.accounts.find((entry) => entry.account === normalized);
    const isManager = ["admin", "account_manager", "quality_coordinator", "qa_supervisor"].includes(user.role);

    if (!assignment && !isManager) {
      throw new AuthorizationError("You do not have access to this account");
    }

    if (!EVALUATION_CREATOR_ROLES.includes(user.role)) {
      throw new AuthorizationError("You do not have permission to create evaluations");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    const parsed = createEvaluationBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed: " + parsed.error.issues[0]?.message);
    }

    const evaluationId = await createEvaluation({
      accountCode: normalized,
      agentName: parsed.data.agentName,
      guideline: parsed.data.guideline,
      evaluationDate: parsed.data.evaluationDate,
      qaScore: parsed.data.qaScore,
      qaEvaluatorEmployeeId: user.employee_id,
      ticketBill: parsed.data.ticketBill,
      notes: parsed.data.notes,
      checked: parsed.data.checked,
    });

    if (evaluationId == null) {
      throw new ValidationError("Could not create evaluation");
    }

    auditLog("evaluation.created", {
      employee_id: user.employee_id,
      account: normalized,
      evaluation_id: evaluationId,
    });

    return jsonOk({ success: true, evaluationId });
  } catch (error) {
    return jsonError(error);
  }
}
