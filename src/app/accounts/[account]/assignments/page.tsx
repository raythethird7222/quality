// Server page rendering the QA assignment settings for an account.
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import {
  getAccountLobNames,
  getAccountQAs,
  getAccountAssignmentRows,
  getAccountTeamLeads,
} from "@/lib/db/employees";
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
  const config = getAccount(account);

  const [
    qaList,
    lobOptions,
    agentRows,
    teamLeads,
  ] = await Promise.all([
    getAccountQAs(account),
    getAccountLobNames(account),
    getAccountAssignmentRows(account, user),
    getAccountTeamLeads(account),
  ]);

  return (
    <AssignmentSettingsView
      account={config.label}
      qaList={qaList}
      lobOptions={lobOptions}
      teamLeads={teamLeads}
      initialAgents={agentRows}
    />
  );
}
