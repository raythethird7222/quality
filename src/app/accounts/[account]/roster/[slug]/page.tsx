// Server page rendering the roster calendar for a single person in an account.
import { notFound } from "next/navigation";
import { isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import { getAgentEvaluations, getAgentAssignment } from "@/lib/db/quality";
import RosterCalendarView from "@/features/roster/components/RosterCalendarView";

export default async function RosterPage({
  params,
}: {
  params: Promise<{ account: string; slug: string }>;
}) {
  // Resolve the account and person slug from the route parameters.
  const { account, slug } = await params;

  // Stop with a 404 when the account is not configured.
  if (!isValidAccount(account)) {
    notFound();
  }

  // Authenticate the current user.
  const user = await requireAuth();

  // Fetch real evaluation data for this agent.
  const [evaluations, assignment] = await Promise.all([
    getAgentEvaluations(account, slug),
    getAgentAssignment(account, slug),
  ]);

  // Only the assigned Evaluator can evaluate. Coaches get read-only access.
  const canEvaluate = user.employee_id === assignment.evaluatorId;

  // Render the roster calendar view for the requested person.
  return (
    <RosterCalendarView
      account={account}
      personName={slug}
      evaluations={evaluations}
      canEvaluate={canEvaluate}
    />
  );
}
