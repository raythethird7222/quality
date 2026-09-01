// Server-side Supabase client factories and environment helpers.

import { createClient } from "@supabase/supabase-js";

function getEnvOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. ` +
        "Set it in .env.local for development."
    );
  }
  return value;
}

// Creates a server-side Supabase client using the public env credentials.
export function createServerClient() {
  const url = getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL");
  const key = getEnvOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, key);
}
