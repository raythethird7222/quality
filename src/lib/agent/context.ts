// Context builder: converts the authenticated user into the AgentContext
// that tools receive, and manages the conversion of conversation history
// into the format expected by OpenRouter.

import type { AuthUser } from "@/types";
import type { AgentContext, AgentMessage } from "./types";

// Builds the agent context from the authenticated user. This is the ONLY
// identity information tools receive — never secrets or full user objects.
export function buildAgentContext(user: AuthUser): AgentContext {
  return {
    employeeId: user.employee_id,
    employeeName: user.employee_name,
    role: user.role,
    account: user.account,
    accountName: user.account_name,
    accounts: user.accounts.map((a) => ({
      account: a.account,
      role: a.role,
    })),
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
