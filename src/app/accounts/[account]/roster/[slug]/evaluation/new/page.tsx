// Server page rendering the interactive evaluation form for a person in an
// account. Matches /evaluation/new (before the dynamic [evaluationId] route)
// and streams the evaluation_param_rm checklist for the chosen guideline,
// scoped to the agent's Account + LOB.
import { notFound } from "next/navigation";
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import { slugToDisplayName } from "@/lib/utils";
import {
  buildEvaluationChecklist,
  getEvaluationParameters,
  getAgentViciLink,
  getAgentAssignment,
} from "@/lib/db/quality";
import EvaluationFormView from "@/features/roster/components/EvaluationFormView";

type NewEvaluationPageProps = {
  params: Promise<{ account: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewEvaluationPage({
  params,
  searchParams,
}: NewEvaluationPageProps) {
  const { account, slug } = await params;
  const sp = await searchParams;

  if (!isValidAccount(account)) {
    notFound();
  }

  await requireAuth();
  const config = getAccount(account);

  // Default to the guideline currently present on the account; falls back to
  // PHONE when the query param is absent.
  const guideline =
    typeof sp.guideline === "string" && sp.guideline
      ? sp.guideline
      : "PHONE";
  const day = typeof sp.day === "string" ? sp.day : undefined;
  const month = typeof sp.month === "string" ? sp.month : undefined;
  const year = typeof sp.year === "string" ? sp.year : undefined;
  const requestedLobId =
    typeof sp.lobId === "string" && sp.lobId ? Number(sp.lobId) : undefined;

  // Resolve the LOB from the account assignment. The query-string value is
  // only a fallback for older links and is never preferred over the database.
  const [assignment, viciLink] = await Promise.all([
    getAgentAssignment(account, slugToDisplayName(slug)),
    getAgentViciLink(slugToDisplayName(slug)),
  ]);
  const lobId = assignment.lobId ?? requestedLobId;

  // Fetch active parameters for this account, guideline, and assigned LOB.
  const parameters = await getEvaluationParameters(account, guideline, lobId);
  const { groups, totalScore } = buildEvaluationChecklist(parameters);

  return (
    <EvaluationFormView
      account={account}
      personName={slug}
      accent={config.accent}
      guideline={guideline}
      groups={groups}
      totalScore={totalScore}
      day={day}
      month={month}
      year={year}
      viciLink={viciLink}
    />
  );
}
