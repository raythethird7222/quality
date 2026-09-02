// Context builder: converts the authenticated user into the AgentContext
// that tools receive, and manages the conversion of conversation history
// into the format expected by OpenRouter.

import type { AuthUser } from "@/types";
import type { AgentContext, AgentMessage } from "./types";
import { isManagerRole } from "@/lib/db/helpers";
import { getAccounts } from "@/lib/db/employees";

// Builds the agent context from the authenticated user. This is the ONLY
// identity information tools receive — never secrets or full user objects.
//
// Manager-level roles (account manager, QA supervisor, quality coordinator,
// admin) see ALL accounts, matching the dashboard's role-aware rollup. Their
// accessible-account list is expanded to every configured account so the agent
// can query data across the whole company.
export async function buildAgentContext(user: AuthUser): Promise<AgentContext> {
  let accounts: AgentContext["accounts"] = user.accounts.map((a) => ({
    account: a.account,
    role: a.role,
  }));

  if (isManagerRole(user.role)) {
    const allAccounts = await getAccounts();
    // Merge full account list with assigned accounts (keeps any role info),
    // but at minimum expose every account code to the tools.
    const merged = new Map<string, string>();
    for (const a of allAccounts) {
      merged.set(a.account_code.toUpperCase(), user.role);
    }
    for (const a of user.accounts) {
      merged.set(a.account.toUpperCase(), a.role);
    }
    accounts = [...merged.entries()].map(([account, role]) => ({
      account,
      role,
    })) as AgentContext["accounts"];
  }

  return {
    employeeId: user.employee_id,
    employeeName: user.employee_name,
    role: user.role,
    account: user.account,
    accountName: user.account_name,
    accounts,
  };
}

// Converts the simple {role, content} history from the client into the
// OpenRouter message format. Only user and assistant messages are passed;
// tool results are injected during the agent loop.
export function buildMessageHistory(
  history: { role: "user" | "assistant"; content: string }[]
): AgentMessage[] {
  return history.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}
