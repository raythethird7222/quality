// Agent types: shared type definitions for the QA-Tool Agent system,
// covering tool schemas, conversation messages, execution results,
// navigation actions, and the API request/response contracts.

import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*  Tool schema wrappers                                                      */
/* -------------------------------------------------------------------------- */

// A tool definition: name, description, Zod parameter schema, and an execute
// function that receives the parsed params plus the caller's auth context.
export type AgentTool = {
  name: string;
  description: string;
  parameters: z.ZodObject<z.ZodRawShape>;
  execute: (
    params: Record<string, unknown>,
    ctx: AgentContext
  ) => Promise<ToolResult>;
};

// Result of a single tool execution: a compact, LLM-safe JSON snapshot.
export type ToolResult = {
  tool: string;
  success: boolean;
  data?: unknown;
  error?: string;
};

/* -------------------------------------------------------------------------- */
/*  Agent context — injected into every tool execution                         */
/* -------------------------------------------------------------------------- */

// Auth context passed to tool executions. Never includes secrets, only the
// identity and access scope needed for authorization decisions.
export type AgentContext = {
  employeeId: number;
  employeeName: string;
  role: string;
  account: string;
  accountName: string;
  accounts: { account: string; role: string }[];
};

/* -------------------------------------------------------------------------- */
/*  Conversation messages                                                      */
/* -------------------------------------------------------------------------- */

// Roles in the agent conversation. "tool" messages carry tool execution results.
export type MessageRole = "system" | "user" | "assistant" | "tool";

// A single message in the agent conversation history.
export type AgentMessage = {
  role: MessageRole;
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

// A tool call issued by the LLM.
export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

/* -------------------------------------------------------------------------- */
/*  Navigation / structured actions                                           */
/* -------------------------------------------------------------------------- */

// A navigation action the agent can suggest to the user.
export type NavigationAction = {
  type: "navigation";
  label: string;
  route: string;
  description: string;
};

/* -------------------------------------------------------------------------- */
/*  API request / response                                                    */
/* -------------------------------------------------------------------------- */

// Zod schema for the /api/agent POST body.
export const agentRequestSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  // Optional conversation history for multi-turn sessions.
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(20)
    .default([]),
  // Optional account scope hint — restricts tool queries to that account.
  accountScope: z.string().optional(),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;

// Final agent response returned to the client.
export type AgentResponse = {
  success: boolean;
  content?: string;
  action?: NavigationAction;
  status?: string;
  error?: string;
};

/* -------------------------------------------------------------------------- */
/*  Streaming events (Sent as SSE)                                            */
/* -------------------------------------------------------------------------- */

// Status event: user-friendly progress message during agent execution.
export type AgentStatusEvent = {
  type: "status";
  message: string;
};

// Final response event.
export type AgentResultEvent = {
  type: "result";
  content: string;
  action?: NavigationAction;
};

// Error event.
export type AgentErrorEvent = {
  type: "error";
  message: string;
};

export type AgentStreamEvent =
  | AgentStatusEvent
  | AgentResultEvent
  | AgentErrorEvent;
