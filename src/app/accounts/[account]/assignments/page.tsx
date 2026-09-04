// Server page rendering the QA assignment settings for an account.
import { isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import {
  getAccountLobs,
  getAccountTeamLeads,
  getAccountEvaluators,
  getAccountCoaches,
  getAccountAvailableAgents,
  getAccountAssignmentRowsWithIds,
} from "@/lib/db/assignments";
import AssignmentSettingsView from "@/features/assignments/components/AssignmentSettingsView";

export default async function AccountAssignmentsPage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  const { account } = await params;

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

  const [lobs, teamLeads, evaluators, coaches, availableAgents, agentRows] = await Promise.all([
    getAccountLobs(account),
    getAccountTeamLeads(account),
    getAccountEvaluators(account),
    getAccountCoaches(account),
    getAccountAvailableAgents(account),
    getAccountAssignmentRowsWithIds(account, user),
  ]);

  return (
    <AssignmentSettingsView
      account={account}
      lobs={lobs}
      teamLeads={teamLeads}
      evaluators={evaluators}
      coaches={coaches}
      availableAgents={availableAgents}
      initialAgents={agentRows}
    />
  );
}
