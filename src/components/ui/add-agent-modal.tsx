"use client";

// Modal form for assigning an existing account agent to QA coverage.
import { useState } from "react";
import { AlertCircle, ChevronDown, Save, UserPlus, X } from "lucide-react";
import { getAccentColors } from "@/features/accounts/config";
import type { Accent } from "@/types";
import type { AvailableAgentOption, IdNameOption } from "@/lib/db/assignments";

// Payload emitted when a new agent is saved.
export type NewAgentPayload = {
  assignmentId?: number;
  agentId: number;
  lobId: number;
  coachId: number | null;
  evaluatorId: number | null;
  teamLeadId: number | null;
};

// Result returned from a save attempt so the modal can stay open on failure.
export type SaveAgentResult = {
  ok: boolean;
  error?: string;
};

// Props for the Add Agent modal: open state, save handler, and select options.
type AddAgentModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: NewAgentPayload) => SaveAgentResult | Promise<SaveAgentResult>;
  accent: Accent;
  agents: AvailableAgentOption[];
  lobs: IdNameOption[];
  coaches: IdNameOption[];
  evaluators: IdNameOption[];
  teamLeads: IdNameOption[];
};

// Add Agent modal: collects agent details and emits a new agent on save.
export default function AddAgentModal({
  open,
  onClose,
  onSave,
  accent,
  agents,
  lobs,
  coaches,
  evaluators,
  teamLeads,
}: AddAgentModalProps) {
  const a = getAccentColors(accent);
  const [agentId, setAgentId] = useState<number>(agents[0]?.id ?? 0);
  const [lobId, setLobId] = useState<number>(agents[0]?.lobId ?? lobs[0]?.id ?? 0);
  const [coachId, setCoachId] = useState<number | null>(null);
  const [evaluatorId, setEvaluatorId] = useState<number | null>(null);
  const [teamLeadId, setTeamLeadId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function reset() {
    setAgentId(agents[0]?.id ?? 0);
    setLobId(agents[0]?.lobId ?? lobs[0]?.id ?? 0);
    setCoachId(null);
    setEvaluatorId(null);
    setTeamLeadId(null);
    setErrors({});
  }

  // Builds the agent payload, saves it, and closes the modal on success.
  async function handleSave() {
    const nextErrors: Record<string, string> = {};

    if (agentId <= 0 || !agents.some((agent) => agent.id === agentId)) {
      nextErrors.agentId = "Select an agent";
    }

    // A valid LOB must be selected before saving.
    if (lobId <= 0 || !lobs.some((l) => l.id === lobId)) {
      nextErrors.lobId = "Select a LOB";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSaveError(null);
    setSaving(true);

    try {
      const result = await onSave({
        assignmentId: agents.find((agent) => agent.id === agentId)?.assignmentId,
        agentId,
        lobId,
        coachId,
        evaluatorId,
        teamLeadId,
      });

      // The save failed (server rejected it); keep the modal open and show the
      // error so the user can adjust their input without losing typed data.
      if (!result.ok) {
        setSaveError(result.error ?? "Failed to save the agent");
        return;
      }

      reset();
      onClose();
    } catch {
      setSaveError(
        "An unexpected error occurred while saving the agent. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  // Clears the inline error for a field as the user corrects their input.
  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative mx-4 w-full max-w-[560px] rounded-2xl border border-border-default bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <h2 className="flex items-center gap-2.5 text-[16px] font-bold text-text-primary">
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${a.bgLight}`}>
              <UserPlus size={18} className={a.text} />
            </span>
            Assign Existing Agent
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-muted transition hover:bg-surface-overlay hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          {agents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-default bg-surface-raised px-4 py-5 text-[13px] text-text-secondary">
              All account agents already have a QA coach or evaluator. Add the employee from Employee Management first if needed.
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Agent" error={errors.agentId}>
              <SelectField
                value={agentId}
                onChange={(value) => {
                  const selectedAgent = agents.find((agent) => agent.id === Number(value));
                  setAgentId(Number(value));
                  if (selectedAgent?.lobId) setLobId(selectedAgent.lobId);
                  clearError("agentId");
                }}
                options={agents}
                hasError={Boolean(errors.agentId)}
              />
            </Field>

            <Field label="LOB" error={errors.lobId}>
              <SelectField
                value={lobId}
                onChange={(v) => {
                  setLobId(Number(v));
                  clearError("lobId");
                }}
                options={lobs}
                hasError={Boolean(errors.lobId)}
              />
            </Field>

            <Field label="QA Coach">
              <SelectField value={coachId ?? 0} onChange={(v) => setCoachId(Number(v) || null)} options={[{ id: 0, name: "Unassigned" }, ...coaches]} />
            </Field>

            <Field label="QA Evaluator">
              <SelectField
                value={evaluatorId ?? 0}
                onChange={(v) => setEvaluatorId(Number(v) || null)}
                options={[{ id: 0, name: "Unassigned" }, ...evaluators]}
              />
            </Field>

            <Field label="Team Lead">
              <SelectField
                value={teamLeadId ?? 0}
                onChange={(v) => setTeamLeadId(Number(v) || null)}
                options={[{ id: 0, name: "Unassigned" }, ...teamLeads]}
              />
            </Field>

          </div>
          )}

          {Object.keys(errors).length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand-crimson/30 bg-brand-crimson/10 px-3 py-2.5 text-[12px] font-medium text-brand-crimson">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>
                Please fix the highlighted fields before saving the agent.
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-subtle px-6 py-4">
          {saveError && (
            <span className="mr-auto flex items-center gap-1.5 text-[12px] font-medium text-brand-crimson">
              <AlertCircle size={14} />
              {saveError}
            </span>
          )}
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-border-default bg-card px-4 py-2 text-[13px] font-semibold text-text-secondary transition hover:bg-surface-overlay disabled:opacity-60"
          >
            Cancel
          </button>
  <button
            onClick={handleSave}
            disabled={saving || agents.length === 0}
            className={`inline-flex items-center gap-2 rounded-lg ${a.bg} px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60`}
          >
            <Save size={14} />
            {saving ? "Saving..." : "Assign Agent"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Layout helper that renders a labelled form field wrapper.
function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-text-secondary">
        {label}
      </label>
      {children}
      {error && (
        <span className="flex items-center gap-1 text-[11px] font-medium text-brand-crimson">
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  );
}

// Styled select input with a chevron, driven by id + name options.
function SelectField({
  value,
  onChange,
  options,
  hasError,
}: {
  value: number | string;
  onChange: (v: string) => void;
  options: IdNameOption[] | { id: string | number; name: string }[];
  hasError?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none rounded-lg border bg-card py-2 pl-3 pr-8 text-[13px] text-text-primary outline-none transition focus:ring-1 ${
          hasError
            ? "border-brand-crimson focus:border-brand-crimson focus:ring-brand-crimson"
            : "border-border-default focus:border-border-accent focus:ring-border-accent"
        }`}
      >
        {options.map((opt) => (
          <option key={String(opt.id)} value={String(opt.id)}>
            {opt.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}
