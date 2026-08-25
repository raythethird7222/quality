// Browser-side Supabase client factory used in client components.

import { createClient } from "@supabase/supabase-js";

// Creates the browser-side Supabase client using public env credentials.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, key, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      // The /auth/callback page exchanges the code manually. Disabling
      // auto-detection prevents the client from consuming the PKCE code
      // verifier on load, which caused "code verifier not found" errors.
      detectSessionInUrl: false,
    },
  });
}
