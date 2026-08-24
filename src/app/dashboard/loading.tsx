import { LoadingSpinner } from "@/components/ui/loading";

export default function DashboardLoading() {
  return (
    <main className="min-h-full bg-surface-base px-6 py-5 text-text-primary md:px-9">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <LoadingSpinner size="lg" className="text-brand-gold" />
          <p className="text-sm font-medium tracking-[0.16em] text-text-muted uppercase">
            Loading Dashboard
          </p>
        </div>
      </div>
    </main>
  );
}
