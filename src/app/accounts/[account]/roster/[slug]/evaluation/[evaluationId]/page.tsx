// Server page rendering a single evaluation detail for a person in an account.
import { notFound } from "next/navigation";
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import {
  buildEvaluationChecklist,
  getEvaluationById,
  getEvaluationParameters,
} from "@/lib/db/quality";
import EvaluationDetailView from "@/features/roster/components/EvaluationDetailView";

type EvaluationPageProps = {
  params: Promise<{
    account: string;
    slug: string;
    evaluationId: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EvaluationPage({
  params,
  searchParams,
}: EvaluationPageProps) {
  // Resolve the route parameters (account, person slug, evaluation id) and the
  // guideline filter (which drives the checklist fetched from evaluation_param_rm).
  const { account, slug, evaluationId } = await params;
  const sp = await searchParams;
  const guideline =
    typeof sp.guideline === "string" ? sp.guideline : "PHONE";

  // Stop with a 404 when the account is not configured.
  if (!isValidAccount(account)) {
    notFound();
  }

  // Authenticate the current user.
  await requireAuth();
  // Look up the account configuration (accent, label, etc.).
  const config = getAccount(account);

  // Fetch the active checklist for this account + guideline, scoped to LOB.
  const requestedLobId =
    typeof sp.lobId === "string" && sp.lobId ? Number(sp.lobId) : undefined;
  const evaluation = await getEvaluationById(Number(evaluationId));
  const lobId = evaluation?.lob_id ?? requestedLobId;
  const parameters = await getEvaluationParameters(account, guideline, lobId);
  const { groups, totalScore } = buildEvaluationChecklist(parameters);

  // Build a lookup of checked parameter IDs from the stored evaluation.
  const checkedParams = evaluation?.checkbox_results ?? {};

  // Convert the checklist groups into the AttributeGroup shape expected by the
  // read-only view, marking clauses checked based on stored checkbox_results.
  const attributeGroups = groups.map((group) => ({
    code: group.code,
    bracket: String(group.clauses.reduce((sum, c) => sum + c.score, 0)),
    clauses: group.clauses.map((clause) => ({
      code: clause.code,
      description: clause.description,
      checked: checkedParams[String(clause.id)] ?? false,
    })),
  }));

  // Use the stored score if available, otherwise fall back to the checklist total.
  const displayScore = evaluation?.qa_score ?? totalScore;

  // Render the evaluation detail view for the requested person and evaluation.
  return (
    <EvaluationDetailView
      account={account}
      personName={slug}
      evaluationId={evaluationId}
      accent={config.accent}
      guideline={evaluation?.guideline ?? guideline}
      groups={attributeGroups}
      totalScore={displayScore}
      notes={evaluation?.notes ?? ""}
      ticketBill={evaluation?.ticket_bill ?? ""}
      evaluationDate={evaluation?.evaluation_date ?? ""}
    />
  );
}
