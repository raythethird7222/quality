import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getAllAccounts } from "@/lib/db/accounts";
import { getAccountLobs } from "@/lib/db/assignments";
import { PARAMETER_ACCOUNT_CODES } from "@/lib/db/quality";
import EvaluationParameterManagementView from "@/features/settings/components/EvaluationParameterManagementView";

export const dynamic = "force-dynamic";

export default async function EvaluationParametersPage() {
  const user = await requireAuth();
  if (user.role !== "admin" && user.role !== "qa_supervisor") notFound();

  const allAccounts = await getAllAccounts();
  const accounts = allAccounts.filter((account) =>
    PARAMETER_ACCOUNT_CODES.includes(account.account_code.toUpperCase() as (typeof PARAMETER_ACCOUNT_CODES)[number])
  );
  const lobs = Object.fromEntries(
    await Promise.all(accounts.map(async (account) => [account.account_code, await getAccountLobs(account.account_code)] as const))
  );

  return (
    <EvaluationParameterManagementView
      accounts={accounts}
      lobs={lobs}
    />
  );
}
