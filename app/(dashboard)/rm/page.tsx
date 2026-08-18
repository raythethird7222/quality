import ManagerDashboard from "@/features/manager/components/ManagerDashboard";

export default function RMManagerDashboard() {
  return <ManagerDashboard account="RM" agents={5} qaCount={1} accent="#ED1C25" members={[{ name: "QA RANDY", initial: "R", agents: 5 }]} />;
}
