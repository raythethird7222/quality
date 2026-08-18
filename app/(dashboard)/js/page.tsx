import ManagerDashboard from "@/features/manager/components/ManagerDashboard";

export default function JSManagerDashboard() {
  return <ManagerDashboard account="JS" agents={4} qaCount={1} accent="#C8A54B" members={[{ name: "QA CHERYL", initial: "C", agents: 4 }]} />;
}
