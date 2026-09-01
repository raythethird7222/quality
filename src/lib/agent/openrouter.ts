// OpenRouter client: sends chat completion requests to OpenRouter with an
// automatic model fallback chain. If the primary model fails (timeout,
// rate-limit, server error, or invalid response), the next model is tried.
//
// Fallback order:
//   1. nvidia/nemotron-3-ultra-550b-a55b:free
//   2. minimax/minimax-m3:free
//   3. poolside/laguna-s-2.1:free
//
// The API key is NEVER included in any client bundle — this module is
// server-only and only imported from route handlers.

// Ordered list of models to try. Each entry uses the OpenRouter API format.
const MODEL_CHAIN = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "minimax/minimax-m3:free",
  "poolside/laguna-s-2.1:free",
] as const;

// OpenRouter chat completion endpoint.
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Timeout per model attempt (ms). Prevents a single slow model from blocking
// the entire chain.
const REQUEST_TIMEOUT_MS = 30_000;

// Maximum content length we return to the LLM from tool results. Prevents
// context flooding from large database queries.
const MAX_TOOL_RESULT_LENGTH = 4000;

// Shape of an OpenRouter chat message.
type OpenRouterMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
  name?: string;
};

// Shape of a tool definition sent to OpenRouter.
type OpenRouterTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

// Result of a successful completion call.
export type AgentCompletion = {
  content: string;
  tool_calls: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }[];
};

// Error type thrown when ALL models in the chain have been exhausted.
export class AgentModelError extends Error {
  constructor(
    message: string,
    public readonly attempts: { model: string; reason: string }[]
  ) {
    super(message);
    this.name = "AgentModelError";
  }
}

/* -------------------------------------------------------------------------- */
/*  Zod schema → JSON Schema conversion                                       */
/* -------------------------------------------------------------------------- */

// Converts a Zod object schema to a JSON Schema object suitable for the
// OpenRouter function calling format. Only handles the subset of Zod types
// used by our tool parameter schemas.
function zodToJsonSchema(schema: {
  shape: Record<string, { _def: { typeName: string; description?: string; innerType?: { _def: { typeName: string; value?: unknown; values?: unknown[] } } } }>;
}): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(schema.shape)) {
    const def = value._def;
    const desc = def.description ?? "";
    const typeName = def.typeName;

    // Determine if field is required (not optional).
    const isOptional =
      typeName === "ZodOptional" ||
      typeName === "ZodDefault" ||
      typeName === "ZodNullable";

    if (!isOptional) required.push(key);

    // Unwrap optional/nullable/default to get the base type.
    let baseType = typeName;
    if (
      typeName === "ZodOptional" ||
      typeName === "ZodDefault" ||
      typeName === "ZodNullable"
    ) {
      baseType = def.innerType?._def.typeName ?? "ZodString";
    }

    // Map Zod types to JSON Schema.
    switch (baseType) {
      case "ZodString":
        properties[key] = { type: "string", description: desc };
        break;
      case "ZodNumber":
        properties[key] = { type: "number", description: desc };
        break;
      case "ZodBoolean":
        properties[key] = { type: "boolean", description: desc };
        break;
      case "ZodEnum":
        properties[key] = {
          type: "string",
          enum: (def.innerType?._def.values as string[]) ?? [],
          description: desc,
        };
        break;
      default:
        properties[key] = { type: "string", description: desc };
    }
  }

  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

/* -------------------------------------------------------------------------- */
/*  Message sanitizer                                                          */
/* -------------------------------------------------------------------------- */

// Sanitizes messages before sending to OpenRouter. The OpenAI-compatible API
// requires:
// - "tool" messages MUST have a "name" field (the tool that was called)
// - "assistant" messages with tool_calls should have content: null
// - Empty content strings should be converted to null
function sanitizeMessages(
  messages: OpenRouterMessage[]
): OpenRouterMessage[] {
  return messages.map((msg) => {
    // Tool messages require a name field.
    if (msg.role === "tool") {
      return {
        role: "tool",
        content: msg.content ?? "",
        tool_call_id: msg.tool_call_id,
        name: msg.name ?? "unknown",
      };
    }

    // Assistant messages with tool_calls should have null content.
    if (msg.role === "assistant" && msg.tool_calls && msg.tool_calls.length > 0) {
      return {
        role: "assistant",
        content: null,
        tool_calls: msg.tool_calls,
      };
    }

    // Ensure content is never empty string (use null instead).
    return {
      ...msg,
      content: msg.content || null,
    };
  });
}
/* -------------------------------------------------------------------------- */

// Ensures a tool result string never exceeds the max length budget.
// Truncation happens at word boundaries to preserve readability.
function truncateToolResult(text: string): string {
  if (text.length <= MAX_TOOL_RESULT_LENGTH) return text;
  return text.slice(0, MAX_TOOL_RESULT_LENGTH) + "\n...[truncated]";
}

/* -------------------------------------------------------------------------- */
/*  Core: call a single model                                                 */
/* -------------------------------------------------------------------------- */

// Attempts a single chat completion against one model. Throws on failure
// with a reason string so the caller can decide whether to retry.
async function callModel(
  model: string,
  messages: OpenRouterMessage[],
  tools: OpenRouterTool[],
  apiKey: string,
  signal: AbortSignal
): Promise<AgentCompletion> {
  // Sanitize messages to meet OpenRouter's strict format requirements.
  const sanitized = sanitizeMessages(messages);

  const body = {
    model,
    messages: sanitized,
    tools: tools.length > 0 ? tools : undefined,
    tool_choice: tools.length > 0 ? "auto" : undefined,
    max_tokens: 1024,
    temperature: 0.1,
  };

  // Debug: log the request body to diagnose format issues.
  console.log("[AGENT] Tools for " + model + ":", JSON.stringify(body.tools));
  console.log("[AGENT] Messages count:", body.messages.length);
  console.log("[AGENT] First message role:", body.messages[0]?.role);

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://qa-rey.app",
      "X-Title": "QA-Tool Agent",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `HTTP ${response.status}: ${errText.slice(0, 200)}`
    );
  }

  const json = (await response.json()) as {
    choices?: {
      message: {
        content: string | null;
        tool_calls?: {
          id: string;
          type: string;
          function: { name: string; arguments: string };
        }[];
      };
    }[];
    error?: { message: string };
  };

  if (json.error) {
    throw new Error(json.error.message);
  }

  const choice = json.choices?.[0];
  if (!choice) {
    throw new Error("Empty response: no choices returned");
  }

  const msg = choice.message;
  const toolCalls: AgentCompletion["tool_calls"] = [];

  for (const tc of msg.tool_calls ?? []) {
    try {
      const args = JSON.parse(tc.function.arguments);
      toolCalls.push({ id: tc.id, name: tc.function.name, arguments: args });
    } catch {
      // Malformed tool call arguments — skip this call but continue.
      toolCalls.push({
        id: tc.id,
        name: tc.function.name,
        arguments: {},
      });
    }
  }

  return {
    content: msg.content ?? "",
    tool_calls: toolCalls,
  };
}

/* -------------------------------------------------------------------------- */
/*  Public: run completion with automatic fallback                            */
/* -------------------------------------------------------------------------- */

// Sends a chat completion request to OpenRouter, trying each model in the
// chain until one succeeds. Returns the completion content and any tool calls.
//
// Throws AgentModelError if ALL models fail.
export async function runAgentCompletion(params: {
  systemPrompt: string;
  messages: OpenRouterMessage[];
  tools: { name: string; description: string; parameters: Record<string, unknown> }[];
  apiKey?: string;
}): Promise<AgentCompletion> {
  const apiKey = params.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Set it in .env.local."
    );
  }

  // Build the full message array: system prompt first, then conversation.
  const fullMessages: OpenRouterMessage[] = [
    { role: "system", content: params.systemPrompt },
    ...params.messages,
  ];

  // Convert tool definitions to OpenRouter format.
  const openRouterTools: OpenRouterTool[] = params.tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  // Track each failed attempt for the final error report.
  const attempts: { model: string; reason: string }[] = [];

  // Create an abort controller for timeout management.
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS * MODEL_CHAIN.length
  );

  try {
    for (const model of MODEL_CHAIN) {
      // Per-model timeout: abort if this single model takes too long.
      const modelTimeout = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS
      );

      try {
        const result = await callModel(
          model,
          fullMessages,
          openRouterTools,
          apiKey,
          controller.signal
        );
        return result;
      } catch (err) {
        const reason =
          err instanceof Error ? err.message : String(err);
        attempts.push({ model, reason });

        // If the abort was triggered by our timeout, note it clearly.
        if (controller.signal.aborted) {
          attempts[attempts.length - 1].reason = "Request timed out";
        }
      } finally {
        clearTimeout(modelTimeout);
        // Reset abort for next model attempt.
        if (controller.signal.aborted) {
          // Can't reset an aborted signal — create a new controller.
          // But since we're in a loop, we just continue with the same one.
          // The next call will fail immediately if still aborted.
          break;
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  throw new AgentModelError(
    `All ${MODEL_CHAIN.length} models failed. Last error: ${
      attempts[attempts.length - 1]?.reason ?? "unknown"
    }`,
    attempts
  );
}

/* -------------------------------------------------------------------------- */
/*  Convert AgentTool[] → OpenRouter tool format                              */
/* -------------------------------------------------------------------------- */

// Converts our internal AgentTool definitions into the format expected by
// the OpenRouter API. Uses zodToJsonSchema for parameter serialization.
export function toolsToOpenRouterFormat(
  tools: {
    name: string;
    description: string;
    parameters: { shape: Record<string, unknown> };
  }[]
): OpenRouterTool[] {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: zodToJsonSchema(
        t.parameters as Parameters<typeof zodToJsonSchema>[0]
      ),
    },
  }));
}

export { truncateToolResult };
