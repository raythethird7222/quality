import { notFound, redirect } from "next/navigation";
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import type { UserRole } from "@/types";
import ManagerDashboard from "@/features/accounts/components/ManagerDashboard";

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
  const { account } = await params;

  if (!isValidAccount(account)) {
    notFound();
  }

  const user = await requireAuth();

  if (!MANAGER_ROLES.includes(user.role)) {
    redirect(`/accounts/${account}/dashboard`);
  }

  const config = getAccount(account);

  return (
    <ManagerDashboard
      account={config.label}
      agents={0}
      qaCount={0}
      members={[]}
    />
  );
}
