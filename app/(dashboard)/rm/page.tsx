import ManagerDashboard from "@/features/manager/components/ManagerDashboard";

export default function RMManagerDashboard() {
  return <ManagerDashboard account="RM" agents={5} qaCount={1} accent="#E31C2C" members={[{ name: "QA RANDY", initial: "R", agents: 5 }]} />;
}
