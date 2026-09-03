// Database helpers for the accounts table: read and create account rows.
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

// Shape of an account row used across the app.
export type AccountRecord = {
  account_id: number;
  account_code: string;
  account_name: string;
};

// Returns true when an account with the given code (case-insensitive) exists.
export async function accountCodeExists(code: string): Promise<boolean> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("account_id")
    .ilike("account_code", code.toUpperCase());
  if (error) {
    console.error("Error checking account code:", error);
    throw new Error("Could not verify account code");
  }
  return (data ?? []).length > 0;
}

// Creates a new account row and returns the inserted record.
export async function createAccount(code: string, name: string): Promise<AccountRecord> {
  const supabase = await createServerClient();

  if (await accountCodeExists(code)) {
    throw new Error(`An account with code "${code.toUpperCase()}" already exists`);
  }

  const payload = {
    account_code: code.toUpperCase(),
    account_name: name,
  } as unknown as Database["public"]["Tables"]["accounts"]["Insert"];

  const { data, error } = await supabase
    .from("accounts")
    .insert(payload)
    .select("account_id, account_code, account_name")
    .single();

  if (error) {
    console.error("Error creating account:", error);
    throw new Error("Could not create account");
  }

  return data as AccountRecord;
}

// Returns all accounts ordered by code (used to display the account list).
export async function getAllAccounts(): Promise<AccountRecord[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("account_id, account_code, account_name");
  if (error) {
    console.error("Error loading accounts:", error);
    return [];
  }
  return (data ?? []).sort((a, b) =>
    a.account_code.localeCompare(b.account_code)
  );
}
