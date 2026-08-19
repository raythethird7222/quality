"use client";

import { useState } from "react";
import { ChevronDown, Save, UserPlus, X } from "lucide-react";

type AddAgentModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (agent: { id: string; name: string; email: string; hireDate: string; lob: string; coach: string; evaluator: string; teamLead: string; status: string }) => void;
  accent: "gold" | "indigo" | "crimson" | "charcoal";
};

const accentColor = {
  gold: { text: "text-brand-indigo", bg: "bg-brand-indigo", border: "border-brand-indigo", hoverBg: "hover:bg-brand-indigo/10", bgLight: "bg-brand-indigo/10" },
  indigo: { text: "text-brand-indigo", bg: "bg-brand-indigo", border: "border-brand-indigo", hoverBg: "hover:bg-brand-indigo/10", bgLight: "bg-brand-indigo/10" },
  crimson: { text: "text-brand-indigo", bg: "bg-brand-indigo", border: "border-brand-indigo", hoverBg: "hover:bg-brand-indigo/10", bgLight: "bg-brand-indigo/10" },
  charcoal: { text: "text-brand-indigo", bg: "bg-brand-indigo", border: "border-brand-indigo", hoverBg: "hover:bg-brand-indigo/10", bgLight: "bg-brand-indigo/10" },
} as const;

const qaList = ["QA CARL", "QA CLARENCE", "QA CLEOFAS", "QA DENIELLA", "QA HANAZAIRA", "QA JHONMEL", "QA JONASH", "QA LIZA", "QA STEFFANY", "QA TANIA", "QA VERONICA"];

export default function AddAgentModal({ open, onClose, onSave, accent }: AddAgentModalProps) {
  const a = accentColor[accent];
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [lob, setLob] = useState("CXL");
  const [coach, setCoach] = useState("");
  const [evaluator, setEvaluator] = useState("");
  const [teamLead, setTeamLead] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  function handleSave() {
    onSave({ id, name, email, hireDate, lob, coach, evaluator, teamLead, status });
    setId("");
    setName("");
    setEmail("");
    setHireDate("");
    setLob("CXL");
    setCoach("");
    setEvaluator("");
    setTeamLead("");
    setStatus("ACTIVE");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative mx-4 w-full max-w-[560px] rounded-2xl border border-border-default bg-card shadow-2xl">
        {/* Header */}
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

        {/* Form Body */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Employee ID">
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter employee ID"
                className="w-full rounded-lg border border-border-default bg-card px-3 py-2 text-[13px] text-text-primary outline-none transition placeholder:text-text-muted/60 focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              />
            </FormField>

            <FormField label="Employee Name">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-lg border border-border-default bg-card px-3 py-2 text-[13px] text-text-primary outline-none transition placeholder:text-text-muted/60 focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              />
            </FormField>

            <FormField label="Employee Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full rounded-lg border border-border-default bg-card px-3 py-2 text-[13px] text-text-primary outline-none transition placeholder:text-text-muted/60 focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              />
            </FormField>

            <FormField label="Hire Date">
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-card px-3 py-2 text-[13px] text-text-primary outline-none transition focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              />
            </FormField>

            <FormField label="LOB">
              <SelectField value={lob} onChange={setLob} options={["CXL", "NEGOT"]} />
            </FormField>

            <FormField label="QA Coach">
              <SelectField value={coach} onChange={setCoach} options={["", ...qaList]} placeholder="Unassigned" />
            </FormField>

            <FormField label="QA Evaluator">
              <SelectField value={evaluator} onChange={setEvaluator} options={["", ...qaList]} placeholder="Unassigned" />
            </FormField>

            <FormField label="Team Lead">
              <SelectField value={teamLead} onChange={setTeamLead} options={[""]} placeholder="Unassigned" />
            </FormField>

            <FormField label="Status">
              <SelectField value={status} onChange={setStatus} options={["ACTIVE", "INACTIVE"]} />
            </FormField>
          </div>
        </div>

        {/* Footer */}
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-text-secondary">{label}</label>
      {children}
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-border-default bg-card py-2 pl-3 pr-8 text-[13px] text-text-primary outline-none transition focus:border-border-accent focus:ring-1 focus:ring-border-accent"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.filter(Boolean).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
    </div>
  );
}
