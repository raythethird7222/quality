import ManagerDashboard from "@/features/manager/components/ManagerDashboard";

export default function JSManagerDashboard() {
  return <ManagerDashboard account="JS" agents={4} qaCount={1} members={[{ name: "QA CHERYL", initial: "C", agents: 4 }]} />;
}
