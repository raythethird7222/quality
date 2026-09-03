"use client";

// Employee directory with manager-only add and inline profile editing.
import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ContactRound,
  Mail,
  Pencil,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import Breadcrumb from "@/components/shared/Breadcrumb";
import Pagination, { paginate } from "@/components/ui/pagination";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";
import type { EmployeeManagementRow } from "@/lib/db/employees";

type Status = { status_id: number; status_name: string };
type FormState = {
  employee_code: string;
  employee_name: string;
  employee_email: string;
  status_id: string;
  hire_date: string;
  vici_link: string;
};

const emptyForm: FormState = {
  employee_code: "",
  employee_name: "",
  employee_email: "",
  status_id: "",
  hire_date: "",
  vici_link: "",
};

function toForm(employee: EmployeeManagementRow | null, activeStatusId: number | null): FormState {
  return employee
    ? {
        employee_code: employee.employee_code ?? "",
        employee_name: employee.employee_name ?? "",
        employee_email: employee.employee_email ?? "",
        status_id: employee.status_id == null ? "" : String(employee.status_id),
        hire_date: employee.hire_date ?? "",
        vici_link: employee.vici_link ?? "",
      }
    : { ...emptyForm, status_id: activeStatusId == null ? "" : String(activeStatusId) };
}

export default function EmployeeManagementView({
  initialEmployees,
  statuses,
}: {
  initialEmployees: EmployeeManagementRow[];
  statuses: Status[];
}) {
  const accent = useAccent();
  const colors = getAccentColors(accent);
  const activeStatusId = statuses.find((status) => status.status_name.trim().toUpperCase() === "ACTIVE")?.status_id ?? null;
  const [employees, setEmployees] = useState(initialEmployees);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeePage, setEmployeePage] = useState(1);
  const [employeePageSize, setEmployeePageSize] = useState(20);
  const [editing, setEditing] = useState<EmployeeManagementRow | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm(null, activeStatusId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const filteredEmployees = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = !normalized || [
        employee.employee_code,
        employee.employee_name,
        employee.employee_email,
        ...employee.assignments.map((assignment) => assignment.account_code),
      ].some((value) => value?.toLowerCase().includes(normalized));
      const matchesStatus = statusFilter === "all" || String(employee.status_id) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, query, statusFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm(toForm(null, activeStatusId));
    setError("");
    setNotice("");
    setIsAdding(true);
  };

  const openEdit = (employee: EmployeeManagementRow) => {
    setEditing(employee);
    setForm(toForm(employee, activeStatusId));
    setError("");
    setNotice("");
    setIsAdding(true);
  };

  const closeModal = () => {
    if (!saving) setIsAdding(false);
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveEmployee = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        employee_code: form.employee_code,
        employee_name: form.employee_name,
        employee_email: form.employee_email,
        status_id: form.status_id ? Number(form.status_id) : undefined,
        hire_date: form.hire_date || null,
        vici_link: form.vici_link || null,
      };
      const response = await fetch(editing ? `/api/employees?id=${editing.id}` : "/api/employees", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { success?: boolean; employee?: EmployeeManagementRow; error?: string };
      if (!response.ok || !result.success || !result.employee) throw new Error(result.error ?? "Unable to save employee");

      const saved = { ...result.employee, status_name: statuses.find((status) => status.status_id === result.employee?.status_id)?.status_name ?? null, assignments: editing?.assignments ?? [] };
      setEmployees((current) => editing ? current.map((employee) => employee.id === saved.id ? saved : employee) : [...current, saved].sort((a, b) => (a.employee_name ?? "").localeCompare(b.employee_name ?? "")));
      setIsAdding(false);
      setNotice(editing ? "Employee details updated." : "Employee added successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save employee");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = employees.filter((employee) => employee.status_name?.trim().toUpperCase() === "ACTIVE").length;
  const inactiveCount = employees.filter((employee) => employee.status_name?.trim().toUpperCase() === "INACTIVE").length;

  return (
    <main className="min-h-full bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 md:px-9">
        <Breadcrumb backHref="/dashboard" segments={[{ label: "Employees Management" }]} accent={accent} />

        <section className="relative mt-5 overflow-hidden rounded-2xl border border-border-default bg-card p-5 shadow-sm md:p-7">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(47,103,152,0.22),transparent_58%)]" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colors.bgLight} ${colors.text} ring-1 ring-inset ring-current/20`}>
                <ContactRound className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <p className={`text-[12px] font-semibold uppercase tracking-[0.18em] ${colors.text}`}>People directory</p>
                <h1 className="mt-1 text-[28px] font-bold tracking-tight sm:text-[32px]">Employees Management</h1>
                <p className="mt-1 max-w-2xl text-[13px] leading-5 text-text-secondary">Maintain employee identity, contact, status, and workforce details in one place.</p>
              </div>
            </div>
            <button type="button" onClick={openAdd} className={`inline-flex items-center justify-center gap-2 rounded-lg ${colors.bg} px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90`}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add Employee
            </button>
          </div>
        </section>

        {notice && <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Check className="h-4 w-4" />{notice}</div>}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Total Employees" value={employees.length} icon={<UserRound className="h-5 w-5" />} color={colors} />
          <SummaryCard label="Active" value={activeCount} icon={<Check className="h-5 w-5" />} color={colors} />
          <SummaryCard label="Inactive" value={inactiveCount} icon={<X className="h-5 w-5" />} color={colors} />
        </div>

        <section className="mt-5 rounded-2xl border border-border-default bg-card p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input value={query} onChange={(event) => { setQuery(event.target.value); setEmployeePage(1); }} placeholder="Search name, code, email, or account" aria-label="Search employees" className="h-11 w-full rounded-lg border border-border-default bg-surface-raised pl-9 pr-3 text-[14px] leading-5 text-text-primary outline-none transition placeholder:text-text-muted focus:border-app-accent" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setEmployeePage(1); }} aria-label="Filter employees by status" className="h-11 w-full appearance-none rounded-lg border border-border-default bg-surface-raised px-3 pr-9 text-[14px] leading-5 text-text-primary outline-none focus:border-app-accent sm:w-44">
                <option value="all">All statuses</option>
                {statuses.map((status) => <option key={status.status_id} value={status.status_id}>{status.status_name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-surface-raised">
                <tr className="border-b border-border-subtle">
                  {['Employee', 'Employee Code', 'Contact', 'Status', 'Hire date', 'VICI link', 'Assignments', ''].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">{heading}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-text-muted">No employees match the current filters.</td></tr> : paginate(filteredEmployees, employeePage, employeePageSize).map((employee) => {
                  const isActive = employee.status_name?.trim().toUpperCase() === "ACTIVE";
                  return <tr key={employee.id} className="border-b border-border-subtle last:border-0 transition hover:bg-surface-overlay/50">
                    <td className="px-4 py-3.5"><p className="text-[14px] font-semibold leading-5 text-text-primary">{employee.employee_name || "Missing name"}</p></td>
                    <td className="whitespace-nowrap px-4 py-3.5"><span className="rounded-md bg-surface-raised px-2 py-1 font-mono text-[13px] font-semibold text-text-secondary">{employee.employee_code || "Missing code"}</span></td>
                    <td className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] leading-5 text-text-secondary"><Mail className="h-3.5 w-3.5 shrink-0 text-text-muted" />{employee.employee_email || "Missing email"}</span></td>
                    <td className="whitespace-nowrap px-4 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"}`}>{employee.status_name || "Unknown"}</span></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[13px] leading-5 text-text-secondary">{employee.hire_date || "Not set"}</td>
                    <td className="whitespace-nowrap px-4 py-3.5">{employee.vici_link ? <a href={employee.vici_link} target="_blank" rel="noreferrer" className={`${colors.text} text-[13px] font-semibold hover:underline`}>Open VICI</a> : <span className="text-[13px] text-text-muted">Not set</span>}</td>
                    <td className="px-4 py-3.5"><div className="flex max-w-[250px] flex-wrap gap-1.5">{employee.assignments.length === 0 ? <span className="text-[13px] text-text-muted">No assignments</span> : employee.assignments.map((assignment, index) => <span key={`${assignment.account_code}-${index}`} className="rounded-md bg-surface-raised px-2 py-1 text-[11px] font-semibold leading-4 text-text-secondary">{assignment.account_code} · {assignment.role_name}</span>)}</div></td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right"><button type="button" onClick={() => openEdit(employee)} className={`inline-flex items-center gap-1.5 rounded-lg border border-border-default px-2.5 py-2 text-[12px] font-semibold text-text-secondary transition ${colors.hoverBg}`}><Pencil className="h-3.5 w-3.5" /> Edit</button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          {filteredEmployees.length > 0 && <Pagination
            currentPage={employeePage}
            pageSize={employeePageSize}
            totalItems={filteredEmployees.length}
            onPageChange={setEmployeePage}
            onPageSizeChange={(size) => {
              setEmployeePageSize(size);
              setEmployeePage(1);
            }}
            className="mt-3 rounded-lg border border-border-subtle bg-surface-raised/50"
          />}
        </section>
      </div>

      {isAdding && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="employee-dialog-title" onClick={closeModal}>
        <form onSubmit={saveEmployee} onClick={(event) => event.stopPropagation()} className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border-default bg-card shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-border-subtle bg-surface-raised/70 px-5 py-4"><div><p className={`text-[11px] font-bold uppercase tracking-[0.16em] ${colors.text}`}>{editing ? "Complete employee record" : "New employee"}</p><h2 id="employee-dialog-title" className="mt-1 text-[19px] font-bold text-text-primary">{editing ? "Edit Employee" : "Add Employee"}</h2></div><button type="button" onClick={closeModal} className="rounded-lg p-2 text-text-muted hover:bg-surface-overlay" aria-label="Close"><X className="h-5 w-5" /></button></div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Employee code" value={form.employee_code} onChange={(value) => updateField("employee_code", value)} required />
            <Field label="Employee name" value={form.employee_name} onChange={(value) => updateField("employee_name", value)} required />
            <Field label="Email address" type="email" value={form.employee_email} onChange={(value) => updateField("employee_email", value)} required />
            <Field label="Hire date" type="date" value={form.hire_date} onChange={(value) => updateField("hire_date", value)} />
            <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-text-secondary">Status</span><select value={form.status_id} onChange={(event) => updateField("status_id", event.target.value)} className="h-10 w-full rounded-lg border border-border-default bg-surface-raised px-3 text-[13px] text-text-primary outline-none focus:border-app-accent">{statuses.map((status) => <option key={status.status_id} value={status.status_id}>{status.status_name}</option>)}</select></label>
            <Field label="VICI link" type="url" value={form.vici_link} onChange={(value) => updateField("vici_link", value)} placeholder="https://..." />
          </div>
          {error && <p className="mx-5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4"><button type="button" onClick={closeModal} className="rounded-lg border border-border-default px-4 py-2.5 text-[13px] font-semibold text-text-secondary hover:bg-surface-overlay">Cancel</button><button disabled={saving} type="submit" className={`rounded-lg ${colors.bg} px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60`}>{saving ? "Saving..." : editing ? "Save changes" : "Add employee"}</button></div>
        </form>
      </div>}
    </main>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: ReturnType<typeof getAccentColors> }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-border-default bg-card p-4 shadow-sm"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color.bgLight} ${color.text}`}>{icon}</span><div><p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</p><p className="mt-0.5 text-[25px] font-bold leading-none text-text-primary">{value}</p></div></div>;
}

function Field({ label, value, onChange, type = "text", required = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-text-secondary">{label}{required && <span className="ml-1 text-red-500">*</span>}</span><input required={required} type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-border-default bg-surface-raised px-3 text-[13px] text-text-primary outline-none transition placeholder:text-text-muted focus:border-app-accent" /></label>;
}
