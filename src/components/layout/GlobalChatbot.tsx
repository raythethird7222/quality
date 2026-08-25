"use client";

// GlobalChatbot: floating QA-REY agent with a scripted scenario engine and chat UI.
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  X,
  Send,
  Sparkles,
  Bot,
  ArrowRight,
} from "lucide-react";
import { useAccentHex } from "@/features/settings/useAccent";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ACCOUNTS } from "@/features/accounts/config";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

// Remote Lottie animation source used for the floating chathead.
const LOTTIE_SRC =
  "https://lottie.host/ce930c93-4dc8-4e7f-add1-71991673ba89/0pxGadRyQW.json";

/* -------------------------------------------------------------------------- */
/*  Static scenario engine                                                    */
/*  Replace this block with a real Agent backend later.                       */
/* -------------------------------------------------------------------------- */

type AgentAction = {
  label: string;
  description: string;
  /** Returns the destination route for the current user context. */
  route: (ctx: { accountKey: string }) => string;
};

// A single scripted conversation scenario matched by user keywords.
type Scenario = {
  id: string;
  keywords: string[];
  text: string;
  action?: AgentAction;
};

const SCENARIOS: Scenario[] = [
  {
    id: "score-low",
    keywords: ["score low", "why is my", "low score", "why am i"],
    text: "Your current QA score is 84%, which is 5% lower than your previous period. The biggest decline is in Compliance, where several recent evaluations show recurring issues.",
    action: {
      label: "Review My Evaluations",
      description: "Review your recent evaluations",
      route: ({ accountKey }) => `/accounts/${accountKey}/roster`,
    },
  },
  {
    id: "performance",
    keywords: ["performance", "performing", "how am i", "analyze my performance"],
    text: "Your current QA score is 87%. Your performance improved compared with the previous period, but Compliance remains your lowest-performing category.",
    action: {
      label: "View Performance",
      description: "Open your performance analytics",
      route: ({ accountKey }) => `/accounts/${accountKey}/analytics`,
    },
  },
  {
    id: "evaluations",
    keywords: ["evaluation", "evaluations", "recent eval"],
    text: "You have 8 recent evaluations. Your latest evaluation has a score of 91%.",
    action: {
      label: "View Evaluations",
      description: "Open your evaluations list",
      route: ({ accountKey }) => `/accounts/${accountKey}/roster`,
    },
  },
  {
    id: "improve",
    keywords: ["improve", "coaching", "insight", "what should i"],
    text: "Your most frequent issue is Compliance. Several recent evaluations contain similar findings.",
    action: {
      label: "View Coaching Insights",
      description: "Explore coaching insights and recommendations",
      route: () => `/coaching-insights`,
    },
  },
  {
    id: "rm-account",
    keywords: ["rm account", "rm ", "account performing", "rm dashboard"],
    text: "RM currently has an average QA score of 89%. Compliance is currently the lowest-performing category.",
    action: {
      label: "Open RM Dashboard",
      description: "Open the RM account dashboard",
      route: () => `/accounts/rm/dashboard`,
    },
  },
  {
    id: "team",
    keywords: ["team", "analytics", "team performance"],
    text: "The team currently has an average QA score of 88%. Three agents are currently below the target score.",
    action: {
      label: "Open Team Analytics",
      description: "Open team analytics",
      route: ({ accountKey }) => `/accounts/${accountKey}/analytics`,
    },
  },
];

const FALLBACK = {
  text: "I'm currently focused on helping with QA performance, evaluations, coaching insights, and analytics.",
};

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

// Matches a user input string against scenario keywords, returning the first hit.
function matchScenario(input: string): Scenario | null {
  const t = input.toLowerCase();
  for (const s of SCENARIOS) {
    if (s.keywords.some((k) => t.includes(k))) return s;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  UI types                                                                  */
/* -------------------------------------------------------------------------- */

type FeedItem =
  | { kind: "message"; id: number; role: "user" | "agent"; text: string; action?: object }
  | { kind: "typing"; id: number };

// Main chatbot component: renders the chathead and the conversation panel.
export default function GlobalChatbot() {
  // Current route path, used to hide the bot on the login screen.
  const pathname = usePathname();
  // Router used to navigate to recommended routes.
  const router = useRouter();
  // Authenticated user, providing the account context for routing.
  const { user } = useAuth();
  // Active accent color applied to the chatbot UI.
  const accentHex = useAccentHex();

  // Tracks whether the conversation panel is expanded.
  const [open, setOpen] = useState(false);
  // Holds the ordered list of chat messages and typing indicators.
  const [feed, setFeed] = useState<FeedItem[]>([]);
  // Holds the current text in the input box.
  const [input, setInput] = useState("");
  // Tracks whether the agent is "thinking" to block duplicate sends.
  const [busy, setBusy] = useState(false);
  // Ref to the scrollable message body for auto-scrolling.
  const scrollRef = useRef<HTMLDivElement>(null);
  // Monotonic counter for assigning unique ids to feed items.
  const idRef = useRef(1);

  // Auto-scrolls the message body to the bottom when feed or panel changes.
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

  // Generates a monotonic id for feed items.
  function nextId() {
    return idRef.current++;
  }

  // Runs the scripted agent: appends the user message, then a delayed reply.
  function runAgent(rawText: string) {
    const text = rawText.trim();
    if (!text || busy) return;

    setBusy(true);
    setInput("");
    setFeed((prev) => [
      ...prev,
      { kind: "message", id: nextId(), role: "user", text },
      { kind: "typing", id: nextId() },
    ]);

    // Simulated "analyzing" delay — no real AI/backend.
    window.setTimeout(() => {
      const scenario = matchScenario(text);
      const replyText = scenario ? scenario.text : FALLBACK.text;
      const action = scenario?.action
        ? {
            ...scenario.action,
            href: scenario.action.route({ accountKey }),
          }
        : undefined;

      setFeed((prev) => {
        const withoutTyping = prev.filter((i) => i.kind !== "typing");
        return [
          ...withoutTyping,
          {
            kind: "message",
            id: nextId(),
            role: "agent",
            text: replyText,
            action,
          },
        ];
      });
      setBusy(false);
    }, 900);
  }

  // Sends the current input text to the agent.
  function send() {
    runAgent(input);
  }

  // Submits the message when Enter is pressed.
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  }

  // Closes the panel and navigates to the recommended destination route.
  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const showWelcome = feed.length === 0;

  return (
    <div
      className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:inset-x-auto sm:right-4"
      style={{ ["--agent-accent" as string]: accentHex } as React.CSSProperties}
    >
      {open && (
        <div className="flex h-[80vh] max-h-[48rem] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:h-[48rem] sm:w-[28rem]">
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
                <p className="text-sm font-semibold text-white">QA-REY Agent</p>
                <p className="flex items-center gap-1 text-[11px] text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  Ready to assist
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
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto p-4"
          >
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
                  Ask me about your performance, evaluations, coaching insights,
                  or QA-REY analytics.
                </p>
                <div className="mt-5 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                  {/* Suggested prompt chips that launch scripted scenarios. */}
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
                // Renders the animated "agent is typing" indicator.
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

                // Renders a user message, right-aligned and accent-filled.
                if (item.role === "user") {
                  return (
                    <div
                      key={item.id}
                      className="flex justify-end"
                    >
                      <div
                        className="max-w-[82%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white"
                        style={{ background: accentHex }}
                      >
                        {item.text}
                      </div>
                    </div>
                  );
                }

                // Agent message
                const action = item.action as
                  | (AgentAction & { href: string })
                  | undefined;
                return (
                  <div key={item.id} className="flex items-start gap-2">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ background: `${accentHex}1a`, color: accentHex }}
                    >
                      <Bot size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                        QA-REY Agent
                      </p>
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm text-foreground">
                        {item.text}
                      </div>

                       {action && (
                        // Recommended action card with a CTA that navigates to a route.
                        <div className="mt-2 rounded-xl border border-border border-l-4 bg-background p-3 pl-3 [border-left-color:var(--agent-accent)]">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Recommended
                          </p>
                          <p className="mt-0.5 text-sm text-foreground">
                            {action.description}
                          </p>
                          <button
                            onClick={() => go(action.href)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
                            style={{ background: accentHex }}
                          >
                            {action.label}
                            <ArrowRight size={15} />
                          </button>
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
              {/* Compact prompt chips kept visible during an active conversation. */}
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
          {/* Composer row: accent bot icon, text field, and send button. */}
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Bot size={18} className="shrink-0" style={{ color: accentHex }} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask the QA-REY Agent…"
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
      {/* Floating launcher that toggles the conversation panel open/closed. */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close agent" : "Open agent"}
        className="group flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-transparent transition hover:scale-105"
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
