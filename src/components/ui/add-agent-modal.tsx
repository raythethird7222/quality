"use client";

// Modal form for creating a new agent with LOB, coach, evaluator, and team lead.
import { useState } from "react";
import { ChevronDown, Save, UserPlus, X } from "lucide-react";
import { getAccentColors } from "@/features/accounts/config";
import type { Accent } from "@/types";
import type { IdNameOption } from "@/lib/db/assignments";

// Payload emitted when a new agent is saved.
export type NewAgentPayload = {
  agent: {
    employeeCode: string;
    employeeName: string;
    employeeEmail: string;
    hireDate: string;
    status: "ACTIVE" | "INACTIVE";
  };
  lobId: number;
  coachId: number | null;
  evaluatorId: number | null;
  teamLeadId: number | null;
};

// Props for the Add Agent modal: open state, save handler, and select options.
type AddAgentModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: NewAgentPayload) => void;
  accent: Accent;
  people: IdNameOption[];
  lobs: IdNameOption[];
  teamLeads: IdNameOption[];
};

// Add Agent modal: collects agent details and emits a new agent on save.
export default function AddAgentModal({
  open,
  onClose,
  onSave,
  accent,
  people,
  lobs,
  teamLeads,
}: AddAgentModalProps) {
  const a = getAccentColors(accent);
  const [employeeCode, setEmployeeCode] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [lobId, setLobId] = useState<number>(lobs[0]?.id ?? 0);
  const [coachId, setCoachId] = useState<number | null>(null);
  const [evaluatorId, setEvaluatorId] = useState<number | null>(null);
  const [teamLeadId, setTeamLeadId] = useState<number | null>(null);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  function reset() {
    setEmployeeCode("");
    setEmployeeName("");
    setEmployeeEmail("");
    setHireDate("");
    setLobId(lobs[0]?.id ?? 0);
    setCoachId(null);
    setEvaluatorId(null);
    setTeamLeadId(null);
    setStatus("ACTIVE");
  }

  // Builds the agent payload, resets the form, and closes the modal.
  function handleSave() {
    onSave({
      agent: {
        employeeCode: employeeCode.trim(),
        employeeName: employeeName.trim(),
        employeeEmail: employeeEmail.trim(),
        hireDate,
        status,
      },
      lobId,
      coachId,
      evaluatorId,
      teamLeadId,
    });
    reset();
    onClose();
  }

  if (!open) return null;

  const personOptions = [{ id: 0, name: "Unassigned" }, ...people];

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
            Add New Agent
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-muted transition hover:bg-surface-overlay hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Employee code">
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="Enter employee code"
                className="w-full rounded-lg border border-border-default bg-card px-3 py-2 text-[13px] text-text-primary outline-none transition placeholder:text-text-muted/60 focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              />
            </Field>

            <Field label="Employee Name">
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-lg border border-border-default bg-card px-3 py-2 text-[13px] text-text-primary outline-none transition placeholder:text-text-muted/60 focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              />
            </Field>

            <Field label="Employee Email">
              <input
                type="email"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full rounded-lg border border-border-default bg-card px-3 py-2 text-[13px] text-text-primary outline-none transition placeholder:text-text-muted/60 focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              />
            </Field>

            <Field label="Hire Date">
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-card px-3 py-2 text-[13px] text-text-primary outline-none transition focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              />
            </Field>

            <Field label="LOB">
              <SelectField
                value={lobId}
                onChange={(v) => setLobId(Number(v))}
                options={lobs}
              />
            </Field>

            <Field label="QA Coach">
              <SelectField
                value={coachId ?? 0}
                onChange={(v) => setCoachId(Number(v) || null)}
                options={personOptions}
              />
            </Field>

            <Field label="QA Evaluator">
              <SelectField
                value={evaluatorId ?? 0}
                onChange={(v) => setEvaluatorId(Number(v) || null)}
                options={personOptions}
              />
            </Field>

            <Field label="Team Lead">
              <SelectField
                value={teamLeadId ?? 0}
                onChange={(v) => setTeamLeadId(Number(v) || null)}
                options={teamLeads}
              />
            </Field>

            <Field label="Status">
              <SelectField
                value={status}
                onChange={(v) => setStatus(v as "ACTIVE" | "INACTIVE")}
                options={[
                  { id: "ACTIVE", name: "ACTIVE" },
                  { id: "INACTIVE", name: "INACTIVE" },
                ]}
              />
            </Field>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-subtle px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border-default bg-card px-4 py-2 text-[13px] font-semibold text-text-secondary transition hover:bg-surface-overlay"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`inline-flex items-center gap-2 rounded-lg ${a.bg} px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90`}
          >
            <Save size={14} />
            Save Agent
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
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

// Styled select input with a chevron, driven by id + name options.
function SelectField({
  value,
  onChange,
  options,
}: {
  value: number | string;
  onChange: (v: string) => void;
  options: IdNameOption[] | { id: string | number; name: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-border-default bg-card py-2 pl-3 pr-8 text-[13px] text-text-primary outline-none transition focus:border-border-accent focus:ring-1 focus:ring-border-accent"
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
