// Page: the authenticated dashboard entry point that loads overview data for the current user.
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/db/employees";
import Dashboard from "@/features/dashboard/components/Dashboard";

// Server component that guards the route, fetches the dashboard overview, and renders the dashboard.
export default async function DashboardPage() {
  // Resolve the authenticated user for this session.
  const user = await getAuthUser();
  // Redirect unauthenticated visitors to the login page.
  if (!user) {
    redirect("/login");
  }

  // Load the dashboard overview metrics for the current user.
  const overview = await getDashboardOverview(user);

  return <Dashboard user={user} overview={overview} />;
}
