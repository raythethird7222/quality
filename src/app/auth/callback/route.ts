import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveAuthenticatedEmployee } from "@/server/auth/session";

function loginErrorRedirect(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return loginErrorRedirect(request, "Google authentication was cancelled or failed.");
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    const authUser = data.session?.user;

    if (error || !authUser) {
      return loginErrorRedirect(request, "Google authentication failed. Please try again.");
    }

    // Google proves identity only. It does not grant application access: that
    // comes from a matching employee record and account assignment in the DB.
    const employee = await resolveAuthenticatedEmployee(authUser.id, authUser.email);
    if (!employee) {
      await supabase.auth.signOut();
      return loginErrorRedirect(request, "Your Google account is not assigned to QA Tool.");
    }

    const next = request.nextUrl.searchParams.get("next");
    const destination = next?.startsWith("/") && !next.startsWith("//")
      ? next
      : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  } catch {
    return loginErrorRedirect(request, "Authentication error. Please try again.");
  }
}
