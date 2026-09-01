import * as z from "zod";

// OpenRouter client: sends chat completion requests with automatic model fallback.
// This module is server-only and must never expose the OpenRouter API key to clients.

const MODEL_CHAIN = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "minimax/minimax-m3:free",
  "poolside/laguna-s-2.1:free",
] as const;

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_TOOL_RESULT_LENGTH = 4000;

type OpenRouterMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
};

type OpenRouterTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type AgentCompletion = {
  content: string;
  tool_calls: {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }[];
};

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
/* Zod schema -> JSON Schema                                                   */
/* -------------------------------------------------------------------------- */

// Use Zod 4's native JSON Schema conversion instead of inspecting private
// _def internals, which are not stable across Zod versions.
function zodToJsonSchema(
  schema: z.ZodObject<z.ZodRawShape>
): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema, {
    target: "draft-07",
    io: "input",
  }) as Record<string, unknown>;

  delete jsonSchema.$schema;

  if (jsonSchema.type !== "object") {
    throw new Error("Agent tool parameters must be an object schema");
  }

  return jsonSchema;
}

function validateTools(tools: OpenRouterTool[]): void {
  for (const tool of tools) {
    if (!tool || tool.type !== "function") {
      throw new Error("Invalid agent tool definition");
    }

    if (!tool.function?.name?.trim()) {
      throw new Error("Agent tool is missing a function name");
    }

    if (!tool.function.description?.trim()) {
      throw new Error(
        `Agent tool '${tool.function.name}' is missing a description`
      );
    }

    if (
      !tool.function.parameters ||
      typeof tool.function.parameters !== "object"
    ) {
      throw new Error(
        `Agent tool '${tool.function.name}' is missing parameters`
      );
    }
  }
}

// Keep messages compatible with the OpenAI/OpenRouter chat-completions format.
function sanitizeMessages(
  messages: OpenRouterMessage[]
): OpenRouterMessage[] {
  return messages.map((msg) => {
    if (msg.role === "tool") {
      return {
        role: "tool",
        content: msg.content ?? "",
        tool_call_id: msg.tool_call_id,
      };
    }

    if (msg.role === "assistant" && msg.tool_calls?.length) {
      return {
        role: "assistant",
        content: msg.content ?? null,
        tool_calls: msg.tool_calls,
      };
    }

    return {
      ...msg,
      content: msg.content || null,
    };
  });
}

// Prevent large database results from flooding the model context.
function truncateToolResult(text: string): string {
  if (text.length <= MAX_TOOL_RESULT_LENGTH) return text;
  return text.slice(0, MAX_TOOL_RESULT_LENGTH) + "\n...[truncated]";
}

async function callModel(
  model: string,
  messages: OpenRouterMessage[],
  tools: OpenRouterTool[],
  apiKey: string,
  signal: AbortSignal
): Promise<AgentCompletion> {
  const sanitized = sanitizeMessages(messages);

  const body = {
    model,
    messages: sanitized,
    ...(tools.length > 0 ? { tools, tool_choice: "auto" } : {}),
    max_tokens: 1024,
    temperature: 0.1,
  };

  // Log tool names only, not the full schemas.
  console.log(
    `[AGENT] Tools for ${model}:`,
    tools.map((tool) => tool.function.name)
  );
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
    throw new Error(`HTTP ${response.status}: ${errText.slice(0, 500)}`);
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
      const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
      toolCalls.push({
        id: tc.id,
        name: tc.function.name,
        arguments: args,
      });
    } catch {
      // Keep the tool call but use empty arguments so the agent loop can recover.
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

  const fullMessages: OpenRouterMessage[] = [
    { role: "system", content: params.systemPrompt },
    ...params.messages,
  ];

  const openRouterTools: OpenRouterTool[] = params.tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  validateTools(openRouterTools);

  const attempts: { model: string; reason: string }[] = [];

  // AbortSignal cannot be reset, so every model gets a fresh controller.
  for (const model of MODEL_CHAIN) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    try {
      return await callModel(
        model,
        fullMessages,
        openRouterTools,
        apiKey,
        controller.signal
      );
    } catch (err) {
      const reason = controller.signal.aborted
        ? "Request timed out"
        : err instanceof Error
          ? err.message
          : String(err);

      attempts.push({ model, reason });
      console.error(`[AGENT] Model failed: ${model} - ${reason}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new AgentModelError(
    `All ${MODEL_CHAIN.length} models failed. Last error: ${
      attempts[attempts.length - 1]?.reason ?? "unknown"
    }`,
    attempts
  );
}

// Convert internal AgentTool definitions into OpenRouter's function format.
export function toolsToOpenRouterFormat(
  tools: {
    name: string;
    description: string;
    parameters: z.ZodObject<z.ZodRawShape>;
  }[]
): OpenRouterTool[] {
  const converted = tools.map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.parameters),
    },
  }));

  validateTools(converted);
  return converted;
}

export { truncateToolResult };
