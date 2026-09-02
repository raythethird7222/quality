"use client";

// GlobalChatbot: floating QA-Tool Agent with a real AI backend.
// Replaces the previous scripted scenario engine with streaming API calls
// to /api/agent, displaying real-time status and structured responses.

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  X,
  Send,
  Sparkles,
  Bot,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAccentHex } from "@/features/settings/useAccent";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ACCOUNTS } from "@/features/accounts/config";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// Remote Lottie animation source used for the floating chathead.
const LOTTIE_SRC =
  "https://lottie.host/ce930c93-4dc8-4e7f-add1-71991673ba89/0pxGadRyQW.json";

// Agent API endpoint.
const AGENT_API = "/api/agent";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

// A navigation action returned by the agent.
type NavigationAction = {
  type: "navigation";
  label: string;
  route: string;
  description: string;
};

// An item in the chat feed.
type FeedItem =
  | {
      kind: "message";
      id: number;
      role: "user" | "agent";
      text: string;
      action?: NavigationAction;
      suggestions?: string[];
    }
  | { kind: "status"; id: number; text: string }
  | { kind: "typing"; id: number };

// Suggested prompts shown to the user.
const SUGGESTED_PROMPTS = [
  "Analyze my performance",
  "Show my evaluations",
  "What should I improve?",
  "Show team performance",
];

// Resolves an account key from a user-facing account label, defaulting to "rm".
function accountKeyFromLabel(label?: string): string {
  if (!label) return "rm";
  const entry = Object.entries(ACCOUNTS).find(([, v]) => v.label === label);
  return entry ? entry[0] : "rm";
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function GlobalChatbot() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const accentHex = useAccentHex();

  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [panelHeightVh, setPanelHeightVh] = useState(75);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);
  // AbortController for cancelling in-flight requests.
  const abortRef = useRef<AbortController | null>(null);

  // Begin resizing the panel height from a pointer drag.
  function handleResizeStart(e: React.PointerEvent) {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startH: panelHeightVh };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleResizeMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const delta = dragRef.current.startY - e.clientY;
    const deltaVh = (delta / window.innerHeight) * 100;
    const next = Math.min(90, Math.max(40, dragRef.current.startH + deltaVh));
    setPanelHeightVh(next);
  }

  function handleResizeEnd(e: React.PointerEvent) {
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  // Auto-scrolls the message body to the bottom when feed changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [feed, open]);

  // Hide the chatbot entirely on the login route.
  const isLogin = pathname === "/login";
  if (isLogin) return null;

  const accountKey = accountKeyFromLabel(user?.account);

  function nextId() {
    return idRef.current++;
  }

  // Sends the user message to the agent API and streams the response.
  const sendToAgent = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || busy) return;

      setBusy(true);
      setInput("");

      // Add user message and a typing indicator to the feed.
      const userMsgId = nextId();
      const typingId = nextId();
      setFeed((prev) => [
        ...prev,
        { kind: "message", id: userMsgId, role: "user", text },
        { kind: "typing", id: typingId },
      ]);

      // Create an abort controller for this request.
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Call the agent API with streaming (SSE).
        const response = await fetch(AGENT_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            // Include recent history (last 10 messages) for context.
            // Map "agent" role to "assistant" for the API schema.
            history: feed
              .filter((i) => i.kind === "message")
              .slice(-10)
              .map((i) => {
                const msg = i as Extract<FeedItem, { kind: "message" }>;
                return {
                  role: msg.role === "agent" ? "assistant" : "user",
                  content: msg.text,
                };
              }),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        // Read the SSE stream.
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE events (separated by double newlines).
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const eventStr of events) {
            if (!eventStr.startsWith("data: ")) continue;
            const data = eventStr.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data) as {
                type: string;
                message?: string;
                content?: string;
                action?: NavigationAction;
                suggestions?: string[];
              };

              if (event.type === "status") {
                // Replace typing indicator with a status message.
                setFeed((prev) => {
                  const withoutTyping = prev.filter(
                    (i) => i.kind !== "typing"
                  );
                  return [
                    ...withoutTyping,
                    {
                      kind: "status",
                      id: nextId(),
                      text: event.message ?? "Processing...",
                    },
                  ];
                });
              } else if (event.type === "result") {
                // Replace status/typing with the final agent message.
                setFeed((prev) => {
                  const withoutStatus = prev.filter(
                    (i) => i.kind !== "typing" && i.kind !== "status"
                  );
                  return [
                    ...withoutStatus,
                    {
                      kind: "message",
                      id: nextId(),
                      role: "agent",
                      text:
                        event.content ??
                        "I wasn't able to generate a response.",
                      action: event.action,
                      suggestions: event.suggestions,
                    },
                  ];
                });
              } else if (event.type === "error") {
                // Show error message in the feed.
                setFeed((prev) => {
                  const withoutStatus = prev.filter(
                    (i) => i.kind !== "typing" && i.kind !== "status"
                  );
                  return [
                    ...withoutStatus,
                    {
                      kind: "message",
                      id: nextId(),
                      role: "agent",
                      text:
                        event.message ??
                        "Something went wrong. Please try again.",
                    },
                  ];
                });
              }
            } catch {
              // Skip malformed SSE events.
            }
          }
        }
      } catch (err) {
        // Don't show error for user-aborted requests.
        if (err instanceof DOMException && err.name === "AbortError") return;

        // Show a user-friendly error message.
        setFeed((prev) => {
          const withoutStatus = prev.filter(
            (i) => i.kind !== "typing" && i.kind !== "status"
          );
          return [
            ...withoutStatus,
            {
              kind: "message",
              id: nextId(),
              role: "agent",
              text: "I'm having trouble connecting right now. Please try again in a moment.",
            },
          ];
        });
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, feed]
  );

  function runAgent(rawText: string) {
    void sendToAgent(rawText);
  }

  function send() {
    runAgent(input);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  }

  function go(route: string) {
    setOpen(false);
    router.push(route);
  }

  const showWelcome = feed.length === 0;

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-4"
      style={
        { ["--agent-accent" as string]: accentHex } as React.CSSProperties
      }
    >
      {open && (
        <div
          className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:w-[28rem]"
          style={{ height: `${panelHeightVh}vh` }}
        >
          {/* Resize handle */}
          <div
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            className="flex h-3 cursor-ns-resize items-center justify-center border-b border-border bg-surface-raised/50 hover:bg-surface-raised"
          >
            <span className="block h-[3px] w-10 rounded-full bg-border-default" />
          </div>

          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: accentHex }}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-white">QA-Tool Agent</p>
                <p className="flex items-center gap-1 text-[11px] text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  {busy ? "Thinking..." : "Ready to assist"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close agent"
              className="rounded-md p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Subtitle */}
          <div className="border-b border-border bg-background/60 px-4 py-2">
            <p className="text-[11px] text-muted-foreground">
              Your intelligent QA assistant
            </p>
          </div>

          {/* Body */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {showWelcome ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: `${accentHex}1a`, color: accentHex }}
                >
                  <Bot size={24} />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  How can I help you today?
                </h3>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Ask me about your performance, evaluations, coaching
                  insights, or QA-Tool analytics.
                </p>
                <div className="mt-5 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => runAgent(p)}
                      disabled={busy}
                      className="rounded-xl border border-border bg-background px-3 py-2.5 text-left text-sm font-medium text-foreground transition hover:border-[var(--agent-accent)] hover:bg-muted disabled:opacity-50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              feed.map((item) => {
                if (item.kind === "typing") {
                  return (
                    <div key={item.id} className="flex items-start gap-2">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: `${accentHex}1a`,
                          color: accentHex,
                        }}
                      >
                        <Bot size={15} />
                      </div>
                      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
                      </div>
                    </div>
                  );
                }

                if (item.kind === "status") {
                  return (
                    <div key={item.id} className="flex items-center gap-2">
                      <Loader2
                        size={14}
                        className="animate-spin"
                        style={{ color: accentHex }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.text}
                      </span>
                    </div>
                  );
                }

                if (item.role === "user") {
                  return (
                    <div key={item.id} className="flex justify-end">
                      <div
                        className="max-w-[82%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white"
                        style={{ background: accentHex }}
                      >
                        {item.text}
                      </div>
                    </div>
                  );
                }

                // Agent message.
                return (
                  <div key={item.id} className="flex items-start gap-2">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: `${accentHex}1a`,
                        color: accentHex,
                      }}
                    >
                      <Bot size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                        QA-Tool Agent
                      </p>
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm text-foreground">
                        <MarkdownContent text={item.text} />
                      </div>

                      {item.action && (
                        <div className="mt-2 rounded-xl border border-border border-l-4 bg-background p-3 pl-3 [border-left-color:var(--agent-accent)]">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Recommended
                          </p>
                          <p className="mt-0.5 text-sm text-foreground">
                            {item.action.description}
                          </p>
                          <button
                            onClick={() => go(item.action!.route)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
                            style={{ background: accentHex }}
                          >
                            {item.action.label}
                            <ArrowRight size={15} />
                          </button>
                        </div>
                      )}

                      {item.suggestions && item.suggestions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Suggested next steps
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {item.suggestions.map((s) => (
                              <button
                                key={s}
                                onClick={() => runAgent(s)}
                                disabled={busy}
                                className="rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs text-foreground transition hover:border-[var(--agent-accent)] hover:bg-muted disabled:opacity-50"
                              >
                                {s.replace(/\*\*/g, "")}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Suggested prompts (compact, always available) */}
          {!showWelcome && (
            <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => runAgent(p)}
                  disabled={busy}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-[var(--agent-accent)] hover:text-foreground disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Bot size={18} className="shrink-0" style={{ color: accentHex }} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask the QA-Tool Agent…"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: accentHex }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Chathead */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close agent" : "Open agent"}
        className="group flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-transparent transition hover:scale-105"
      >
        <DotLottieReact
          src={LOTTIE_SRC}
          autoplay
          loop
          className="h-full w-full"
          style={{ background: "transparent" }}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Markdown renderer                                                         */
/* -------------------------------------------------------------------------- */

// Renders agent output as formatted Markdown (tables, headings, lists, bold).
// Uses remark-gfm so GitHub-flavored tables render properly. Links and code
// are sanitized to plain text to keep the chat safe.
function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="agent-markdown max-w-full overflow-x-auto break-words leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: (props) => (
            <div className="my-2 w-full overflow-x-auto">
              <table
                className="w-full border-collapse text-xs"
                {...props}
              />
            </div>
          ),
          th: (props) => (
            <th
              className="border border-border bg-surface-raised px-2 py-1 text-left font-semibold"
              {...props}
            />
          ),
          td: (props) => (
            <td className="border border-border px-2 py-1" {...props} />
          ),
          h1: (props) => (
            <h1 className="mb-1 mt-2 text-base font-bold" {...props} />
          ),
          h2: (props) => (
            <h2 className="mb-1 mt-2 text-sm font-bold" {...props} />
          ),
          h3: (props) => (
            <h3 className="mb-1 mt-1.5 text-sm font-semibold" {...props} />
          ),
          p: (props) => <p className="my-1" {...props} />,
          ul: (props) => (
            <ul className="my-1 list-disc pl-4" {...props} />
          ),
          ol: (props) => (
            <ol className="my-1 list-decimal pl-4" {...props} />
          ),
          li: (props) => <li className="my-0.5" {...props} />,
          strong: (props) => <strong className="font-semibold" {...props} />,
          a: (props) => <span {...props} />,
          code: (props) => {
            const { className, children, ...rest } = props as React.ComponentPropsWithoutRef<"code">;
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded bg-black/10 px-1 py-0.5 text-[0.85em]"
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-2 overflow-x-auto rounded-lg bg-black/5 p-2 text-xs">
                {children}
              </div>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

