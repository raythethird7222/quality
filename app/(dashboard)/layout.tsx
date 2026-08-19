import AuthGuard from "@/features/auth/components/AuthGuard";
import Header from "@/components/layout/Header";

export default function DashboardRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Header />
      {children}
    </AuthGuard>
  );
}
