// Server page rendering the analytics view for a single account.
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import { getAccountQaName } from "@/lib/db/employees";
import { getAccountEvaluationAnalytics } from "@/lib/db/quality";
import TeamAnalyticsView from "@/features/analytics/components/TeamAnalyticsView";

export default async function AccountAnalyticsPage({
  params,
}: {
  params: Promise<{ account: string }>;
}) {
  // Resolve the account identifier from the route parameters.
  const { account } = await params;

  // Render a "not found" message when the account is not configured.
  if (!isValidAccount(account)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Account Not Found
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            The account &quot;{account}&quot; does not exist.
          </p>
        </div>
      </div>
    );
  }

  // Authenticate the current user.
  const user = await requireAuth();
  // Look up the account configuration (label, accent, etc.).
  const config = getAccount(account);
  // Resolve the QA specialist name for the current user in this account.
  const qaName = await getAccountQaName(account, user.employee_name);
  // Load the evaluation analytics aggregated for the account.
  const analytics = await getAccountEvaluationAnalytics(account, user);

  // Render the analytics view with the loaded account data.
  return (
    <TeamAnalyticsView
      account={config.label}
      qaName={qaName}
      trendData={analytics.trendData}
      pieData={analytics.pieData}
      barData={analytics.barData}
      rankingData={analytics.rankingData}
      filterOptions={analytics.filterOptions}
    />
  );
}
