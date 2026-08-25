// Quality data access: queries for QA evaluations, parameters, covers, MQPM
// performance, and the analytics aggregations that power the dashboards.

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
async function getAccountIdByCode(accountCode: string): Promise<number | null> {
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
  user?: AuthUser
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
    // Managers / supervisors see the full analytics for this account
    // (each account's data is distinct).
    query = query.eq("account_id", accountId);
  } else if (user) {
    // Everyone else only sees the evaluations tied to the agents they
    // coach, lead, or evaluate.
    query = query
      .eq("account_id", accountId)
      .or(
        `qa_coach_employee_id.eq.${user.employee_id},team_lead_employee_id.eq.${user.employee_id},qa_evaluator_employee_id.eq.${user.employee_id},agent_employee_id.eq.${user.employee_id}`
      );
  } else {
    query = query.eq("account_id", accountId);
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

  // Evaluations that actually carry a QA score (used for averages/defects).
  const scored = evaluations.filter(
    (e): e is typeof e & { qa_score: number } => e.qa_score != null
  );

  const totalEvaluations = evaluations.length;
  const avgScore =
    scored.length > 0
      ? scored.reduce((s, e) => s + e.qa_score, 0) / scored.length
      : null;
  const failedEvaluations = scored.filter((e) => e.qa_score < 90).length;

  // Trend: average QA score per evaluation day.
  const trendMap = new Map<string, { sum: number; n: number }>();
  for (const e of scored) {
    if (!e.evaluation_date) continue;
    const cur = trendMap.get(e.evaluation_date) ?? { sum: 0, n: 0 };
    cur.sum += e.qa_score;
    cur.n += 1;
    trendMap.set(e.evaluation_date, cur);
  }
  const trendData = [...trendMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, value: Number((v.sum / v.n).toFixed(2)) }));

  // Pie: evaluation volume allocation by guideline (e.g. PHONE / CHAT / CXL).
  const guidelineMap = new Map<string, number>();
  for (const e of evaluations) {
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
  for (const e of evaluations) {
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
  };
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
