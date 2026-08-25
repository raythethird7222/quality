// Server page rendering a single evaluation detail for a person in an account.
import { notFound } from "next/navigation";
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import EvaluationDetailView from "@/features/roster/components/EvaluationDetailView";

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{
    account: string;
    slug: string;
    evaluationId: string;
  }>;
}) {
  // Resolve the route parameters (account, person slug, evaluation id).
  const { account, slug, evaluationId } = await params;

  // Stop with a 404 when the account is not configured.
  if (!isValidAccount(account)) {
    notFound();
  }

  // Authenticate the current user.
  await requireAuth();
  // Look up the account configuration (accent, label, etc.).
  const config = getAccount(account);

  // Render the evaluation detail view for the requested person and evaluation.
  return (
    <EvaluationDetailView
      account={account}
      personName={slug}
      evaluationId={evaluationId}
      accent={config.accent}
    />
  );
}
