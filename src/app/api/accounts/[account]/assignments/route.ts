// API route: persists agent assignments for an account with server-side
// validation and authorization.

import { NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { persistAgentAssignments } from "@/lib/db/assignments";
import { assignmentPayloadSchema } from "@/features/assignments/validation";
import { jsonError, jsonOk } from "@/server/security/http";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { assertTrustedOrigin } from "@/server/security/origin";
import { auditLog } from "@/server/audit";
import { ValidationError, AuthorizationError } from "@/server/security/errors";
import { getRolePermissions } from "@/server/authorization/permissions";
import { accountParamSchema } from "@/lib/validation";
import { notifyAllEmployees } from "@/server/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    await assertTrustedOrigin();
    await enforceRateLimit("assignments", 30, 60_000);

    const { account } = await params;
    const accountParsed = accountParamSchema.safeParse({ account });
    if (!accountParsed.success) {
      throw new ValidationError("Invalid account code");
    }

    const user = await requireUser();
    const normalized = account.trim().toUpperCase();
    const assignment = user.accounts.find((entry) => entry.account === normalized);
    const isManager = ["admin", "account_manager", "quality_coordinator", "qa_supervisor", "qa"].includes(user.role);

    if (!assignment && !isManager) {
      throw new AuthorizationError("You do not have access to this account");
    }

    // Only users with assignments:manage permission can modify assignments.
    if (!getRolePermissions(user.role).has("assignments:manage")) {
      throw new AuthorizationError("You do not have permission to manage assignments");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    const parsed = assignmentPayloadSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed: " + parsed.error.issues[0]?.message);
    }

    const saved = await persistAgentAssignments(
      normalized,
      parsed.data.rows.map((r) => ({
        assignmentId: r.assignmentId,
        agentId: r.agentId,
        agent: r.agent,
        lobId: r.lobId,
        coachId: r.coachId ?? null,
        evaluatorId: r.evaluatorId ?? null,
        teamLeadId: r.teamLeadId ?? null,
      }))
    );

    await notifyAllEmployees(
      "QA assignment saved",
      `${saved.length} QA assignment${saved.length === 1 ? "" : "s"} saved for ${normalized}: ${saved.map((row) => row.name || "Unnamed agent").join(", ")}.`,
    );

    auditLog("assignments.saved", {
      employee_id: user.employee_id,
      account: normalized,
      count: saved.length,
    });

    return jsonOk({ success: true, rows: saved });
  } catch (error) {
    return jsonError(error);
  }
}
