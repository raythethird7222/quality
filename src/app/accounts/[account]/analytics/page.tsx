"use client";

import { useParams } from "next/navigation";
import { getAccount, isValidAccount } from "@/features/accounts/config";
import TeamAnalyticsView from "@/features/analytics/components/TeamAnalyticsView";

export default function AccountAnalyticsPage() {
  const { account } = useParams<{ account: string }>();

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

  const config = getAccount(account);

  return (
    <TeamAnalyticsView
      account={config.label}
      qaName={config.qaName}
      accent={config.accent}
    />
  );
}
