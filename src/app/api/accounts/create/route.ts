// API route: creates a new account with server-side validation.
// Restricted to manager-level roles.

import { NextRequest } from "next/server";
import { requireUser } from "@/server/auth/session";
import { createAccount } from "@/lib/db/accounts";
import { createAccountSchema } from "@/features/accounts-management/validation";
import { jsonError, jsonOk } from "@/server/security/http";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { assertTrustedOrigin } from "@/server/security/origin";
import { auditLog } from "@/server/audit";
import { AuthorizationError, ValidationError } from "@/server/security/errors";

const MANAGER_ROLES = ["admin", "account_manager", "quality_coordinator", "qa_supervisor"];

export async function POST(request: NextRequest) {
  try {
    await assertTrustedOrigin();
    await enforceRateLimit("accounts-create", 5, 60_000);

    const user = await requireUser();

    if (!MANAGER_ROLES.includes(user.role)) {
      throw new AuthorizationError("You do not have permission to create accounts");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? "Validation failed");
    }

    const account = await createAccount(parsed.data.code, parsed.data.name);

    auditLog("account.created", {
      employee_id: user.employee_id,
      account_code: account.account_code,
    });

    return jsonOk({ success: true, account });
  } catch (error) {
    return jsonError(error);
  }
}
