import { notFound } from "next/navigation";
import { getAccount, isValidAccount } from "@/features/accounts/config";
import { requireAuth } from "@/lib/auth";
import RosterCalendarView from "@/features/roster/components/RosterCalendarView";

export default async function RosterPage({
  params,
}: {
  params: Promise<{ account: string; slug: string }>;
}) {
  const { account, slug } = await params;

  if (!isValidAccount(account)) {
    notFound();
  }

  await requireAuth();
  const config = getAccount(account);

  return (
    <RosterCalendarView
      account={account}
      personName={slug}
      accent={config.accent}
    />
  );
}
