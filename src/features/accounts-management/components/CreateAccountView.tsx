"use client";

// Account management view: create a new account and list existing ones.
// Used by QA supervisors and above on the /accounts/manage page.
import { useMemo, useState } from "react";
import { Building2, Check, Info, Plus, RefreshCw, X } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";
import { createAccountSchema } from "@/features/accounts-management/validation";
import type { AccountRecord } from "@/lib/db/accounts";

// Props for the account management view.
type CreateAccountViewProps = {
  accounts: AccountRecord[];
};

type FormErrors = {
  code?: string;
  name?: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

// Renders account management with a modal add-account flow.
export default function CreateAccountView({ accounts }: CreateAccountViewProps) {
  const selectedAccent = useAccent();
  const a = getAccentColors(selectedAccent);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [current, setCurrent] = useState<AccountRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Existing account codes, uppercased for duplicate checks as the user types.
  const existingCodes = useMemo(
    () => new Set(accounts.map((acc) => acc.account_code.toUpperCase())),
    [accounts]
  );

  const validate = (): boolean => {
    const next: FormErrors = {};
    const raw = createAccountSchema.safeParse({ code, name });
    if (!raw.success) {
      const flat = raw.error.flatten().fieldErrors;
      if (flat.code?.[0]) next.code = flat.code[0];
      if (flat.name?.[0]) next.name = flat.name[0];
    }
    if (!next.code && existingCodes.has(code.trim().toUpperCase())) {
      next.code = `An account with code "${code.trim().toUpperCase()}" already exists`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const openModal = () => {
    setIsModalOpen(true);
    setSaveState("idle");
    setErrorMsg("");
  };

  const closeModal = () => {
    if (saveState === "saving") return;
    setIsModalOpen(false);
    setErrors({});
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saveState === "saving") return;
    if (!validate()) return;

    setSaveState("saving");
    setErrorMsg("");
    try {
      const res = await fetch("/api/accounts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name }),
      });
      const data = (await res.json()) as {
        success: boolean;
        account?: AccountRecord;
        error?: string;
      };
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to create account");
      }
      setCurrent(data.account ?? null);
      setCode("");
      setName("");
      setSaveState("saved");
      setIsModalOpen(false);
    } catch (err) {
      setSaveState("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to create account"
      );
    }
  };

  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        <Breadcrumb
          backHref="/dashboard"
          segments={[
            { label: "Accounts", href: "/dashboard" },
            { label: "Manage Accounts" },
          ]}
          accent={selectedAccent}
        />

        <section className="mt-5 space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-border-default bg-card p-5 shadow-sm md:p-7">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(47,103,152,0.18),transparent_58%)]" />
            <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${a.bgLight} ${a.text} ring-1 ring-inset ring-current/20`}
                >
                  <Building2 className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p
                    className={`text-[12px] font-semibold uppercase tracking-[0.18em] ${a.text}`}
                  >
                    Account setup
                  </p>
                  <h1 className="mt-1 text-[26px] font-bold tracking-tight text-text-primary sm:text-[32px]">
                    Manage Accounts
                  </h1>
                  <p className="mt-1 max-w-2xl text-[13px] leading-5 text-text-secondary">
                    Add accounts for QA coverage and review the workspaces that
                    are already available to the team.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openModal}
                className={`inline-flex items-center justify-center gap-2 rounded-lg ${a.bg} px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Account
              </button>
            </div>
          </div>

          {saveState === "saved" && current && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 shadow-sm dark:border-emerald-700 dark:bg-emerald-950/40">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <div>
                <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Account created successfully
                </p>
                <p className="mt-0.5 text-[12px] text-emerald-700/80 dark:text-emerald-300/80">
                  {current.account_code} - {current.account_name}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="rounded-2xl border border-border-default bg-card p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-2">
                <Building2
                  className={`h-4 w-4 ${a.text}`}
                  aria-hidden="true"
                />
                <h2 className="text-[15px] font-bold text-text-primary">
                  Existing Accounts
                </h2>
                <span className="ml-auto rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-semibold text-text-muted">
                  {accounts.length}
                </span>
              </div>

              <ul className="mt-4 divide-y divide-border-subtle">
                {accounts.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-border-subtle bg-surface-raised px-3 py-8 text-center text-[13px] text-text-muted">
                    No accounts yet. Use Add Account to create the first one.
                  </li>
                ) : (
                  accounts.map((acc) => (
                    <li
                      key={acc.account_id}
                      className="flex items-center gap-3 py-3"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.bgLight} ${a.text} text-[12px] font-bold`}
                      >
                        {acc.account_code.slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-text-primary">
                          {acc.account_code}
                        </p>
                        <p className="truncate text-[12px] text-text-muted">
                          {acc.account_name}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <aside className="rounded-2xl border border-border-default bg-card p-5 shadow-sm md:p-6">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bgLight} ${a.text}`}
              >
                <Info className="h-5 w-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-[15px] font-bold text-text-primary">
                Before adding an account
              </h2>
              <ul className="mt-3 list-disc space-y-3 pl-4 text-[13px] leading-5 text-text-secondary">
                <li>Use a short code people recognize, like ABC or EAST.</li>
                <li>Use the full account name so reports are easy to identify.</li>
                <li>Duplicate account codes are blocked automatically.</li>
              </ul>
            </aside>
          </div>
        </section>

        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-account-title"
            onClick={closeModal}
          >
            <div
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-border-default bg-card shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-border-subtle bg-surface-raised/70 px-5 py-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${a.bgLight} ${a.text}`}
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2
                      id="create-account-title"
                      className="text-[18px] font-bold text-text-primary"
                    >
                      Add Account
                    </h2>
                    <p className="mt-1 text-[13px] leading-5 text-text-secondary">
                      Enter the account code and name. The code is the short
                      label people will see around the dashboard.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saveState === "saving"}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-overlay hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Close add account modal"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {saveState === "error" && errorMsg && (
                <div className="mx-5 mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 dark:border-red-700 dark:bg-red-950/40">
                  <p className="text-[13px] font-medium text-red-700 dark:text-red-300">
                    {errorMsg}
                  </p>
                </div>
              )}

              <form
                className="space-y-5 px-5 py-5"
                onSubmit={handleSubmit}
                noValidate
              >
                <div>
                  <label
                    htmlFor="account-code"
                    className="block text-[13px] font-semibold text-text-secondary"
                  >
                    Account Code
                  </label>
                  <input
                    id="account-code"
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (errors.code) {
                        setErrors((prev) => ({ ...prev, code: undefined }));
                      }
                    }}
                    placeholder="Example: ABC"
                    autoComplete="off"
                    className={`mt-1.5 w-full rounded-lg border bg-surface-raised px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition placeholder:text-text-muted focus:ring-2 ${
                      errors.code
                        ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                        : "border-border-default focus:border-app-accent focus:ring-app-accent/20"
                    }`}
                  />
                  {errors.code ? (
                    <p className="mt-1.5 text-[12px] text-red-600 dark:text-red-400">
                      {errors.code}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[12px] text-text-muted">
                      Keep it short. Use letters or numbers only.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="account-name"
                    className="block text-[13px] font-semibold text-text-secondary"
                  >
                    Account Name
                  </label>
                  <input
                    id="account-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) {
                        setErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    placeholder="Example: ABC Corporation"
                    autoComplete="off"
                    className={`mt-1.5 w-full rounded-lg border bg-surface-raised px-3.5 py-2.5 text-[14px] text-text-primary outline-none transition placeholder:text-text-muted focus:ring-2 ${
                      errors.name
                        ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                        : "border-border-default focus:border-app-accent focus:ring-app-accent/20"
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-[12px] text-red-600 dark:text-red-400">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saveState === "saving"}
                    className="inline-flex items-center justify-center rounded-lg border border-border-default bg-card px-4 py-2.5 text-[13px] font-semibold text-text-secondary transition hover:bg-surface-overlay disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveState === "saving"}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg ${a.bg} px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60`}
                  >
                    {saveState === "saving" ? (
                      <>
                        <RefreshCw
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
