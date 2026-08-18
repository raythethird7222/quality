import ManagerDashboard from "@/features/manager/components/ManagerDashboard";

export default function DFTManagerDashboard() {
  return <ManagerDashboard account="DFT" agents={6} qaCount={2} accent="#2F6798" members={[{ name: "QA DIANA", initial: "D", agents: 3 }, { name: "QA FRANK", initial: "F", agents: 3 }]} />;
}
