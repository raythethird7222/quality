// Server page rendering the account dashboard with roster and QA metrics.
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import {
  getAccountAgents,
  getAccountAssignmentRows,
  getAccountQaName,
} from "@/lib/db/employees";
import {
  getAccountEvaluationAnalytics,
  getCoachEvaluationPerformance,
  getEvaluatedAgentIdsForUser,
} from "@/lib/db/quality";
import { createServerClient } from "@/lib/supabase/server";
import AccountFrameworkView from "@/features/dashboard/components/AccountFrameworkView";

export default async function AccountDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ account: string }>;
  searchParams: Promise<{ qaId?: string }>;
}) {
  // Resolve the account identifier from the route parameters.
  const { account } = await params;
  const { qaId } = await searchParams;

  // Render a "not found" message when the account is not configured.
  if (!isValidAccount(account)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Account Not Found
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            The account &quot;{account}&quot; does not exist.
          </p>
        </div>
      </div>
    );
  }

  const user = await requireAuth();
  // Look up the account configuration (label, accent, etc.).
  const config = getAccount(account);

  // If a specific QA is requested via query param, look up that QA's employee info.
  let targetUser = user;
  if (qaId) {
    const supabase = await createServerClient();
    const { data: targetEmployee } = await supabase
      .from("employees")
      .select("id, employee_name")
      .eq("id", Number(qaId))
      .maybeSingle();

    if (targetEmployee) {
      targetUser = {
        ...user,
        employee_id: targetEmployee.id,
        employee_name: targetEmployee.employee_name ?? user.employee_name,
      };
    }
  }

  // Fetch all dashboard data in parallel for efficiency.
  const [
    agents,
    analytics,
    agentRows,
    qaName,
    coachHistory,
    evaluatedAgentIds,
  ] = await Promise.all([
    getAccountAgents(account, targetUser),
    getAccountEvaluationAnalytics(account, targetUser),
    getAccountAssignmentRows(account, targetUser),
    getAccountQaName(account, targetUser.employee_name),
    getCoachEvaluationPerformance(
      account,
      targetUser.employee_id,
      new Date().toISOString().slice(0, 10),
    ),
    getEvaluatedAgentIdsForUser(account, targetUser),
  ]);

  // If critical data is missing (shouldn't happen in normal flow), show a minimal loading state.
  if (!analytics || analytics.totalEvaluations === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[14px] text-text-secondary">Loading dashboard...</p>
      </div>
    );
  }

  // Overlay real evaluation scores/opportunities onto the full agent roster.
  // Build a lookup of agent performance keyed by agent name.
  const perfByName = new Map(
    analytics.agentPerformance.map((p) => [p.name, p])
  );
  // Build a set of assigned agent names from the assignment rows.
  const assignedNames = new Set(agentRows.map((r) => r.name));
  // Only include agents that have an active assignment in this account.
  const people = agents
    .filter((agent) => assignedNames.has(agent.name))
    .map((agent) => {
      const perf = perfByName.get(agent.name);
      return perf ?? agent;
    });

  // Render the dashboard view with the assembled account data.
  return (
    <AccountFrameworkView
      account={config.label}
      qaName={qaName}
      people={people}
      totalEvaluations={analytics.totalEvaluations}
      dailyTeamQaScore={
        analytics.avgScore != null ? `${analytics.avgScore.toFixed(1)}%` : "--"
      }
      failedEvaluations={analytics.failedEvaluations}
      agentRows={agentRows}
      coachHistory={coachHistory}
      evaluatedAgentIds={evaluatedAgentIds}
    />
  );
}
