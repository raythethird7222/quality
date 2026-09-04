// Server page rendering the roster calendar for a single person in an account.
import { notFound } from "next/navigation";
import { isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import { slugToDisplayName } from "@/lib/utils";
import { getAgentEvaluations, getAgentAssignment } from "@/lib/db/quality";
import RosterCalendarView from "@/features/roster/components/RosterCalendarView";

export default async function RosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ account: string; slug: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  // Resolve the account and person slug from the route parameters.
  const { account, slug } = await params;
  const { scope } = await searchParams;

  // Stop with a 404 when the account is not configured.
  if (!isValidAccount(account)) {
    notFound();
  }

  // Authenticate the current user.
  const user = await requireAuth();

  // Resolve the human-readable display name from the URL slug so database
  // lookups match employee_name (e.g. "jimboy-sarte" -> "Jimboy Sarte").
  const personName = slugToDisplayName(slug);

  // Fetch real evaluation data for this agent.
  const [evaluations, assignment] = await Promise.all([
    getAgentEvaluations(account, personName),
    getAgentAssignment(account, personName),
  ]);

  // Agents opened from the Managed Coach Roster Scope are always read-only.
  // Otherwise, only the assigned Evaluator can evaluate.
  const canEvaluate =
    scope !== "coach" &&
    (Number(user.employee_id) === Number(assignment.evaluatorId) ||
      assignment.evaluatorIds.some((id) => Number(id) === Number(user.employee_id)));

  // Render the roster calendar view for the requested person.
  return (
    <RosterCalendarView
      account={account}
      personName={slug}
      evaluations={evaluations}
      canEvaluate={canEvaluate}
      lobId={assignment.lobId}
    />
  );
}
