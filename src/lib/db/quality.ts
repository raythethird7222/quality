// Quality data access: queries for QA evaluations, parameters, covers, MQPM
// performance, and the analytics aggregations that power the dashboards.

import { unstable_cache } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import type { AuthUser, UserRole } from "@/types";

// Manager-level roles see the full analytics picture for the account;
// everyone else is scoped to the agents they coach / lead / evaluate.
// Roles that see the full analytics picture for an account.
const MANAGER_ROLES: UserRole[] = [
  "admin",
  "account_manager",
  "quality_coordinator",
  "qa_supervisor",
];

// Returns true when the given role is a manager-level role.
function isManagerRole(role: UserRole | undefined): boolean {
  return role != null && MANAGER_ROLES.includes(role);
}

// Resolves an account's numeric id from its (case-insensitive) code.
export async function getAccountIdByCode(accountCode: string): Promise<number | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("account_id, account_code")
    .ilike("account_code", accountCode)
    .maybeSingle();
  if (error || !data) return null;
  return data.account_id;
}

// Returns all employee statuses ordered by name.
export async function getStatuses(): Promise<
  { status_id: number; status_name: string }[]
> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("statuses")
    .select("status_id, status_name")
    .order("status_name", { ascending: true });
  if (error) {
    console.error("Error fetching statuses:", error);
    return [];
  }
  return (data ?? []) as { status_id: number; status_name: string }[];
}

// Returns all QA evaluations for an account, newest first.
export async function getQaEvaluationsByAccount(accountCode: string) {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("rm_qa_evaluations")
    .select(
      "evaluation_id, source_evaluation_id, evaluation_type, account_id, lob_id, agent_employee_id, qa_coach_employee_id, qa_evaluator_employee_id, team_lead_employee_id, source_team_lead_name, guideline, evaluation_date, ticket_bill, qa_score, opportunities, notes, submission_datetime, edited_datetime, source_table, created_at"
    )
    .eq("account_id", accountId)
    .order("evaluation_date", { ascending: false });
  if (error) {
    console.error("Error fetching QA evaluations:", error);
    return [];
  }
  return (data ?? []) as import("@/types/database").RmQaEvaluation[];
}

// Returns all QA parameters (guidelines) for an account.
export async function getQaParametersByAccount(accountCode: string) {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("rm_qa_parameters")
    .select(
      "parameter_id, account_id, lob_id, guideline, attributes, clauses, score, compound, description"
    )
    .eq("account_id", accountId)
    .order("guideline", { ascending: true });
  if (error) {
    console.error("Error fetching QA parameters:", error);
    return [];
  }
  return (data ?? []) as import("@/types/database").RmQaParameter[];
}

// Returns covers for an account, resolved via its LOBs.
export async function getCoversByAccount(accountCode: string) {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];
  const supabase = createServerClient();

  const { data: lobs, error: lobError } = await supabase
    .from("lobs")
    .select("lob_id, account_id")
    .eq("account_id", accountId);
  if (lobError || !lobs || lobs.length === 0) return [];

  const lobIds = lobs.map((l) => l.lob_id);
  const { data, error } = await supabase
    .from("rm_covers")
    .select("cover_id, employee_id, cover_name, lob_id")
    .in("lob_id", lobIds)
    .order("cover_name", { ascending: true });
  if (error) {
    console.error("Error fetching covers:", error);
    return [];
  }
  return (data ?? []) as import("@/types/database").RmCover[];
}

// Returns MQPM performance records for an account, newest month first.
export async function getMqpmPerformanceByAccount(accountCode: string) {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("rm_mqpm_performance")
    .select(
      "mqpm_id, employee_id, account_id, qa_coach_employee_id, performance_month, mtd_qa_average, product_score, penalty, score_difference, mqpm_score, rating, process_compliance, failed_evaluations, previous_mqpm_score, previous_score_difference, opportunities"
    )
    .eq("account_id", accountId)
    .order("performance_month", { ascending: false });
  if (error) {
    console.error("Error fetching MQPM performance:", error);
    return [];
  }
  return (data ?? []) as import("@/types/database").RmMqpmPerformance[];
}

// Filter options for analytics queries.
export type AnalyticsFilters = {
  lob?: string;
  guideline?: string;
  timeframe?: string;
  dateFrom?: string;
  dateTo?: string;
  // When set, scope results to agents assigned to this QA (as coach or evaluator).
  qaEmployeeId?: number;
};

// Filter options returned to the frontend for populating dropdowns.
export type AnalyticsFilterOptions = {
  lobOptions: string[];
  guidelineOptions: string[];
};

// Aggregated analytics for an account: scores, trends, distributions, rankings.
export type EvaluationAnalytics = {
  totalEvaluations: number;
  avgScore: number | null;
  failedEvaluations: number;
  trendData: { date: string; value: number }[];
  pieData: { name: string; value: number; fill: string }[];
  barData: { defect: string; count: number }[];
  rankingData: {
    rank: number;
    name: string;
    score: string;
    evaluations: number;
    trend: number[];
  }[];
  agentPerformance: {
    name: string;
    score: string;
    opportunities: number;
  }[];
  filterOptions: AnalyticsFilterOptions;
};

const PIE_FILLS = [
  "#6B7280",
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
];

// Computes the full evaluation analytics for an account, scoped to the
// caller's role (managers see everything; others see only their agents).
export async function getAccountEvaluationAnalytics(
  accountCode: string,
  user?: AuthUser,
  filters?: AnalyticsFilters
): Promise<EvaluationAnalytics> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) {
    return {
      totalEvaluations: 0,
      avgScore: null,
      failedEvaluations: 0,
      trendData: [],
      pieData: [],
      barData: [],
      rankingData: [],
      agentPerformance: [],
      filterOptions: { lobOptions: [], guidelineOptions: [] },
    };
  }

  const manager = isManagerRole(user?.role);

  const supabase = createServerClient();

  let query = supabase
    .from("rm_qa_evaluations")
    .select(
      "evaluation_id, agent_employee_id, qa_score, guideline, evaluation_date, lob_id"
    )
    .order("evaluation_date", { ascending: true });

  if (manager) {
    query = query.eq("account_id", accountId);
  } else {
    query = query.eq("account_id", accountId);
    if (user) {
      const { data: scopedAssignments } = await supabase
        .from("agent_assignments")
        .select("agent_employee_id")
        .eq("account_id", accountId)
        .or(
          `qa_coach_employee_id.eq.${user.employee_id},qa_evaluator_employee_id.eq.${user.employee_id},team_lead_employee_id.eq.${user.employee_id}`
        );

      const scopedAgentIds = [
        ...new Set(
          (scopedAssignments ?? [])
            .map((a) => a.agent_employee_id)
            .filter((id): id is number => id != null)
        ),
      ];

      if (scopedAgentIds.length === 0) {
        return {
          totalEvaluations: 0,
          avgScore: null,
          failedEvaluations: 0,
          trendData: [],
          pieData: [],
          barData: [],
          rankingData: [],
          agentPerformance: [],
          filterOptions: { lobOptions: [], guidelineOptions: [] },
        };
      }

      query = query.in("agent_employee_id", scopedAgentIds);
    }
  }

  // Apply date range filters at the database level for performance.
  if (filters?.dateFrom) {
    query = query.gte("evaluation_date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    // Make the upper bound inclusive of the whole day. evaluation_date may be
    // stored as a timestamp, so a bare YYYY-MM-DD upper bound would exclude
    // everything after midnight of that day.
    const endOfDay = /^\d{4}-\d{2}-\d{2}$/.test(filters.dateTo)
      ? `${filters.dateTo} 23:59:59.999`
      : filters.dateTo;
    query = query.lte("evaluation_date", endOfDay);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching evaluation analytics:", error);
    return {
      totalEvaluations: 0,
      avgScore: null,
      failedEvaluations: 0,
      trendData: [],
      pieData: [],
      barData: [],
      rankingData: [],
      agentPerformance: [],
      filterOptions: { lobOptions: [], guidelineOptions: [] },
    };
  }

  const evaluations = data as {
    evaluation_id: number;
    agent_employee_id: number;
    qa_score: number | null;
    guideline: string | null;
    evaluation_date: string | null;
    lob_id: number | null;
  }[];

  const [{ data: employees }, { data: lobs }] = await Promise.all([
    supabase.from("employees").select("id, employee_name"),
    supabase.from("lobs").select("lob_id, lob_name").eq("account_id", accountId),
  ]);

  // Maps employee id to display name for ranking/agent performance output.
  const employeeName = new Map<number, string>(
    (employees ?? []).map((e) => [e.id, e.employee_name ?? "Unknown"])
  );
  // Maps LOB id to display name for the structural defect distribution.
  const lobName = new Map<number, string>(
    (lobs ?? []).map((l) => [l.lob_id, l.lob_name])
  );
  // Build reverse map: lob_name → lob_id for filter lookups.
  const lobIdByName = new Map<string, number>(
    (lobs ?? []).map((l) => [l.lob_name, l.lob_id])
  );

  // Collect distinct LOB and guideline options for filter dropdowns.
  const lobOptionSet = new Set<string>();
  const guidelineOptionSet = new Set<string>();
  for (const e of evaluations) {
    if (e.lob_id != null) {
      const name = lobName.get(e.lob_id);
      if (name) lobOptionSet.add(name);
    }
    if (e.guideline?.trim()) guidelineOptionSet.add(e.guideline.trim());
  }
  const lobOptions = [...lobOptionSet].sort();
  const guidelineOptions = [...guidelineOptionSet].sort();

  // Apply LOB filter post-fetch (lob_id ↔ lob_name join).
  let filtered = evaluations;
  if (filters?.lob && filters.lob !== "All LOBs") {
    const targetLobId = lobIdByName.get(filters.lob);
    if (targetLobId != null) {
      filtered = filtered.filter((e) => e.lob_id === targetLobId);
    }
  }
  // Apply guideline filter post-fetch.
  if (filters?.guideline && filters.guideline !== "All Guidelines") {
    filtered = filtered.filter(
      (e) => e.guideline?.trim() === filters.guideline
    );
  }

  // Evaluations that actually carry a QA score (used for averages/defects).
  const scored = filtered.filter(
    (e): e is typeof e & { qa_score: number } => e.qa_score != null
  );

  const totalEvaluations = filtered.length;
  const avgScore =
    scored.length > 0
      ? scored.reduce((s, e) => s + e.qa_score, 0) / scored.length
      : null;
  const failedEvaluations = scored.filter((e) => e.qa_score < 90).length;

  // Group scores into buckets based on the selected timeframe.
  function getDateKey(dateStr: string, tf: string): string {
    if (!dateStr) return "Unknown";
    const d = new Date(dateStr);
    if (tf === "Weekly") {
      // ISO week: start from Monday.
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      return monday.toISOString().slice(0, 10);
    }
    if (tf === "Monthly") return dateStr.slice(0, 7);
    if (tf === "Quarterly") {
      const q = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}-Q${q}`;
    }
    if (tf === "Yearly") return dateStr.slice(0, 4);
    // Daily (default)
    return dateStr;
  }

  const tf = filters?.timeframe ?? "Daily";
  // Trend: average QA score per bucket.
  const trendMap = new Map<string, { sum: number; n: number }>();
  for (const e of scored) {
    if (!e.evaluation_date) continue;
    const key = getDateKey(e.evaluation_date, tf);
    const cur = trendMap.get(key) ?? { sum: 0, n: 0 };
    cur.sum += e.qa_score;
    cur.n += 1;
    trendMap.set(key, cur);
  }
  const trendData = [...trendMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, value: Number((v.sum / v.n).toFixed(2)) }));

  // Pie: evaluation volume allocation by guideline (e.g. PHONE / CHAT / CXL).
  const guidelineMap = new Map<string, number>();
  for (const e of filtered) {
    const key = e.guideline?.trim() || "Unspecified";
    guidelineMap.set(key, (guidelineMap.get(key) ?? 0) + 1);
  }
  const pieData = [...guidelineMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({
      name,
      value,
      fill: PIE_FILLS[i % PIE_FILLS.length],
    }));

  // Bar: structural defect distribution = count of below-standard (<90%)
  // evaluations per LOB.
  const defectMap = new Map<string, number>();
  for (const e of scored) {
    if (e.qa_score >= 90) continue;
    const key =
      e.lob_id != null ? (lobName.get(e.lob_id) ?? "Unknown") : "Unassigned";
    defectMap.set(key, (defectMap.get(key) ?? 0) + 1);
  }
  const barData = [...defectMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([defect, count]) => ({ defect, count }));

  // Ranking + agent performance: grouped by agent.
  const agentMap = new Map<
    number,
    { scores: number[]; count: number }
  >();
  for (const e of filtered) {
    if (e.agent_employee_id == null) continue;
    const cur = agentMap.get(e.agent_employee_id) ?? { scores: [], count: 0 };
    cur.count += 1;
    if (e.qa_score != null) cur.scores.push(e.qa_score);
    agentMap.set(e.agent_employee_id, cur);
  }

  const agentRows = [...agentMap.entries()]
    .map(([id, v]) => {
      const avg = v.scores.length
        ? v.scores.reduce((s, x) => s + x, 0) / v.scores.length
        : 0;
      return {
        id,
        name: employeeName.get(id) ?? "Unknown",
        avg,
        count: v.count,
        trend: v.scores,
      };
    })
    .sort((a, b) => b.avg - a.avg);

  const rankingData = agentRows.map((r, i) => ({
    rank: i + 1,
    name: r.name,
    score: `${r.avg.toFixed(1)}%`,
    evaluations: r.count,
    trend: r.trend,
  }));

  const agentPerformance = agentRows.map((r) => ({
    name: r.name,
    score: `${r.avg.toFixed(1)}%`,
    opportunities: r.count,
  }));

  return {
    totalEvaluations,
    avgScore,
    failedEvaluations,
    trendData,
    pieData,
    barData,
    rankingData,
    agentPerformance,
    filterOptions: { lobOptions, guidelineOptions },
  };
}

// A single evaluation record for the month modal: denormalized with display names.
export type AccountEvaluationRow = {
  evaluationId: number;
  evaluationDate: string | null;
  agentName: string;
  coachName: string;
  evaluatorName: string;
  guideline: string | null;
  qaScore: number | null;
  ticketBill: string | null;
};

// Returns the raw evaluations for an account within a date period, scoped to the
// caller's role (managers see everything; others see only their agents). Used by
// the calendar "Evaluate" modal to list evaluations for a selected month.
export async function getAccountEvaluationsForPeriod(
  accountCode: string,
  user?: AuthUser,
  dateFrom?: string,
  dateTo?: string
): Promise<AccountEvaluationRow[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];

  const manager = isManagerRole(user?.role);
  const supabase = createServerClient();

  let query = supabase
    .from("rm_qa_evaluations")
    .select(
      "evaluation_id, agent_employee_id, qa_coach_employee_id, qa_evaluator_employee_id, guideline, evaluation_date, qa_score, ticket_bill"
    )
    .order("evaluation_date", { ascending: false });

  if (manager) {
    query = query.eq("account_id", accountId);
  } else {
    query = query.eq("account_id", accountId);
    if (user) {
      const { data: scopedAssignments } = await supabase
        .from("agent_assignments")
        .select("agent_employee_id")
        .eq("account_id", accountId)
        .or(
          `qa_coach_employee_id.eq.${user.employee_id},qa_evaluator_employee_id.eq.${user.employee_id},team_lead_employee_id.eq.${user.employee_id}`
        );

      const scopedAgentIds = [
        ...new Set(
          (scopedAssignments ?? [])
            .map((a) => a.agent_employee_id)
            .filter((id): id is number => id != null)
        ),
      ];

      if (scopedAgentIds.length === 0) return [];
      query = query.in("agent_employee_id", scopedAgentIds);
    }
  }

  // Apply date range filters at the database level for performance.
  if (dateFrom) {
    query = query.gte("evaluation_date", dateFrom);
  }
  if (dateTo) {
    // Make the upper bound inclusive of the whole day.
    const endOfDay = /^\d{4}-\d{2}-\d{2}$/.test(dateTo)
      ? `${dateTo} 23:59:59.999`
      : dateTo;
    query = query.lte("evaluation_date", endOfDay);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("Error fetching period evaluations:", error);
    return [];
  }

  // Resolve display names for agents, coaches, and evaluators.
  const ids = new Set<number>();
  for (const e of data) {
    if (e.agent_employee_id != null) ids.add(e.agent_employee_id);
    if (e.qa_coach_employee_id != null) ids.add(e.qa_coach_employee_id);
    if (e.qa_evaluator_employee_id != null) ids.add(e.qa_evaluator_employee_id);
  }
  const { data: employees } = await supabase
    .from("employees")
    .select("id, employee_name")
    .in("id", [...ids]);
  const nameById = new Map<number, string>(
    (employees ?? []).map((e) => [e.id, e.employee_name ?? "Unknown"])
  );

  return (data as Array<{
    evaluation_id: number;
    agent_employee_id: number | null;
    qa_coach_employee_id: number | null;
    qa_evaluator_employee_id: number | null;
    guideline: string | null;
    evaluation_date: string | null;
    qa_score: number | null;
    ticket_bill: string | null;
  }>).map((e) => ({
    evaluationId: e.evaluation_id,
    evaluationDate: e.evaluation_date,
    agentName: e.agent_employee_id != null
      ? (nameById.get(e.agent_employee_id) ?? "Unknown")
      : "Unknown",
    coachName: e.qa_coach_employee_id != null
      ? (nameById.get(e.qa_coach_employee_id) ?? "Unknown")
      : "Unknown",
    evaluatorName: e.qa_evaluator_employee_id != null
      ? (nameById.get(e.qa_evaluator_employee_id) ?? "Unknown")
      : "Unknown",
    guideline: e.guideline,
    qaScore: e.qa_score,
    ticketBill: e.ticket_bill,
  }));
}

// Aggregated chart analytics across multiple accounts for the main dashboard.
export type DashboardChartAnalytics = {
  trendData: { month: string; score: number }[];
  barData: { defect: string; count: number }[];
  avgScore: number | null;
};

const TREND_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Cached 2 minutes — heavy evaluation aggregation across all accounts.
export const getDashboardChartAnalytics = unstable_cache(
  async (
    accountCodes: string[],
    user?: AuthUser
  ): Promise<DashboardChartAnalytics> => {
  if (accountCodes.length === 0) {
    return { trendData: [], barData: [], avgScore: null };
  }

  const supabase = createServerClient();

  // Resolve all account ids from the provided codes.
  const { data: accounts } = await supabase
    .from("accounts")
    .select("account_id, account_code")
    .in("account_code", accountCodes);

  if (!accounts || accounts.length === 0) {
    return { trendData: [], barData: [], avgScore: null };
  }

  const accountIds = accounts.map((a) => a.account_id);

  // Non-manager users (e.g. QA agents) see only the agents under them;
  // managers/supervisors/admins see all evaluations.
  let scopedAgentIds: number[] | null = null;
  if (user && !isManagerRole(user.role)) {
    const { data: scopedAssignments } = await supabase
      .from("agent_assignments")
      .select("agent_employee_id")
      .in("account_id", accountIds)
      .or(
        `qa_coach_employee_id.eq.${user.employee_id},qa_evaluator_employee_id.eq.${user.employee_id},team_lead_employee_id.eq.${user.employee_id}`
      );

    scopedAgentIds = [
      ...new Set(
        (scopedAssignments ?? [])
          .map((a) => a.agent_employee_id)
          .filter((id): id is number => id != null)
      ),
    ];
  }

  // Fetch all evaluations for the relevant accounts.
  let query = supabase
    .from("rm_qa_evaluations")
    .select("evaluation_id, account_id, lob_id, qa_score, evaluation_date")
    .in("account_id", accountIds)
    .order("evaluation_date", { ascending: true });

  if (scopedAgentIds) {
    if (scopedAgentIds.length === 0) {
      return { trendData: [], barData: [], avgScore: null };
    }
    query = query.in("agent_employee_id", scopedAgentIds);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return { trendData: [], barData: [], avgScore: null };
  }

  const evaluations = data as {
    evaluation_id: number;
    account_id: number;
    lob_id: number | null;
    qa_score: number | null;
    evaluation_date: string | null;
  }[];

  // Load LOB names for defect distribution labels.
  const { data: lobs } = await supabase
    .from("lobs")
    .select("lob_id, lob_name")
    .in("account_id", accountIds);

  const lobName = new Map<number, string>(
    (lobs ?? []).map((l) => [l.lob_id, l.lob_name])
  );

  const scored = evaluations.filter(
    (e): e is typeof e & { qa_score: number } => e.qa_score != null
  );

  // Average score across all scored evaluations.
  const avgScore =
    scored.length > 0
      ? Number(
          (scored.reduce((s, e) => s + e.qa_score, 0) / scored.length).toFixed(2)
        )
      : null;

  // Trend: average QA score per month, grouped by year-month.
  const monthMap = new Map<string, { sum: number; n: number }>();
  for (const e of scored) {
    if (!e.evaluation_date) continue;
    // Extract YYYY-MM for grouping, then format as "Mon YYYY" label.
    const parts = e.evaluation_date.split("-");
    if (parts.length < 2) continue;
    const key = `${parts[0]}-${parts[1]}`;
    const cur = monthMap.get(key) ?? { sum: 0, n: 0 };
    cur.sum += e.qa_score;
    cur.n += 1;
    monthMap.set(key, cur);
  }
  const trendData = [...monthMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => {
      const [, monthPart] = key.split("-");
      const monthIndex = parseInt(monthPart, 10) - 1;
      const label = TREND_MONTHS[monthIndex] ?? key;
      return { month: label, score: Number((v.sum / v.n).toFixed(2)) };
    });

  // Bar: structural defect distribution = count of below-standard (<90%)
  // evaluations per LOB across all accounts.
  const defectMap = new Map<string, number>();
  for (const e of scored) {
    if (e.qa_score >= 90) continue;
    const key =
      e.lob_id != null ? (lobName.get(e.lob_id) ?? "Unknown") : "Unassigned";
    defectMap.set(key, (defectMap.get(key) ?? 0) + 1);
  }
  const barData = [...defectMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([defect, count]) => ({ defect, count }));

  return { trendData, barData, avgScore };
  },
  ["dashboard", "chart-analytics"],
  { revalidate: 120, tags: ["dashboard", "evaluations"] }
);

// Returns evaluations for a specific agent within an account, for the roster calendar.
export type AgentEvaluation = {
  evaluation_id: number;
  evaluation_date: string | null;
  qa_score: number | null;
  guideline: string | null;
  lob_id: number | null;
  agent_employee_id: number | null;
};

// Returns the coach and evaluator employee IDs assigned to an agent.
export async function getAgentAssignment(
  accountCode: string,
  agentName: string
): Promise<{ coachId: number | null; evaluatorId: number | null }> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return { coachId: null, evaluatorId: null };
  const supabase = createServerClient();

  const { data: agent } = await supabase
    .from("employees")
    .select("id")
    .ilike("employee_name", agentName)
    .maybeSingle();

  if (!agent) return { coachId: null, evaluatorId: null };

  const { data: assignment } = await supabase
    .from("agent_assignments")
    .select("qa_coach_employee_id, qa_evaluator_employee_id")
    .eq("account_id", accountId)
    .eq("agent_employee_id", agent.id)
    .maybeSingle();

  return {
    coachId: assignment?.qa_coach_employee_id ?? null,
    evaluatorId: assignment?.qa_evaluator_employee_id ?? null,
  };
}

export async function getAgentEvaluations(
  accountCode: string,
  agentName: string
): Promise<AgentEvaluation[]> {
  const accountId = await getAccountIdByCode(accountCode);
  if (!accountId) return [];

  const supabase = createServerClient();

  // Resolve the agent's employee id by name within this account.
  const { data: agent } = await supabase
    .from("employees")
    .select("id")
    .ilike("employee_name", agentName)
    .maybeSingle();

  if (!agent) return [];

  const { data, error } = await supabase
    .from("rm_qa_evaluations")
    .select(
      "evaluation_id, evaluation_date, qa_score, guideline, lob_id, agent_employee_id"
    )
    .eq("account_id", accountId)
    .eq("agent_employee_id", agent.id)
    .order("evaluation_date", { ascending: false });

  if (error) {
    console.error("Error fetching agent evaluations:", error);
    return [];
  }
  return (data ?? []) as AgentEvaluation[];
}

// Returns all assignment reporting (supervisor relationships), newest first.
export async function getAssignmentReporting() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("assignment_reporting")
    .select(
      "id, employee_assignment_id, relationship_type, supervisor_employee_id, effective_from, effective_to, created_at, updated_at"
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching assignment reporting:", error);
    return [];
  }
  return (data ?? []) as import("@/types/database").AssignmentReporting[];
}
