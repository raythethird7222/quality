// Server page rendering the account dashboard with roster and QA metrics.
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import {
  getAccountAgents,
  getAccountAssignmentRows,
  getAccountLobNames,
  getAccountQaName,
  getAccountQAs,
  getAccountTeamLeads,
} from "@/lib/db/employees";
import { getAccountEvaluationAnalytics } from "@/lib/db/quality";
import AccountFrameworkView from "@/features/dashboard/components/AccountFrameworkView";

export default async function AccountDashboardPage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  // Resolve the account identifier from the route parameters.
  const { account } = await params;

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

  // Authenticate the current user.
  const user = await requireAuth();
  // Look up the account configuration (label, accent, etc.).
  const config = getAccount(account);

  // Fetch all dashboard data in parallel for efficiency.
  const [
    agents,
    analytics,
    qaList,
    lobOptions,
    teamLeads,
    agentRows,
    qaName,
  ] = await Promise.all([
    getAccountAgents(account),
    getAccountEvaluationAnalytics(account, user),
    getAccountQAs(account),
    getAccountLobNames(account),
    getAccountTeamLeads(account),
    getAccountAssignmentRows(account),
    getAccountQaName(account, user.employee_name),
  ]);

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
      qaList={qaList}
      lobOptions={lobOptions}
      teamLeads={teamLeads}
      agentRows={agentRows}
    />
  );
}
