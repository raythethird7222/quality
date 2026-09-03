// Server page rendering the account management view (create account) for
// manager-level roles (QA supervisor and above).
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getAllAccounts } from "@/lib/db/accounts";
import { isManagerRole } from "@/lib/db/helpers";
import type { UserRole } from "@/types";
import CreateAccountView from "@/features/accounts-management/components/CreateAccountView";

// Roles allowed to view/create accounts on this page.
const ALLOWED_ROLES: UserRole[] = [
  "admin",
  "quality_coordinator",
  "account_manager",
  "qa_supervisor",
];

export default async function ManageAccountsPage() {
  // Authenticate the current user.
  const user = await requireAuth();

  // Only manager-level roles (QA supervisor and above) can manage accounts.
  if (!isManagerRole(user.role) || !ALLOWED_ROLES.includes(user.role)) {
    notFound();
  }

  // Load the list of existing accounts for display.
  const accounts = await getAllAccounts();

  return <CreateAccountView accounts={accounts} />;
}
