// /api/agent — the agent controller endpoint.
//
// Flow:
//   Authenticate → Validate → Build context → Load knowledge → Agent loop
//   (LLM → tool calls → Supabase → results → LLM → ...) → Stream result
//
// The response is sent as Server-Sent Events (SSE) so the client can show
// real-time status messages and stream the final answer.

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import {
  agentRequestSchema,
  type AgentResponse,
  type AgentStreamEvent,
  type NavigationAction,
} from "@/lib/agent/types";
import {
  runAgentCompletion,
  toolsToOpenRouterFormat,
  truncateToolResult,
  AgentModelError,
} from "@/lib/agent/openrouter";
import { buildSystemPrompt } from "@/lib/agent/knowledge";
import { buildAgentContext, buildMessageHistory } from "@/lib/agent/context";
import { getToolByName, TOOL_REGISTRY } from "@/lib/agent/tools";
import type { AgentContext } from "@/lib/agent/types";

// Maximum number of tool-call rounds per request. Prevents infinite loops
// where the LLM keeps requesting tools without converging on an answer.
const MAX_TOOL_ROUNDS = 5;

// Forces the route to run dynamically (no static optimization) so auth is
// always checked at request time.
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/*  SSE response builder                                                      */
/* -------------------------------------------------------------------------- */

// Creates a streaming Response that emits SSE events. The client reads these
// events to update UI status and display the final answer.
function createSSEStream(
  generator: () => AsyncGenerator<AgentStreamEvent>
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generator()) {
          const payload = "data: " + JSON.stringify(event) + "\n\n";
          controller.enqueue(encoder.encode(payload));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        // Log the actual error server-side for debugging.
        console.error("[AGENT] Stream error:", err);
        // Send a safe error message to the client — never expose internals.
        const errorEvent: AgentStreamEvent = {
          type: "error",
          message:
            err instanceof AgentModelError
              ? "The AI service is temporarily unavailable. Please try again later."
              : "An unexpected error occurred. Please try again.",
        };
        controller.enqueue(
          encoder.encode("data: " + JSON.stringify(errorEvent) + "\n\n")
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Agent loop: LLM ↔ Tools                                                  */
/* -------------------------------------------------------------------------- */

// The core agent loop. Sends the conversation to the LLM, executes any
// requested tool calls, feeds results back, and repeats until the LLM
// produces a final text answer or the round limit is reached.
async function* runAgentLoop(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
  ctx: AgentContext,
  systemPrompt: string
): AsyncGenerator<AgentStreamEvent> {
  // Build the conversation history for the LLM.
  const initialMessages = [
    ...buildMessageHistory(history),
    { role: "user" as const, content: userMessage },
  ];

  // Convert our tool registry to OpenRouter format for the API.
  const openRouterTools = toolsToOpenRouterFormat(
    TOOL_REGISTRY.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }))
  );

  // Track tool results across rounds. Use a mutable message array.
  // The local type is compatible with OpenRouterMessage after initialization.
  type LocalMessage = {
    role: "user" | "assistant" | "tool";
    content: string | null;
    tool_calls?: {
      id: string;
      type: "function";
      function: { name: string; arguments: string };
    }[];
    tool_call_id?: string;
    name?: string;
  };

  const messages: LocalMessage[] = [...initialMessages] as LocalMessage[];

  let finalContent = "";
  let navigationAction: NavigationAction | undefined;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // Notify the client which phase we're in.
    if (round === 0) {
      yield { type: "status", message: "Analyzing your request..." };
    } else {
      yield { type: "status", message: "Processing data..." };
    }

    // Call the LLM (with automatic model fallback on failure).
    const completion = await runAgentCompletion({
      systemPrompt,
      messages: messages as unknown as Parameters<typeof runAgentCompletion>[0]["messages"],
      tools: openRouterTools,
    });

    // If the LLM requested tool calls, execute them.
    if (completion.tool_calls.length > 0) {
      // Add the assistant message with tool calls to the conversation.
      messages.push({
        role: "assistant",
        content: completion.content,
        tool_calls: completion.tool_calls.map(
          (tc: { id: string; name: string; arguments: Record<string, unknown> }) => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })
        ),
      });

      // Execute each tool call.
      for (const tc of completion.tool_calls) {
        const tool = getToolByName(tc.name);

        if (!tool) {
          // Unknown tool — return an error result to the LLM so it can recover.
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              tool: tc.name,
              success: false,
              error: "Unknown tool: " + tc.name,
            }),
            name: tc.name,
          });
          continue;
        }

        // Notify the client about the current operation.
        yield {
          type: "status",
          message: getStatusMessage(tc.name),
        };

        try {
          // Execute the tool with the agent context (authorization enforced
          // inside each tool's execute function).
          const result = await tool.execute(tc.arguments, ctx);

          // Check if this tool produced a navigation action.
          if (result.success && result.data && typeof result.data === "object") {
            const data = result.data as Record<string, unknown>;
            if (data.suggestedRoute) {
              navigationAction = data.suggestedRoute as NavigationAction;
            }
          }

          // Truncate the result to prevent context flooding, then add to
          // conversation as a tool result message. The "name" field is REQUIRED
          // by OpenRouter for tool messages.
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: truncateToolResult(JSON.stringify(result)),
            name: tc.name,
          });
        } catch {
          // Tool execution failed — report the failure to the LLM.
          // Never expose internal error details.
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              tool: tc.name,
              success: false,
              error: "Tool execution failed. Please try again.",
            }),
            name: tc.name,
          });
        }
      }

      // Continue the loop — the next iteration will send the tool results
      // back to the LLM for interpretation.
      continue;
    }

    // No tool calls — the LLM has produced its final answer.
    finalContent = completion.content.trim();
    break;
  }

  // If we exited the loop without a final answer (round limit reached),
  // use a graceful fallback.
  if (!finalContent) {
    finalContent =
      "I've gathered the information but couldn't complete the analysis. " +
      "Could you try rephrasing your question?";
  }

  // Extract follow-up prompt suggestions from the markdown "Suggested Next
  // Steps" section so the client can render them as tappable buttons, and
  // strip that section from the visible message to avoid duplication.
  const suggestions = extractSuggestions(finalContent);
  const cleanContent = stripSuggestionsSection(finalContent);

  yield { type: "status", message: "Preparing your answer..." };

  // Emit the final result event.
  yield {
    type: "result",
    content: cleanContent,
    ...(navigationAction ? { action: navigationAction } : {}),
    ...(suggestions.length > 0 ? { suggestions } : {}),
  };
}

// Removes the "Suggested Next Steps" markdown section (heading + list items)
// from a response so the suggestions are only shown as interactive buttons.
function stripSuggestionsSection(markdown: string): string {
  const lines = markdown.split("\n");
  let inSection = false;
  const kept: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();

    if (!inSection) {
      if (/^#{1,3}\s*Suggested Next Steps\b/i.test(line)) {
        inSection = true;
        continue;
      }
      kept.push(raw);
      continue;
    }

    // Section ends at the next heading or horizontal rule.
    if (/^#{1,3}\s/.test(line) || /^-{3,}$/.test(line)) {
      kept.push(raw);
      inSection = false;
      continue;
    }

    // Skip bullet/numbered suggestion items (and blank lines within section).
    if (
      /^[-*]\s+/.test(line) ||
      /^\d+\.\s+/.test(line) ||
      line === ""
    ) {
      continue;
    }

    // Keep any other (non-suggestion) content within the section.
    kept.push(raw);
  }

  return kept.join("\n").trim();
}

// Scans markdown output for a "Suggested Next Steps" heading and returns the
// bullet/numbered items beneath it as suggestion prompts. Handles both
// "### Suggested Next Steps" and "## Suggested Next Steps" heading forms.
function extractSuggestions(markdown: string): string[] {
  const suggestions: string[] = [];
  const lines = markdown.split("\n");
  let inSection = false;

  for (const raw of lines) {
    const line = raw.trim();

    if (!inSection) {
      if (/^#{1,3}\s*Suggested Next Steps\b/i.test(line)) {
        inSection = true;
      }
      continue;
    }

    // Stop at the next heading or horizontal rule.
    if (/^#{1,3}\s/.test(line) || /^-{3,}$/.test(line)) {
      break;
    }

    // Capture bullet (-), asterisk (*), or numbered (1.) items.
    const match = line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (match && match[1].trim()) {
      suggestions.push(match[1].trim());
    }
  }

  return suggestions.slice(0, 4);
}

// Maps tool names to user-friendly status messages. Only shows relevant
// statuses — never exposes SQL, API details, or internal reasoning.
function getStatusMessage(toolName: string): string {
  const messages: Record<string, string> = {
    get_agents: "Looking up team members...",
    get_evaluations: "Querying evaluations...",
    get_evaluation_summary: "Analyzing performance summary...",
    get_accounts: "Loading account data...",
    get_lobs: "Loading line-of-business data...",
    get_qa_staff: "Looking up QA staff...",
    get_agent_performance: "Analyzing agent performance...",
    get_qa_metrics: "Computing QA metrics...",
  };
  return messages[toolName] ?? "Processing your request...";
}

/* -------------------------------------------------------------------------- */
/*  HTTP handler                                                              */
/* -------------------------------------------------------------------------- */

// POST /api/agent — the main agent endpoint.
//
// Request body: { message: string, history?: [], accountScope?: string }
// Response: SSE stream of status events followed by the result event.
export async function POST(request: Request) {
  // Step 1: Authenticate. The agent inherits the user's authorization scope.
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" } satisfies AgentResponse,
      { status: 401 }
    );
  }

  // Step 0: Verify the API key is configured before streaming starts.
  // This check runs early so we can return a clear error instead of
  // failing mid-stream with a generic message.
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("[AGENT] OPENROUTER_API_KEY is not configured");
    return NextResponse.json(
      {
        success: false,
        error: "Agent is not configured. Missing API key.",
      } satisfies AgentResponse,
      { status: 503 }
    );
  }

  // Step 2: Parse and validate the request body with Zod.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" } satisfies AgentResponse,
      { status: 400 }
    );
  }

  const parsed = agentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid request",
      } satisfies AgentResponse,
      { status: 400 }
    );
  }

  const { message, history, accountScope } = parsed.data;

  // Step 3: Build the agent context from the authenticated user.
  const ctx = await buildAgentContext(user);

  // If an account scope was specified, validate the user can access it.
  if (accountScope) {
    const hasAccess = ctx.accounts.some(
      (a: { account: string }) =>
        a.account.toUpperCase() === accountScope.toUpperCase()
    );
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to the specified account.",
        } satisfies AgentResponse,
        { status: 403 }
      );
    }
  }

  // Step 4: Build the system prompt with relevant knowledge modules.
  // Pass the effective (expanded) accessible accounts so managers know they
  // can query every account.
  const systemPrompt = buildSystemPrompt(user, message, ctx.accounts);

  // Step 5: Run the agent loop and stream results via SSE.
  return createSSEStream(() => runAgentLoop(message, history, ctx, systemPrompt));
}
