// Server page rendering the manager dashboard for an account (manager roles only).
import { notFound, redirect } from "next/navigation";
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import { getAccountTeamOverview } from "@/lib/db/employees";
import type { UserRole } from "@/types";
import ManagerDashboard from "@/features/accounts/components/ManagerDashboard";

// Roles that are allowed to view the manager dashboard for an account.
const MANAGER_ROLES: UserRole[] = [
  "account_manager",
  "qa_supervisor",
  "quality_coordinator",
];

export default async function AccountPage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  // Resolve the account identifier from the route parameters.
  const { account } = await params;

  // Stop with a 404 when the account is not configured.
  if (!isValidAccount(account)) {
    notFound();
  }

  // Authenticate the current user.
  const user = await requireAuth();

  // Redirect non-manager roles to the standard dashboard view.
  if (!MANAGER_ROLES.includes(user.role)) {
    redirect(`/accounts/${account}/dashboard`);
  }

  // Look up the account configuration (label, accent, etc.).
  const config = getAccount(account);
  // Load the team overview (agents, QA count, members) for the account.
  const overview = await getAccountTeamOverview(account, user);

  // Render the manager dashboard with the assembled account data.
  return (
    <ManagerDashboard
      account={config.label}
      agents={overview.agents}
      inactiveAgents={overview.inactiveAgents}
      qaCount={overview.qaCount}
      members={overview.members}
    />
  );
}
