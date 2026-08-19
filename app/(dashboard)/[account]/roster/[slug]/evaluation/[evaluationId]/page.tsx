import EvaluationDetailView from "@/features/roster/components/EvaluationDetailView";

const accentMap: Record<string, "gold" | "indigo" | "crimson" | "charcoal"> = {
  js: "gold",
  dft: "indigo",
  rm: "indigo",
  bf: "charcoal",
};

export default async function EvaluationPage({ params }: { params: Promise<{ account: string; slug: string; evaluationId: string }> }) {
  const { account, slug, evaluationId } = await params;
  const accent = accentMap[account] ?? "indigo";

  return <EvaluationDetailView account={account} personName={slug} evaluationId={evaluationId} accent={accent} />;
}
