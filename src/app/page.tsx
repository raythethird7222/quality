// Root page: redirects unauthenticated entry to the dashboard route.
import { redirect } from "next/navigation";

// Performs the redirect to /dashboard on load.
export default function Home() {
  redirect("/dashboard");
}
