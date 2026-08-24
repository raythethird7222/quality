import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import Dashboard from "@/features/dashboard/components/Dashboard";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  return <Dashboard />;
}
