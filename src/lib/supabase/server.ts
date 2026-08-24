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

export function createServerClient() {
  const url = getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL");
  const key = getEnvOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, key);
}
