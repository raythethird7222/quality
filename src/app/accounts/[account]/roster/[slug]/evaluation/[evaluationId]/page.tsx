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
  const { account, slug, evaluationId } = await params;

  if (!isValidAccount(account)) {
    notFound();
  }

  await requireAuth();
  const config = getAccount(account);

  return (
    <EvaluationDetailView
      account={account}
      personName={slug}
      evaluationId={evaluationId}
      accent={config.accent}
    />
  );
}
