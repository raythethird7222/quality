"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Pencil, Plus, Trash2, X } from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import Pagination, { paginate } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/ToastProvider";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";
import type { AccountRecord } from "@/lib/db/accounts";
import type { IdNameOption } from "@/lib/db/assignments";

type Parameter = {
  id: number;
  lob_name: string;
  guideline: string | null;
  attributes: string | null;
  clauses: string | null;
  score: number | string | null;
  compound: string | null;
  description: string | null;
  lob_id: number | null;
  display_order: number | null;
  is_active: boolean;
};

type FormState = Omit<Parameter, "id" | "lob_name">;
const emptyForm: FormState = {
  guideline: "",
  attributes: "",
  clauses: "",
  score: 5,
  compound: "NO",
  description: "",
  lob_id: null,
  display_order: 1,
  is_active: true,
};

export default function EvaluationParameterManagementView({
  accounts,
  lobs,
}: {
  accounts: AccountRecord[];
  lobs: Record<string, IdNameOption[]>;
}) {
  const accent = useAccent();
  const colors = getAccentColors(accent);
  const { showToast } = useToast();
  const [account, setAccount] = useState(accounts[0]?.account_code ?? "");
  const [lobId, setLobId] = useState("");
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<Parameter | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [targetAccount, setTargetAccount] = useState("");
  const [targetLobId, setTargetLobId] = useState("");
  const [parameterPage, setParameterPage] = useState(1);
  const [parameterPageSize, setParameterPageSize] = useState(20);

  const accountLobs = lobs[account] ?? [];
  const targetLobs = lobs[targetAccount] ?? [];
  const targetLob = targetLobs.find((item) => String(item.id) === targetLobId);

  useEffect(() => {
    if (!account) return;
    const controller = new AbortController();
    fetch(`/api/evaluation-parameters/${account}?lobId=${lobId}`, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? "Unable to load parameters");
        setParameters(json.parameters ?? []);
      })
      .catch((error) => {
        if (error.name !== "AbortError") showToast("error", error.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [account, lobId, showToast]);

  function handleAccountChange(nextAccount: string) {
    setAccount(nextAccount);
    setLobId(lobs[nextAccount]?.[0] ? String(lobs[nextAccount][0].id) : "");
    setParameterPage(1);
    setLoading(Boolean(nextAccount));
  }

  function handleLobChange(nextLobId: string) {
    setLobId(nextLobId);
    setParameterPage(1);
  }

  function openAdd() {
    setEditing(null);
    const initialAccount = account || accounts[0]?.account_code || "";
    const initialLobId = lobId || (lobs[initialAccount]?.[0] ? String(lobs[initialAccount][0].id) : "");
    setTargetAccount(initialAccount);
    setTargetLobId(initialLobId);
    setForm({ ...emptyForm, lob_id: initialLobId ? Number(initialLobId) : null, display_order: parameters.length + 1 });
    setModal("add");
  }

  function openEdit(parameter: Parameter) {
    setEditing(parameter);
    setTargetAccount(account);
    setTargetLobId(parameter.lob_id == null ? lobId : String(parameter.lob_id));
    setForm({
      guideline: parameter.guideline ?? "",
      attributes: parameter.attributes ?? "",
      clauses: parameter.clauses ?? "",
      score: parameter.score ?? 0,
      compound: parameter.compound ?? "NO",
      description: parameter.description ?? "",
      lob_id: parameter.lob_id,
      display_order: parameter.display_order ?? 1,
      is_active: parameter.is_active,
    });
    setModal("edit");
  }

  async function save() {
    const saveAccount = editing ? account : targetAccount;
    const saveLobId = editing ? form.lob_id : Number(targetLobId);
    if (!saveAccount || !saveLobId) throw new Error("Select an account and LOB before saving");
    const response = await fetch(`/api/evaluation-parameters/${saveAccount}`, {
      method: modal === "edit" ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editing?.id, lob_id: saveLobId }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error ?? "Unable to save parameter");
    setModal(null);
    showToast("success", "Evaluation parameter saved");
    setAccount(saveAccount);
    setLobId(String(saveLobId));
    const refreshed = await fetch(`/api/evaluation-parameters/${saveAccount}?lobId=${saveLobId}`);
    setParameters((await refreshed.json()).parameters ?? []);
  }

  async function remove(parameter: Parameter) {
    if (!window.confirm(`Delete “${parameter.clauses}”? This cannot be undone.`)) return;
    const response = await fetch(`/api/evaluation-parameters/${account}?id=${parameter.id}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) return showToast("error", json.error ?? "Unable to delete parameter");
    setParameters((current) => current.filter((row) => row.id !== parameter.id));
    showToast("success", "Evaluation parameter deleted");
  }

  return (
    <div className="min-h-full bg-surface-base px-6 py-6 text-text-primary md:px-9">
      <Breadcrumb backHref="/dashboard" backLabel="Back to Dashboard" segments={[{ label: "Settings" }, { label: "Evaluation Parameters" }]} accent={accent} />
      <header className="relative mt-5 overflow-hidden rounded-2xl border border-border-default bg-card p-5 shadow-sm md:p-7">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(47,103,152,0.22),transparent_58%)]" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-indigo/10 text-brand-indigo ring-1 ring-inset ring-current/20"><ClipboardList className="h-6 w-6" /></span>
            <div><p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-indigo">QA Supervisor Workspace</p><h1 className="mt-1 text-[28px] font-bold tracking-tight sm:text-[32px]">Evaluation Parameters</h1><p className="mt-1 max-w-2xl text-[13px] leading-5 text-text-secondary">Manage the checklist used by each account and LOB in one place.</p></div>
          </div>
          <button onClick={openAdd} disabled={accounts.length === 0} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-indigo px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" /> Add parameter</button>
        </div>
      </header>
      <section className="mt-5 rounded-2xl border border-border-default bg-card p-4 shadow-sm md:p-5">
        <div className="border-b border-border-subtle">
          <div className="flex gap-2 overflow-x-auto pb-3" role="tablist" aria-label="Accounts">
            {accounts.map((item) => (
              <button
                key={item.account_id}
                type="button"
                role="tab"
                aria-selected={account === item.account_code}
                onClick={() => handleAccountChange(item.account_code)}
                className={`whitespace-nowrap rounded-lg border px-4 py-2 text-[13px] font-semibold transition ${account === item.account_code ? `${colors.bg} border-transparent text-white` : "border-border-default bg-surface-raised text-text-secondary hover:bg-surface-overlay"}`}
              >
                {item.account_code}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <h2 className="text-[16px] font-bold">{account || "Select an account"} checklist</h2>
            <p className="mt-1 text-[13px] text-text-secondary">Manage parameters for the selected account and LOB.</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={lobId} onChange={(e) => handleLobChange(e.target.value)} aria-label="Filter parameters by LOB" className="h-11 rounded-lg border border-border-default bg-surface-raised px-3 text-[14px] text-text-primary outline-none focus:border-app-accent"><option value="">Select LOB</option>{accountLobs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <span className="text-sm text-text-secondary">{loading ? "Loading…" : `${parameters.length} parameters`}</span>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border-subtle"><table className="w-full min-w-[980px] border-collapse text-left"><thead className="bg-surface-raised"><tr className="border-b border-border-subtle"><th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">Order</th><th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">Guideline</th><th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">Attribute</th><th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">Clause</th><th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">Score</th><th className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">Status</th><th className="whitespace-nowrap px-4 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-text-secondary">Actions</th></tr></thead><tbody className="divide-y divide-border-subtle">{paginate(parameters, parameterPage, parameterPageSize).map((parameter) => <tr key={parameter.id} className="hover:bg-surface-raised/50"><td className="px-4 py-3 text-text-secondary">{parameter.display_order}</td><td className="px-4 py-3 font-semibold">{parameter.guideline}</td><td className="px-4 py-3">{parameter.attributes}</td><td className="px-4 py-3">{parameter.clauses}</td><td className="px-4 py-3">{parameter.score}</td><td className="px-4 py-3">{parameter.is_active ? "Active" : "Inactive"}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => openEdit(parameter)} className="mr-2 rounded-md p-2 text-brand-indigo hover:bg-brand-indigo/10" aria-label={`Edit ${parameter.clauses}`}><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => remove(parameter)} className="rounded-md p-2 text-brand-crimson hover:bg-brand-crimson/10" aria-label={`Delete ${parameter.clauses}`}><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table>{!loading && parameters.length === 0 && <div className="p-12 text-center text-[13px] text-text-muted">No parameters match the selected account and LOB.</div>}</div>
        <Pagination currentPage={parameterPage} pageSize={parameterPageSize} totalItems={parameters.length} onPageChange={setParameterPage} onPageSizeChange={(size) => { setParameterPageSize(size); setParameterPage(1); }} className="mt-3 rounded-lg border border-border-subtle bg-surface-raised/50" />
      </section>
      {modal && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="w-full max-w-2xl rounded-2xl border border-border-default bg-card shadow-xl"><div className="flex items-center justify-between border-b border-border-subtle p-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">{modal === "edit" ? "Edit parameter" : "New parameter"}</p><h2 className="mt-1 text-xl font-bold">Checklist item</h2></div><button onClick={() => setModal(null)} aria-label="Close"><X /></button></div><div className="grid gap-4 border-b border-border-subtle bg-surface-raised/50 px-5 py-4 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">Account<select value={targetAccount} disabled={modal === "edit"} onChange={(e) => { const nextAccount = e.target.value; const nextLobId = lobs[nextAccount]?.[0] ? String(lobs[nextAccount][0].id) : ""; setTargetAccount(nextAccount); setTargetLobId(nextLobId); setForm({ ...form, lob_id: nextLobId ? Number(nextLobId) : null }); }} className="rounded-lg border border-border-default bg-surface-overlay px-3 py-2 disabled:cursor-not-allowed disabled:opacity-70">{accounts.map((item) => <option key={item.account_id} value={item.account_code}>{item.account_code} · {item.account_name}</option>)}</select></label><label className="grid gap-1 text-sm font-medium">LOB<select value={targetLobId} disabled={modal === "edit"} onChange={(e) => { setTargetLobId(e.target.value); setForm({ ...form, lob_id: Number(e.target.value) }); }} className="rounded-lg border border-border-default bg-surface-overlay px-3 py-2 disabled:cursor-not-allowed disabled:opacity-70"><option value="">Select LOB</option>{targetLobs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><p className="text-xs text-text-secondary sm:col-span-2">{modal === "edit" ? `This parameter belongs to ${targetAccount} · ${targetLob?.name ?? "selected LOB"}.` : `This parameter will be added to ${targetAccount || "the selected account"} · ${targetLob?.name ?? "the selected LOB"}.`}</p></div><div className="grid gap-4 p-5 sm:grid-cols-2"><Field label="Guideline" value={form.guideline ?? ""} onChange={(value) => setForm({ ...form, guideline: value })} /><Field label="Attribute" value={form.attributes ?? ""} onChange={(value) => setForm({ ...form, attributes: value })} /><Field label="Clause" value={form.clauses ?? ""} onChange={(value) => setForm({ ...form, clauses: value })} /><Field label="Score" type="number" value={String(form.score ?? "")} onChange={(value) => setForm({ ...form, score: Number(value) })} /><Field label="Display order" type="number" value={String(form.display_order ?? "")} onChange={(value) => setForm({ ...form, display_order: Number(value) })} /><label className="grid gap-1 text-sm font-medium">Compound<select value={form.compound ?? "NO"} onChange={(e) => setForm({ ...form, compound: e.target.value })} className="rounded-lg border border-border-default bg-surface-overlay px-3 py-2"><option>NO</option><option>YES</option></select></label><label className="grid gap-1 text-sm font-medium sm:col-span-2">Description<textarea placeholder="Explain what the evaluator should check..." value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="rounded-lg border border-border-default bg-surface-overlay px-3 py-2" /></label></div><div className="flex justify-end gap-3 border-t border-border-subtle p-5"><button onClick={() => setModal(null)} className="rounded-lg border border-border-default px-4 py-2 text-sm">Cancel</button><button onClick={() => save().catch((error) => showToast("error", error.message))} className="rounded-lg bg-brand-indigo px-4 py-2 text-sm font-semibold text-white">Save parameter</button></div></div></div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-1 text-sm font-medium">{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-border-default bg-surface-overlay px-3 py-2" /></label>;
}
