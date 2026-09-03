// Tool registry: the complete set of tools the agent can invoke. Each tool
// is a controlled, server-side function that:
// 1. Validates parameters with Zod
// 2. Enforces authorization (role-based scoping)
// 3. Queries Supabase for real data
// 4. Returns a compact, LLM-safe result
//
// The LLM NEVER has direct database access — it can only call these tools,
// and each tool enforces its own authorization rules.

import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getAccountIdByCode } from "@/lib/db/quality";
import {
  getAccountAgents,
  getAccountQAs,
  getAccountTeamLeads,
} from "@/lib/db/employees";
import { getScopedAgentIds, isManagerRole } from "@/lib/db/helpers";
import type { AgentTool, AgentContext, ToolResult } from "./types";

/* -------------------------------------------------------------------------- */
/*  Authorization helper                                                      */
/* -------------------------------------------------------------------------- */

// Resolves the effective account code for a tool call. If the user specifies
// an account scope, validate they have access to it. Otherwise, use their
// primary account.
function resolveAccountCode(
  requestedAccount: string | undefined,
  ctx: AgentContext
): string | null {
  const target = (requestedAccount ?? ctx.account).toUpperCase();

  // Verify the user has access to this account.
  const hasAccess = ctx.accounts.some(
    (a) => a.account.toUpperCase() === target
  );
  if (!hasAccess) return null;

  return target.toLowerCase();
}

// Applies role-based agent scoping to an evaluations query. Managers see all
// agents; non-managers see only agents they coach, evaluate, or lead.
// Returns null if the user has no scoped agents (empty result), otherwise
// returns the scoped agent IDs (null means manager, see all).
async function getScopedAgentIdsForAccount(
  accountId: number,
  ctx: AgentContext
): Promise<number[] | null> {
  if (isManagerRole(ctx.role as import("@/types").UserRole)) {
    return null; // null = manager, sees all
  }

  const scoped = await getScopedAgentIds(accountId, {
    employee_id: ctx.employeeId,
    role: ctx.role as import("@/types").UserRole,
  } as import("@/types").AuthUser);

  return scoped.agentIds;
}

/* -------------------------------------------------------------------------- */
/*  Tool: get_agents                                                          */
/* -------------------------------------------------------------------------- */

const getAgentsTool: AgentTool = {
  name: "get_agents",
  description:
    "List agents for a specific account. Returns agent names and basic info. " +
    "Use when the user asks about agents, team members, or who is on a team.",
  parameters: z.object({
    account: z
      .string()
      .optional()
      .describe("Account code (e.g., 'RM', 'JS'). Defaults to user's primary account."),
    limit: z
      .number()
      .int()
      .positive()
      .max(100)
      .default(50)
      .describe("Maximum number of agents to return"),
  }),
  execute: async (params, ctx) => {
    const accountCode = resolveAccountCode(params.account as string, ctx);
    if (!accountCode) {
      return {
        tool: "get_agents",
        success: false,
        error: "You do not have access to this account.",
      };
    }

    const agents = await getAccountAgents(accountCode, {
      employee_id: ctx.employeeId,
      role: ctx.role as import("@/types").UserRole,
      account: ctx.account as import("@/types").AccountLabel,
    } as import("@/types").AuthUser);

    const limited = agents.slice(0, params.limit as number);

    return {
      tool: "get_agents",
      success: true,
      data: {
        account: accountCode.toUpperCase(),
        total: agents.length,
        agents: limited.map((a) => ({
          name: a.name,
          score: a.score,
          opportunities: a.opportunities,
        })),
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  Tool: get_evaluations                                                     */
/* -------------------------------------------------------------------------- */

const getEvaluationsTool: AgentTool = {
  name: "get_evaluations",
  description:
    "Get QA evaluations with optional filters. Returns evaluation records " +
    "including scores, dates, guidelines, and agent names. Use when the user " +
    "asks about evaluations, scores, or specific evaluation records.",
  parameters: z.object({
    account: z.string().optional().describe("Account code. Defaults to user's primary account."),
    agentName: z.string().optional().describe("Filter by agent name (partial match)."),
    guideline: z.string().optional().describe("Filter by evaluation guideline (e.g., 'PHONE', 'CHAT')."),
    dateFrom: z.string().optional().describe("Start date (YYYY-MM-DD)."),
    dateTo: z.string().optional().describe("End date (YYYY-MM-DD)."),
    limit: z.number().int().positive().max(100).default(20).describe("Maximum evaluations to return"),
  }),
  execute: async (params, ctx) => {
    const accountCode = resolveAccountCode(params.account as string, ctx);
    if (!accountCode) {
      return {
        tool: "get_evaluations",
        success: false,
        error: "You do not have access to this account.",
      };
    }

    const accountId = await getAccountIdByCode(accountCode);
    if (!accountId) {
      return { tool: "get_evaluations", success: false, error: "Account not found." };
    }

    const supabase = await createServerClient();

    // Build the query step by step, casting to any to avoid Supabase's
    // complex filter builder types that are not needed for our use case.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("evaluations")
      .select("evaluation_id, agent_employee_id, qa_score, guideline, evaluation_date, ticket_bill")
      .eq("account_id", accountId)
      .order("evaluation_date", { ascending: false })
      .limit((params.limit as number) ?? 20);

    // Apply role-based scoping.
    const scopedIds = await getScopedAgentIdsForAccount(accountId, ctx);
    if (scopedIds !== null) {
      if (scopedIds.length === 0) {
        return {
          tool: "get_evaluations",
          success: true,
          data: { account: accountCode.toUpperCase(), evaluations: [], total: 0 },
        };
      }
      query = query.in("agent_employee_id", scopedIds);
    }

    // Apply optional filters.
    if (params.agentName) {
      const { data: agent } = await supabase
        .from("employees")
        .select("id")
        .ilike("employee_name", params.agentName as string)
        .maybeSingle();
      if (agent) {
        query = query.eq("agent_employee_id", agent.id);
      }
    }
    if (params.guideline) {
      query = query.ilike("guideline", params.guideline as string);
    }
    if (params.dateFrom) {
      query = query.gte("evaluation_date", params.dateFrom as string);
    }
    if (params.dateTo) {
      const endOfDay = /^\d{4}-\d{2}-\d{2}$/.test(params.dateTo as string)
        ? params.dateTo + " 23:59:59.999"
        : (params.dateTo as string);
      query = query.lte("evaluation_date", endOfDay);
    }

    const { data, error } = await query;
    if (error) {
      return { tool: "get_evaluations", success: false, error: "Failed to fetch evaluations." };
    }

    // Resolve agent names.
    const agentIds = new Set<number>();
    for (const e of data ?? []) {
      if (e.agent_employee_id != null) agentIds.add(e.agent_employee_id);
    }
    const { getEmployeeNameMap } = await import("@/lib/db/helpers");
    const names = await getEmployeeNameMap(agentIds);

    const evaluations = (data ?? []).map((e: { evaluation_id: number; agent_employee_id: number; qa_score: number | null; guideline: string | null; evaluation_date: string | null; ticket_bill: string | null }) => ({
      id: e.evaluation_id,
      date: e.evaluation_date,
      agent: names.get(e.agent_employee_id) ?? "Unknown",
      guideline: e.guideline,
      score: e.qa_score,
      ticket: e.ticket_bill,
    }));

    return {
      tool: "get_evaluations",
      success: true,
      data: {
        account: accountCode.toUpperCase(),
        total: evaluations.length,
        evaluations,
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  Tool: get_evaluation_summary                                              */
/* -------------------------------------------------------------------------- */

const getEvaluationSummaryTool: AgentTool = {
  name: "get_evaluation_summary",
  description:
    "Get an aggregated performance summary for an agent or account. " +
    "Returns average score, total evaluations, failed count, and trend. " +
    "Use when the user asks about overall performance or score summaries.",
  parameters: z.object({
    account: z.string().optional().describe("Account code. Defaults to user's primary account."),
    agentName: z.string().optional().describe("Agent name to summarize. If omitted, summarizes the whole account."),
    dateFrom: z.string().optional().describe("Start date (YYYY-MM-DD)."),
    dateTo: z.string().optional().describe("End date (YYYY-MM-DD)."),
  }),
  execute: async (params, ctx) => {
    const accountCode = resolveAccountCode(params.account as string, ctx);
    if (!accountCode) {
      return {
        tool: "get_evaluation_summary",
        success: false,
        error: "You do not have access to this account.",
      };
    }

    const accountId = await getAccountIdByCode(accountCode);
    if (!accountId) {
      return { tool: "get_evaluation_summary", success: false, error: "Account not found." };
    }

    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("evaluations")
      .select("evaluation_id, agent_employee_id, qa_score, guideline, evaluation_date")
      .eq("account_id", accountId)
      .order("evaluation_date", { ascending: false });

    // Apply role-based scoping.
    const scopedIds = await getScopedAgentIdsForAccount(accountId, ctx);
    if (scopedIds !== null) {
      if (scopedIds.length === 0) {
        return {
          tool: "get_evaluation_summary",
          success: true,
          data: { account: accountCode.toUpperCase(), summary: null, message: "No evaluations found for your scope." },
        };
      }
      query = query.in("agent_employee_id", scopedIds);
    }

    // Filter by agent if specified.
    if (params.agentName) {
      const { data: agent } = await supabase
        .from("employees")
        .select("id")
        .ilike("employee_name", params.agentName as string)
        .maybeSingle();
      if (agent) {
        query = query.eq("agent_employee_id", agent.id);
      }
    }

    // Apply date filters.
    if (params.dateFrom) {
      query = query.gte("evaluation_date", params.dateFrom as string);
    }
    if (params.dateTo) {
      const endOfDay = /^\d{4}-\d{2}-\d{2}$/.test(params.dateTo as string)
        ? params.dateTo + " 23:59:59.999"
        : (params.dateTo as string);
      query = query.lte("evaluation_date", endOfDay);
    }

    const { data, error } = await query;
    if (error) {
      return { tool: "get_evaluation_summary", success: false, error: "Failed to fetch summary." };
    }

    const evaluations = data ?? [];
    const scored = evaluations.filter((e: { qa_score: number | null }) => e.qa_score != null);
    const scores = scored.map((e: { qa_score: number }) => e.qa_score);

    const avgScore = scores.length > 0
      ? Number((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1))
      : null;
    const failedCount = scores.filter((s: number) => s < 90).length;
    const minScore = scores.length > 0 ? Math.min(...scores) : null;
    const maxScore = scores.length > 0 ? Math.max(...scores) : null;

    // Group by guideline for breakdown.
    const byGuideline: Record<string, { count: number; avg: number }> = {};
    for (const e of scored) {
      const g = (e as { guideline: string | null }).guideline ?? "Unknown";
      if (!byGuideline[g]) byGuideline[g] = { count: 0, avg: 0 };
      byGuideline[g].count += 1;
      byGuideline[g].avg += (e as { qa_score: number }).qa_score;
    }
    for (const g of Object.keys(byGuideline)) {
      byGuideline[g].avg = Number(
        (byGuideline[g].avg / byGuideline[g].count).toFixed(1)
      );
    }

    return {
      tool: "get_evaluation_summary",
      success: true,
      data: {
        account: accountCode.toUpperCase(),
        agent: params.agentName ?? "All Agents",
        totalEvaluations: evaluations.length,
        scoredEvaluations: scored.length,
        averageScore: avgScore,
        minScore,
        maxScore,
        failedEvaluations: failedCount,
        passRate: scores.length > 0
          ? (((scores.length - failedCount) / scores.length) * 100).toFixed(0) + "%"
          : "N/A",
        byGuideline,
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  Tool: get_accounts                                                        */
/* -------------------------------------------------------------------------- */

const getAccountsTool: AgentTool = {
  name: "get_accounts",
  description:
    "List all accounts the current user can access. Returns account codes " +
    "and names. Use when the user asks about available accounts or which " +
    "accounts they have access to.",
  parameters: z.object({}),
  execute: async (_params, ctx) => {
    const accounts = ctx.accounts.map((a) => ({
      code: a.account,
      role: a.role,
    }));

    return {
      tool: "get_accounts",
      success: true,
      data: {
        primary: ctx.account,
        accounts,
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  Tool: get_lobs                                                            */
/* -------------------------------------------------------------------------- */

const getLobsTool: AgentTool = {
  name: "get_lobs",
  description:
    "List lines of business (LOBs) for a specific account. LOBs represent " +
    "different business units or product lines within an account.",
  parameters: z.object({
    account: z.string().optional().describe("Account code. Defaults to user's primary account."),
  }),
  execute: async (params, ctx) => {
    const accountCode = resolveAccountCode(params.account as string, ctx);
    if (!accountCode) {
      return {
        tool: "get_lobs",
        success: false,
        error: "You do not have access to this account.",
      };
    }

    const accountId = await getAccountIdByCode(accountCode);
    if (!accountId) {
      return { tool: "get_lobs", success: false, error: "Account not found." };
    }

    const { getLobsByAccount } = await import("@/lib/db/employees");
    const lobs = await getLobsByAccount(accountId);

    return {
      tool: "get_lobs",
      success: true,
      data: {
        account: accountCode.toUpperCase(),
        lobs: lobs.map((l: { lob_id: number; lob_name: string }) => ({
          id: l.lob_id,
          name: l.lob_name,
        })),
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  Tool: get_qa_staff                                                        */
/* -------------------------------------------------------------------------- */

const getQaStaffTool: AgentTool = {
  name: "get_qa_staff",
  description:
    "List the QA analysts/coaches and team leads assigned to a specific " +
    "account. Returns the people who review or coach evaluations for that " +
    "account. Use when the user asks who the QA is, who reviews an account, " +
    "or which QA analyst/coach covers a team.",
  parameters: z.object({
    account: z
      .string()
      .optional()
      .describe("Account code (e.g., 'RM', 'JS'). Defaults to user's primary account."),
  }),
  execute: async (params, ctx) => {
    const accountCode = resolveAccountCode(params.account as string, ctx);
    if (!accountCode) {
      return {
        tool: "get_qa_staff",
        success: false,
        error: "You do not have access to this account.",
      };
    }

    const qas = await getAccountQAs(accountCode);
    const teamLeads = await getAccountTeamLeads(accountCode);

    return {
      tool: "get_qa_staff",
      success: true,
      data: {
        account: accountCode.toUpperCase(),
        qas,
        teamLeads,
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  Tool: get_agent_performance                                               */
/* -------------------------------------------------------------------------- */

const getAgentPerformanceTool: AgentTool = {
  name: "get_agent_performance",
  description:
    "Get detailed performance metrics for a specific agent. Returns score " +
    "history, averages, and evaluation breakdown. Use when the user asks " +
    "about a specific agent's performance or progress.",
  parameters: z.object({
    agentName: z.string().describe("The agent's name (partial match supported)."),
    account: z.string().optional().describe("Account code. Defaults to user's primary account."),
    limit: z.number().int().positive().max(50).default(10).describe("Maximum recent evaluations to return."),
  }),
  execute: async (params, ctx) => {
    const accountCode = resolveAccountCode(params.account as string, ctx);
    if (!accountCode) {
      return {
        tool: "get_agent_performance",
        success: false,
        error: "You do not have access to this account.",
      };
    }

    const accountId = await getAccountIdByCode(accountCode);
    if (!accountId) {
      return { tool: "get_agent_performance", success: false, error: "Account not found." };
    }

    const supabase = await createServerClient();

    // Resolve agent by name.
    const { data: agent } = await supabase
      .from("employees")
      .select("id, employee_name")
      .ilike("employee_name", params.agentName as string)
      .maybeSingle();

    if (!agent) {
      return {
        tool: "get_agent_performance",
        success: false,
        error: "Agent \"" + params.agentName + "\" not found.",
      };
    }

    // Authorization: non-managers can only see their own agents.
    if (!isManagerRole(ctx.role as import("@/types").UserRole)) {
      const scoped = await getScopedAgentIds(accountId, {
        employee_id: ctx.employeeId,
        role: ctx.role as import("@/types").UserRole,
      } as import("@/types").AuthUser);

      if (
        scoped.agentIds !== null &&
        !scoped.agentIds.includes(agent.id)
      ) {
        return {
          tool: "get_agent_performance",
          success: false,
          error: "You are not authorized to view this agent's performance.",
        };
      }
    }

    // Fetch recent evaluations.
    const { data: evaluations, error } = await supabase
      .from("evaluations")
      .select("evaluation_id, qa_score, guideline, evaluation_date, ticket_bill")
      .eq("account_id", accountId)
      .eq("agent_employee_id", agent.id)
      .order("evaluation_date", { ascending: false })
      .limit((params.limit as number) ?? 10);

    if (error) {
      return { tool: "get_agent_performance", success: false, error: "Failed to fetch performance data." };
    }

    const scores = (evaluations ?? [])
      .map((e) => e.qa_score)
      .filter((s): s is number => s != null);
    const avgScore = scores.length > 0
      ? Number((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1))
      : null;

    return {
      tool: "get_agent_performance",
      success: true,
      data: {
        agent: agent.employee_name,
        account: accountCode.toUpperCase(),
        totalEvaluations: evaluations?.length ?? 0,
        averageScore: avgScore,
        recentEvaluations: (evaluations ?? []).map((e: { evaluation_date: string | null; guideline: string | null; qa_score: number | null; ticket_bill: string | null }) => ({
          date: e.evaluation_date,
          guideline: e.guideline,
          score: e.qa_score,
          ticket: e.ticket_bill,
        })),
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  Tool: get_qa_metrics                                                      */
/* -------------------------------------------------------------------------- */

const getQaMetricsTool: AgentTool = {
  name: "get_qa_metrics",
  description:
    "Get overall QA metrics for an account: total evaluations, average score, " +
    "pass/fail counts, and top/bottom performers. Use when the user asks about " +
    "team performance, QA metrics, or account health.",
  parameters: z.object({
    account: z.string().optional().describe("Account code. Defaults to user's primary account."),
    dateFrom: z.string().optional().describe("Start date (YYYY-MM-DD)."),
    dateTo: z.string().optional().describe("End date (YYYY-MM-DD)."),
  }),
  execute: async (params, ctx) => {
    const accountCode = resolveAccountCode(params.account as string, ctx);
    if (!accountCode) {
      return {
        tool: "get_qa_metrics",
        success: false,
        error: "You do not have access to this account.",
      };
    }

    const accountId = await getAccountIdByCode(accountCode);
    if (!accountId) {
      return { tool: "get_qa_metrics", success: false, error: "Account not found." };
    }

    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("evaluations")
      .select("evaluation_id, agent_employee_id, qa_score, guideline, evaluation_date")
      .eq("account_id", accountId)
      .order("evaluation_date", { ascending: false });

    // Apply role-based scoping.
    const scopedIds = await getScopedAgentIdsForAccount(accountId, ctx);
    if (scopedIds !== null) {
      if (scopedIds.length === 0) {
        return {
          tool: "get_qa_metrics",
          success: true,
          data: { account: accountCode.toUpperCase(), metrics: null, message: "No data available for your scope." },
        };
      }
      query = query.in("agent_employee_id", scopedIds);
    }

    // Apply date filters.
    if (params.dateFrom) {
      query = query.gte("evaluation_date", params.dateFrom as string);
    }
    if (params.dateTo) {
      const endOfDay = /^\d{4}-\d{2}-\d{2}$/.test(params.dateTo as string)
        ? params.dateTo + " 23:59:59.999"
        : (params.dateTo as string);
      query = query.lte("evaluation_date", endOfDay);
    }

    const { data, error } = await query;
    if (error) {
      return { tool: "get_qa_metrics", success: false, error: "Failed to fetch metrics." };
    }

    const evaluations = data ?? [];
    const scored = evaluations.filter((e: { qa_score: number | null }) => e.qa_score != null);
    const scores = scored.map((e: { qa_score: number }) => e.qa_score);

    // Aggregate by agent for rankings.
    const agentMap = new Map<number, number[]>();
    for (const e of scored) {
      const arr = agentMap.get(e.agent_employee_id) ?? [];
      arr.push(e.qa_score);
      agentMap.set(e.agent_employee_id, arr);
    }

    const { getEmployeeNameMap } = await import("@/lib/db/helpers");
    const names = await getEmployeeNameMap(new Set(agentMap.keys()));

    const agentSummaries = [...agentMap.entries()]
      .map(([id, s]) => ({
        name: names.get(id) ?? "Unknown",
        avg: Number((s.reduce((a: number, b: number) => a + b, 0) / s.length).toFixed(1)),
        count: s.length,
      }))
      .sort((a, b) => b.avg - a.avg);

    const avgScore = scores.length > 0
      ? Number((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1))
      : null;

    return {
      tool: "get_qa_metrics",
      success: true,
      data: {
        account: accountCode.toUpperCase(),
        totalEvaluations: evaluations.length,
        scoredEvaluations: scored.length,
        averageScore: avgScore,
        failedEvaluations: scores.filter((s: number) => s < 90).length,
        topPerformers: agentSummaries.slice(0, 3),
        bottomPerformers: agentSummaries.slice(-3).reverse(),
      },
    };
  },
};

/* -------------------------------------------------------------------------- */
/*  Tool registry export                                                      */
/* -------------------------------------------------------------------------- */

// The complete set of tools available to the agent. The LLM sees these
// definitions and can call them by name with validated parameters.
export const TOOL_REGISTRY: AgentTool[] = [
  getAgentsTool,
  getEvaluationsTool,
  getEvaluationSummaryTool,
  getAccountsTool,
  getLobsTool,
  getQaStaffTool,
  getAgentPerformanceTool,
  getQaMetricsTool,
];

// Looks up a tool by name. Returns undefined if not found — the caller
// should handle this as an invalid tool call.
export function getToolByName(name: string): AgentTool | undefined {
  return TOOL_REGISTRY.find((t) => t.name === name);
}
