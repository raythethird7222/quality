import RosterCalendarView from "@/features/roster/components/RosterCalendarView";

const accentMap: Record<string, "gold" | "indigo" | "crimson" | "charcoal"> = {
  js: "gold",
  dft: "indigo",
  rm: "crimson",
  bf: "charcoal",
};

export default async function RosterPage({ params }: { params: Promise<{ account: string; slug: string }> }) {
  const { account, slug } = await params;
  const accent = accentMap[account] ?? "indigo";

  return <RosterCalendarView account={account} personName={slug} accent={accent} />;
}
