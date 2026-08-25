// 404 page shown when a requested route does not exist.
export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        {/* Large 404 status code. */}
        <h1 className="text-6xl font-bold text-text-muted">404</h1>
        {/* Heading explaining the missing page. */}
        <h2 className="mt-4 text-2xl font-bold text-text-primary">
          Page Not Found
        </h2>
        {/* Supporting description text. */}
        <p className="mt-2 text-sm text-text-secondary">
          The page you are looking for does not exist or has been moved.
        </p>
        {/* Link returning the user to the main dashboard. */}
        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-indigo px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-indigo/90"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}
