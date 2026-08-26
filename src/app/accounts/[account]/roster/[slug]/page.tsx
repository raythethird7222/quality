// Server page rendering the roster calendar for a single person in an account.
import { notFound } from "next/navigation";
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import { getAgentEvaluations } from "@/lib/db/quality";
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
  await requireAuth();
  // Look up the account configuration (accent, label, etc.).
  const config = getAccount(account);

  // Fetch real evaluation data for this agent.
  const evaluations = await getAgentEvaluations(account, slug);

  // Render the roster calendar view for the requested person.
  return (
    <RosterCalendarView
      account={account}
      personName={slug}
      accent={config.accent}
      evaluations={evaluations}
    />
  );
}
