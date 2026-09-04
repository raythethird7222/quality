"use client";

// QA assignment settings page: search, filter, edit, bulk-edit, and add agents,
// persisting changes to the database through the assignments API route.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  ChevronLeft,
  ChevronDown,
  Save,
  Search,
  Settings,
  UserPlus,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

import AddAgentModal, {
  type NewAgentPayload,
} from "@/components/ui/add-agent-modal";

import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";
import { assignmentPayloadSchema } from "@/features/assignments/validation";
import Pagination, { paginate } from "@/components/ui/pagination";
import type { AvailableAgentOption, IdNameOption } from "@/lib/db/assignments";

// Props for the assignment settings page component.
type AssignmentSettingsViewProps = {
  lobs: IdNameOption[];
  teamLeads: IdNameOption[];
  evaluators: IdNameOption[];
  coaches: IdNameOption[];
  availableAgents: AvailableAgentOption[];
  initialAgents: AgentRow[];
  account: string;
};

// Shape of a single editable agent row in the assignment table.
type AgentRow = {
  assignmentId?: number;
  agentId?: number;
  name: string;
  lobId: number;
  coachId: number | null;
  evaluatorId: number | null;
  teamLeadId: number | null;
  status: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

// Assignment settings page: manages agent table state, filtering, and saving.
export default function AssignmentSettingsView({
  lobs,
  teamLeads,
  evaluators,
  coaches,
  availableAgents,
  initialAgents,
  account,
}: AssignmentSettingsViewProps) {
  const selectedAccent = useAccent();
  const { showToast } = useToast();
  const a = getAccentColors(selectedAccent);

  const [search, setSearch] = useState("");
  const [lobFilter, setLobFilter] = useState<number | "ALL">("ALL");

  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [bulkCoach, setBulkCoach] = useState<number | null>(null);
  const [bulkEvaluator, setBulkEvaluator] = useState<number | null>(null);
  const [bulkTeamLead, setBulkTeamLead] = useState<number | null>(null);

  const [agents, setAgents] = useState<AgentRow[]>(initialAgents);

  const [addAgentOpen, setAddAgentOpen] = useState(false);

  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    const client = createBrowserClient();
    const channel = client
      .channel(`account-assignments-${account}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_assignments" }, () => window.location.reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "employee_assignments" }, () => window.location.reload())
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [account]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const displayName = (row: AgentRow) => row.name || "Unnamed agent";

  // ------------------------------------------------------------
  // OPTIONS
  // ------------------------------------------------------------

  // IMPORTANT:
  // Team Lead dropdown uses only employees with the team lead role.
  // This ensures only actual TLs are selectable.
  const teamLeadOptions = useMemo(
    () => [{ id: 0, name: "Unassigned" }, ...teamLeads],
    [teamLeads]
  );

  // QA Evaluator dropdown — only actual evaluators assigned to this account.
  const evaluatorOptions = useMemo(
    () => [{ id: 0, name: "Unassigned" }, ...evaluators],
    [evaluators]
  );

  // QA Coach dropdown — only actual coaches assigned to this account.
  const coachOptions = useMemo(
    () => [{ id: 0, name: "Unassigned" }, ...coaches],
    [coaches]
  );

  // ------------------------------------------------------------
  // FILTERING
  // ------------------------------------------------------------

  const filtered = useMemo(() => {
    return agents.filter((agent) => {
      const matchSearch = displayName(agent)
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchLob =
        lobFilter === "ALL" || agent.lobId === lobFilter;

      return matchSearch && matchLob;
    });
  }, [agents, search, lobFilter]);

  // ------------------------------------------------------------
  // PAGINATION
  // ------------------------------------------------------------

  const paginated = useMemo(
    () => paginate(filtered, page, pageSize),
    [filtered, page, pageSize]
  );

  // ------------------------------------------------------------
  // SELECTION
  // ------------------------------------------------------------

  const allSelected =
    paginated.length > 0 &&
    paginated.every((agent) =>
      selected.has(agents.indexOf(agent))
    );

  function toggleSelectAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);

        paginated.forEach((agent) => {
          next.delete(agents.indexOf(agent));
        });

        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);

        paginated.forEach((agent) => {
          next.add(agents.indexOf(agent));
        });

        return next;
      });
    }
  }

  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }

      return next;
    });
  }

  // ------------------------------------------------------------
  // ROW UPDATE
  // ------------------------------------------------------------

  function updateRow(
    idx: number,
    patch: Partial<AgentRow>
  ) {
    setAgents((prev) =>
      prev.map((agent, i) =>
        i === idx
          ? {
              ...agent,
              ...patch,
            }
          : agent
      )
    );

    setSaveState("idle");
  }

  // ------------------------------------------------------------
  // BULK UPDATE
  // ------------------------------------------------------------

  function applyBulk(
    field: "coachId" | "evaluatorId" | "teamLeadId",
    value: number | null
  ) {
    if (value == null) return;

    setAgents((prev) =>
      prev.map((agent, i) =>
        selected.has(i)
          ? {
              ...agent,
              [field]: value,
            }
          : agent
      )
    );

    setSaveState("idle");
  }

  // ------------------------------------------------------------
  // ADD AGENT
  // ------------------------------------------------------------

  // Saves the new agent directly to the database via the assignments API and
  // appends the persisted row to the table so it shows up right away.
  async function addAgent(
    payload: NewAgentPayload
  ): Promise<{ ok: boolean; error?: string }> {
    const row = {
      assignmentId: payload.assignmentId,
      agentId: payload.agentId,
      lobId: payload.lobId,
      coachId: payload.coachId,
      evaluatorId: payload.evaluatorId,
      teamLeadId: payload.teamLeadId,
    };

    const parsed = assignmentPayloadSchema.safeParse({ rows: [row] });
    if (!parsed.success) {
      const first =
        parsed.error.issues[0]?.message ?? "Validation failed";
      setSaveState("error");
      showToast("error", first);
      return { ok: false, error: first };
    }

    setSaveState("saving");

    try {
      const res = await fetch(
        `/api/accounts/${account}/assignments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: [row] }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        const msg = data.error ?? "Failed to save new agent";
        setSaveState("error");
        showToast("error", msg);
        return { ok: false, error: msg };
      }

      const saved = data.rows?.[0] as
        | { assignmentId: number; agentId: number; name: string }
        | undefined;

      setAgents((prev) => [
        ...prev,
        {
          assignmentId: saved?.assignmentId ?? payload.assignmentId,
          agentId: saved?.agentId ?? payload.agentId,
          name: saved?.name ?? availableAgents.find((agent) => agent.id === payload.agentId)?.name ?? "Unnamed agent",
          lobId: payload.lobId,
          coachId: payload.coachId,
          evaluatorId: payload.evaluatorId,
          teamLeadId: payload.teamLeadId,
          status: "ACTIVE",
        },
      ]);

      setSaveState("saved");
      showToast("success", "QA assignment saved and notification sent.");
      return { ok: true };
    } catch {
      const msg = "Network error while saving new agent";
      setSaveState("error");
      showToast("error", msg);
      return { ok: false, error: msg };
    }
  }

  // ------------------------------------------------------------
  // SAVE
  // ------------------------------------------------------------

  async function handleSave() {

    const payload = agents.map((agent) => ({
      assignmentId: agent.assignmentId,

      agentId: agent.agentId,

      lobId: agent.lobId,
      coachId: agent.coachId,
      evaluatorId: agent.evaluatorId,
      teamLeadId: agent.teamLeadId,
    }));

    const parsed = assignmentPayloadSchema.safeParse({
      rows: payload,
    });

    if (!parsed.success) {
      setSaveState("error");
      showToast("error", parsed.error.issues[0]?.message ?? "Validation failed");

      return;
    }

    setSaveState("saving");

    try {
      const res = await fetch(
        `/api/accounts/${account}/assignments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rows: payload,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {

        setSaveState("error");
        showToast("error", data.error ?? "Failed to save assignments");

        return;
      }

      // Merge returned IDs back into local state
      // so subsequent saves update existing records.
      const saved: {
        assignmentId: number;
        agentId: number;
        name: string;
      }[] = data.rows ?? [];

      setAgents((prev) =>
        prev.map((agent, i) => {
          const s = saved[i];

          if (!s) {
            return agent;
          }

          return {
            ...agent,

            assignmentId: s.assignmentId,

            agentId: s.agentId ?? agent.agentId,
            name: s.name || agent.name,
          };
        })
      );

      setSelected(new Set());
      setSaveState("saved");
      showToast("success", "QA assignments saved and notification sent.");
    } catch {

      setSaveState("error");
      showToast("error", "Network error while saving assignments");
    }
  }

  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="w-full px-6 py-5 md:px-9">

        {/* ---------------------------------------------------- */}
        {/* BACK */}
        {/* ---------------------------------------------------- */}

        <div className="mb-5 flex items-center gap-4">
          <Link
            href={`/accounts/${account.toLowerCase()}/dashboard`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary transition hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* ---------------------------------------------------- */}
        {/* MAIN CARD */}
        {/* ---------------------------------------------------- */}

        <div className="rounded-2xl border border-border-default bg-card shadow-sm">

          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
            <h2 className="flex items-center gap-2.5 text-[16px] font-bold text-text-primary">
              <span
                className={`grid h-9 w-9 place-items-center rounded-lg ${a.bgLight}`}
              >
                <Settings
                  size={18}
                  className={a.text}
                />
              </span>

              QA Assignment Settings
            </h2>
          </div>

          {/* -------------------------------------------------- */}
          {/* SEARCH + FILTER */}
          {/* -------------------------------------------------- */}

          <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-6 py-3">

            {/* Search */}

            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />

              <input
                type="text"
                placeholder="Search agent..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-border-default bg-card py-2 pl-9 pr-3 text-[13px] text-text-primary outline-none transition placeholder:text-text-muted/60 focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              />
            </div>

            {/* LOB */}

            <div className="relative">
              <select
                value={lobFilter}
                onChange={(e) => {
                  setLobFilter(
                    e.target.value === "ALL"
                      ? "ALL"
                      : Number(e.target.value)
                  );

                  setPage(1);
                }}
                className="appearance-none rounded-lg border border-border-default bg-card py-2 pl-3 pr-8 text-[13px] text-text-primary outline-none transition focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              >
                <option value="ALL">
                  All LOBs
                </option>

                {lobs.map((lob) => (
                  <option
                    key={lob.id}
                    value={lob.id}
                  >
                    {lob.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
            </div>
          </div>

          {/* -------------------------------------------------- */}
          {/* BULK ACTIONS */}
          {/* -------------------------------------------------- */}

          <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle bg-surface-raised/50 px-6 py-3">

            {/* BULK COACH */}

            <span className="text-[12px] font-semibold text-text-secondary">
              Bulk Coach
            </span>

            <div className="relative">
              <select
                value={bulkCoach ?? 0}
                onChange={(e) =>
                  setBulkCoach(
                    Number(e.target.value) || null
                  )
                }
                className="appearance-none rounded-lg border border-border-default bg-card py-1.5 pl-3 pr-8 text-[12px] text-text-primary outline-none"
              >
                <option value={0}>
                  -- Select QA --
                </option>

                {coaches.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                  >
                    {p.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
              />
            </div>

            <button
              onClick={() =>
                applyBulk(
                  "coachId",
                  bulkCoach
                )
              }
              className={`rounded-lg border ${a.border} bg-card px-3 py-1.5 text-[12px] font-semibold ${a.text} transition ${a.hoverBg}`}
            >
              Apply
            </button>

            {/* BULK EVALUATOR */}

            <span className="ml-2 text-[12px] font-semibold text-text-secondary">
              Bulk Evaluator
            </span>

            <div className="relative">
              <select
                value={bulkEvaluator ?? 0}
                onChange={(e) =>
                  setBulkEvaluator(
                    Number(e.target.value) || null
                  )
                }
                className="appearance-none rounded-lg border border-border-default bg-card py-1.5 pl-3 pr-8 text-[12px] text-text-primary outline-none"
              >
                <option value={0}>
                  -- Select QA --
                </option>

                {evaluators.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                  >
                    {p.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
              />
            </div>

            <button
              onClick={() =>
                applyBulk(
                  "evaluatorId",
                  bulkEvaluator
                )
              }
              className={`rounded-lg border ${a.border} bg-card px-3 py-1.5 text-[12px] font-semibold ${a.text} transition ${a.hoverBg}`}
            >
              Apply
            </button>

            {/* ------------------------------------------------ */}
            {/* BULK TEAM LEAD */}
            {/* ------------------------------------------------ */}

            <span className="ml-2 text-[12px] font-semibold text-text-secondary">
              Bulk Team Lead
            </span>

            <div className="relative">
              <select
                value={bulkTeamLead ?? 0}
                onChange={(e) =>
                  setBulkTeamLead(
                    Number(e.target.value) || null
                  )
                }
                className="appearance-none rounded-lg border border-border-default bg-card py-1.5 pl-3 pr-8 text-[12px] text-text-primary outline-none"
              >
                <option value={0}>
                  -- Select Team Lead --
                </option>

                {/* IMPORTANT:
                    Only teamLeads are displayed here.
                    This should contain all 16 TLs.
                */}

                {teamLeadOptions.map((tl) => (
                  <option
                    key={tl.id}
                    value={tl.id}
                  >
                    {tl.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
              />
            </div>

            <button
              onClick={() =>
                applyBulk(
                  "teamLeadId",
                  bulkTeamLead
                )
              }
              className={`rounded-lg border ${a.border} bg-card px-3 py-1.5 text-[12px] font-semibold ${a.text} transition ${a.hoverBg}`}
            >
              Apply
            </button>

            {/* ADD AGENT */}

            <button
              onClick={() =>
                setAddAgentOpen(true)
              }
              className={`ml-auto inline-flex items-center gap-1.5 rounded-lg ${a.bg} px-3 py-1.5 text-[12px] font-semibold text-white transition hover:opacity-90`}
            >
              <UserPlus size={13} />
              Add Agent
            </button>
          </div>

          {/* -------------------------------------------------- */}
          {/* SAVE MESSAGES */}
          {/* -------------------------------------------------- */}

          {/* -------------------------------------------------- */}
          {/* TABLE */}
          {/* -------------------------------------------------- */}

          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-left">

              <thead className="sticky top-0 z-10 bg-surface-raised">
                <tr className="border-b-2 border-border-default">

                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border-default accent-[var(--primary)]"
                    />
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Agent
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    LOB
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    QA Coach
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    QA Evaluator
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Team Lead
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((agent) => {
                  const idx =
                    agents.indexOf(agent);

                  return (
                    <tr
                      key={
                        agent.assignmentId ??
                        `new-${idx}`
                      }
                      className="border-b border-border-subtle transition hover:bg-surface-overlay/40"
                    >

                      {/* SELECT */}

                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(idx)}
                          onChange={() =>
                            toggleSelect(idx)
                          }
                          className="h-4 w-4 rounded border-border-default accent-[var(--primary)]"
                        />
                      </td>

                      {/* AGENT */}

                      <td className="px-4 py-3 text-[13px] font-medium text-text-primary">
                        {displayName(agent)}
                      </td>

                      {/* LOB */}

                      <td className="px-4 py-3">
                        <CellSelect
                          value={agent.lobId}
                          onChange={(v) =>
                            updateRow(idx, {
                              lobId: Number(v),
                            })
                          }
                          options={lobs}
                        />
                      </td>

                       {/* QA COACH */}

                       <td className="px-4 py-3">
                         <CellSelect
                           value={
                             agent.coachId ?? 0
                           }
                           onChange={(v) =>
                             updateRow(idx, {
                               coachId:
                                 Number(v) || null,
                             })
                           }
                           options={
                             coachOptions
                           }
                         />
                       </td>

                       {/* QA EVALUATOR */}

                       <td className="px-4 py-3">
                         <CellSelect
                           value={
                             agent.evaluatorId ??
                             0
                           }
                           onChange={(v) =>
                             updateRow(idx, {
                               evaluatorId:
                                 Number(v) ||
                                 null,
                             })
                           }
                           options={
                             evaluatorOptions
                           }
                         />
                       </td>

                      {/* TEAM LEAD */}

                      <td className="px-4 py-3">
                        <CellSelect
                          value={
                            agent.teamLeadId ??
                            0
                          }
                          onChange={(v) =>
                            updateRow(idx, {
                              teamLeadId:
                                Number(v) ||
                                null,
                            })
                          }
                          options={
                            teamLeadOptions
                          }
                        />
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            agent.status ===
                              "ACTIVE" ||
                            agent.status ===
                              "INACTIVE"
                              ? agent.status ===
                                "ACTIVE"
                                ? "bg-brand-indigo/10 text-brand-indigo"
                                : "bg-brand-gold/10 text-brand-gold"
                              : "bg-brand-indigo/10 text-brand-indigo"
                          }`}
                        >
                          {agent.status ===
                            "ACTIVE" && (
                            <Check size={10} />
                          )}

                          {agent.status ||
                            "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* EMPTY STATE */}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-[13px] text-text-muted"
                    >
                      No agents match your
                      search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* -------------------------------------------------- */}
          {/* PAGINATION */}
          {/* -------------------------------------------------- */}

          <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />

          {/* -------------------------------------------------- */}
          {/* SAVE */}
          {/* -------------------------------------------------- */}

          <div className="flex items-center justify-end gap-3 border-t border-border-subtle px-6 py-4">
            <button
              onClick={handleSave}
              disabled={
                saveState === "saving"
              }
              className={`inline-flex items-center gap-2 rounded-lg ${a.bg} px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60`}
            >
              <Save size={14} />

              {saveState === "saving"
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* ADD AGENT MODAL */}
      {/* ------------------------------------------------------ */}

      <AddAgentModal
        open={addAgentOpen}
        onClose={() =>
          setAddAgentOpen(false)
        }
        onSave={addAgent}
        accent={selectedAccent}
        agents={availableAgents}
        lobs={lobs}
        coaches={coaches}
        evaluators={evaluators}
        teamLeads={teamLeads}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Compact select used inside table cells.
// ------------------------------------------------------------

function CellSelect({
  value,
  onChange,
  options,
}: {
  value: number;
  onChange: (v: string) => void;
  options: IdNameOption[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full appearance-none rounded-lg border border-border-default bg-card py-1.5 pl-2 pr-7 text-[12px] text-text-primary outline-none transition focus:border-border-accent focus:ring-1 focus:ring-border-accent"
      >
        {options.map((opt) => (
          <option
            key={opt.id}
            value={opt.id}
          >
            {opt.name}
          </option>
        ))}
      </select>

      <ChevronDown
        size={12}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}
