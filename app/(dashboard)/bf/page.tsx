import ManagerDashboard from "@/features/manager/components/ManagerDashboard";

export default function BFManagerDashboard() {
  return <ManagerDashboard account="BF" agents={3} qaCount={1} accent="#363435" members={[{ name: "QA BRIAN", initial: "B", agents: 3 }]} />;
}
