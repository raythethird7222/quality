// Server page rendering the QA assignment settings for an account.
import { isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import {
  getAccountPeople,
  getAccountLobs,
  getAccountTeamLeads,
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

  const [people, lobs, teamLeads, agentRows] = await Promise.all([
    getAccountPeople(account),
    getAccountLobs(account),
    getAccountTeamLeads(account),
    getAccountAssignmentRowsWithIds(account, user),
  ]);

  return (
    <AssignmentSettingsView
      account={account}
      people={people}
      lobs={lobs}
      teamLeads={teamLeads}
      initialAgents={agentRows}
    />
  );
}
