import ManagerDashboard from "@/features/manager/components/ManagerDashboard";

export default function BFManagerDashboard() {
  return <ManagerDashboard account="BF" agents={3} qaCount={1} members={[{ name: "QA BRIAN", initial: "B", agents: 3 }]} />;
}
