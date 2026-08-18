import ManagerDashboard from "@/features/manager/components/ManagerDashboard";

export default function JSManagerDashboard() {
  return <ManagerDashboard account="JS" agents={4} qaCount={1} accent="#0E5E9E" members={[{ name: "QA CHERYL", initial: "C", agents: 4 }]} />;
}
