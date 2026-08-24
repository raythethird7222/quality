"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  X,
  Send,
  Sparkles,
  Search,
  FileText,
  BarChart3,
  Users,
  CheckCircle2,
  Loader2,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const LOTTIE_SRC =
  "https://lottie.host/28a5afce-7ea1-4091-a3fc-d6ac1d15ddfd/EjSZ1LetQ3.json";

type FeedItem =
  | { kind: "message"; id: number; role: "user" | "bot"; text: string }
  | {
      kind: "step";
      id: number;
      label: string;
      icon: LucideIcon;
      status: "running" | "done";
    };

type Tool = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  prompt: string;
};

const TOOLS: Tool[] = [
  {
    id: "evaluate",
    label: "Evaluate Agent",
    description: "Pull a roster agent and draft an evaluation.",
    icon: Search,
    prompt: "Run an agent evaluation for the selected roster member.",
  },
  {
    id: "trends",
    label: "Summarize Trends",
    description: "Analyze recent scorecard trends.",
    icon: BarChart3,
    prompt: "Summarize quality trends across my team this month.",
  },
  {
    id: "coaching",
    label: "Coaching Gaps",
    description: "Find the biggest improvement areas.",
    icon: Users,
    prompt: "What are the top coaching gaps for my team?",
  },
  {
    id: "report",
    label: "Generate Report",
    description: "Build a shareable QA report.",
    icon: FileText,
    prompt: "Generate a QA performance report for leadership.",
  },
];

const SUGGESTIONS = [
  "How do I start an evaluation?",
  "Show my team's scorecard",
  "What counts as a fatal error?",
];

const WELCOME: FeedItem = {
  kind: "message",
  id: 0,
  role: "bot",
  text: "Hi, I'm QA-REY Agent. I can evaluate agents, analyze trends, spot coaching gaps, and draft reports. Pick a tool or ask me anything.",
};

function getAgentReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("fatal")) {
    return "A fatal error is any single failure that automatically fails the evaluation regardless of score — e.g. compliance breaches, data exposure, or policy violations. They're tracked separately from weighted criteria.";
  }
  if (t.includes("scorecard") || t.includes("dashboard")) {
    return "Your team scorecard lives under the account dashboard. It shows average scores, fatal-error rate, and trend lines per evaluator. Want me to summarize it?";
  }
  if (t.includes("evaluation") || t.includes("evaluate")) {
    return "To start an evaluation: open a roster member, choose 'New Evaluation', score each criterion, then flag any fatal errors. I can pre-fill a draft if you pick 'Evaluate Agent' above.";
  }
  if (t.includes("report")) {
    return "I can assemble a leadership report with averages, fatal rates, and top coaching gaps. Tap 'Generate Report' and I'll draft it here.";
  }
  return "Got it. As your QA agent I can take action on evaluations, analytics, and coaching. Try one of the tools above or rephrase your request.";
}

export default function GlobalChatbot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [feed, open]);

  const isLogin = pathname === "/login";
  if (!mounted || isLogin) return null;

  function nextId() {
    return idRef.current++;
  }

  function updateStep(id: number, status: "running" | "done") {
    setFeed((prev) =>
      prev.map((item) =>
        item.kind === "step" && item.id === id ? { ...item, status } : item
      )
    );
  }

  function runAgent(task: string, toolLabel?: string) {
    if (busy) return;
    setBusy(true);

    const userMsg: FeedItem = {
      kind: "message",
      id: nextId(),
      role: "user",
      text: task,
    };
    setFeed((prev) => [...prev, userMsg]);

    const thinkId = nextId();
    const toolId = nextId();

    setFeed((prev) => [
      ...prev,
      {
        kind: "step",
        id: thinkId,
        label: "Planning response",
        icon: Sparkles,
        status: "running",
      },
    ]);

    window.setTimeout(() => {
      updateStep(thinkId, "done");
      setFeed((prev) => [
        ...prev,
        {
          kind: "step",
          id: toolId,
          label: toolLabel ? `Running: ${toolLabel}` : "Retrieving context",
          icon: toolLabel ? FileText : Search,
          status: "running",
        },
      ]);

      window.setTimeout(() => {
        updateStep(toolId, "done");
        const botMsg: FeedItem = {
          kind: "message",
          id: nextId(),
          role: "bot",
          text: getAgentReply(task),
        };
        setFeed((prev) => [...prev, botMsg]);
        setBusy(false);
      }, 900);
    }, 700);
  }

  function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    runAgent(text);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[32rem] w-96 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <DotLottieReact
                src={LOTTIE_SRC}
                autoplay
                loop
                className="h-10 w-10"
                style={{ background: "transparent" }}
              />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-primary-foreground">
                  QA-REY Agent
                </p>
                <p className="flex items-center gap-1 text-[11px] text-primary-foreground/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  Active
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close agent"
              className="rounded-md p-1 text-primary-foreground/80 transition hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-border bg-background/60 p-3">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => runAgent(tool.prompt, tool.label)}
                  disabled={busy}
                  title={tool.description}
                  className="flex items-start gap-2 rounded-xl border border-border bg-card px-2.5 py-2 text-left transition hover:border-primary hover:bg-muted disabled:opacity-50"
                >
                  <Icon size={16} className="mt-0.5 shrink-0 text-primary" />
                  <span className="text-[11px] font-medium leading-tight text-foreground">
                    {tool.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >
            {feed.map((item) => {
              if (item.kind === "message") {
                return (
                  <div
                    key={item.id}
                    className={`flex ${
                      item.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${
                        item.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {item.text}
                    </div>
                  </div>
                );
              }
              const StepIcon = item.status === "running" ? Loader2 : CheckCircle2;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground"
                >
                  <StepIcon
                    size={14}
                    className={
                      item.status === "running"
                        ? "animate-spin text-primary"
                        : "text-green-500"
                    }
                  />
                  <span>
                    {item.label}
                    {item.status === "running" ? "…" : " ✓"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => runAgent(s)}
                  disabled={busy}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-primary hover:text-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Bot size={18} className="shrink-0 text-primary" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask the agent or pick a tool…"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close agent" : "Open agent"}
        className="group flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-transparent shadow-lg transition hover:scale-105"
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
