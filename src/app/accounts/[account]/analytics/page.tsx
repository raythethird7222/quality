// Server page rendering the analytics view for a single account.
// This page loads analytics data scoped to today's date (Daily timeframe) and passes it
// to the client component. The client then manages real-time updates and re-fetches
// on filter changes, ensuring zero data flash between SSR and client hydration.
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import { getAccountQaName } from "@/lib/db/employees";
import { getAccountEvaluationAnalytics } from "@/lib/db/quality";
import TeamAnalyticsView from "@/features/analytics/components/TeamAnalyticsView";

/**
 * Server component that handles analytics page SSR.
 * 
 * Behaviors:
 * - Defaults to Daily timeframe anchored to today (no date navigation)
 * - Fetches analytics for the current date in SSR to match client default
 * - Passes initial data down so charts render immediately without flash
 * - Enables real-time Supabase updates via client component
 */
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

  // Authenticate the current user and verify account access.
  const user = await requireAuth();
  // Look up the account configuration (label, accent, etc.).
  const config = getAccount(account);
  // Resolve the QA specialist name for the current user in this account.
  const qaName = await getAccountQaName(account, user.employee_name);

  // Normalize to today's date to match the client default (Daily timeframe).
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Load the evaluation analytics for today (Daily) so SSR data already matches
  // the client’s active filter and prevents a visible flash/data swap.
  const analytics = await getAccountEvaluationAnalytics(account, user, {
    timeframe: "Daily",
    dateFrom: today,
    dateTo: today,
  });

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
