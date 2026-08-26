"use client";

// QA assignment settings page: search, filter, bulk-edit, and add agents in a table.
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronDown,
  Save,
  Search,
  Settings,
  UserPlus,
  Check,
} from "lucide-react";
import AddAgentModal from "@/components/ui/add-agent-modal";
import { getAccentColors } from "@/features/accounts/config";
import { useAccent } from "@/features/settings/useAccent";

// Props for the assignment settings page component.
type AssignmentSettingsViewProps = {
  qaList: string[];
  lobOptions: string[];
  teamLeads: string[];
  initialAgents: AgentRow[];
  account: string;
};

// Shape of a single agent row in the assignment table.
type AgentRow = {
  name: string;
  lob: string;
  coach: string;
  evaluator: string;
  teamLead: string;
  status: string;
};

// Assignment settings page: manages agent table state, filtering, and bulk updates.
export default function AssignmentSettingsView({
  qaList,
  lobOptions,
  teamLeads,
  initialAgents,
  account,
}: AssignmentSettingsViewProps) {
  const selectedAccent = useAccent();
  const a = getAccentColors(selectedAccent);
  // Local state: search/filter controls, selection set, bulk-edit values, agent rows, and add-agent visibility.
  const [search, setSearch] = useState("");
  const [lobFilter, setLobFilter] = useState("ALL");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkCoach, setBulkCoach] = useState("");
  const [bulkEvaluator, setBulkEvaluator] = useState("");
  const [bulkTeamLead, setBulkTeamLead] = useState("");
  const [agents, setAgents] = useState(initialAgents);
  const [addAgentOpen, setAddAgentOpen] = useState(false);

  // Derived list of agents matching the current search text and LOB filter.
  const filtered = useMemo(() => {
    return agents.filter((agent) => {
      const matchSearch = agent.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchLob =
        lobFilter === "ALL" || agent.lob === lobFilter;
      return matchSearch && matchLob;
    });
  }, [agents, search, lobFilter]);

  // True when every visible (filtered) agent is in the selection set.
  const allSelected =
    filtered.length > 0 &&
    filtered.every((_, i) => {
      const idx = agents.indexOf(filtered[i]);
      return selected.has(idx);
    });

  // Selects or clears all currently filtered agents in one action.
  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      const next = new Set<number>();
      filtered.forEach((agent) =>
        next.add(agents.indexOf(agent))
      );
      setSelected(next);
    }
  }

  // Toggles a single agent's row selection by its index.
  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  // Applies the chosen bulk coach to every selected agent row.
  function applyBulkCoach() {
    if (!bulkCoach) return;
    setAgents((prev) =>
      prev.map((agent, i) =>
        selected.has(i) ? { ...agent, coach: bulkCoach } : agent
      )
    );
  }

  // Applies the chosen bulk evaluator to every selected agent row.
  function applyBulkEvaluator() {
    if (!bulkEvaluator) return;
    setAgents((prev) =>
      prev.map((agent, i) =>
        selected.has(i)
          ? { ...agent, evaluator: bulkEvaluator }
          : agent
      )
    );
  }

  // Applies the chosen bulk team lead to every selected agent row.
  function applyBulkTeamLead() {
    if (!bulkTeamLead) return;
    setAgents((prev) =>
      prev.map((agent, i) =>
        selected.has(i)
          ? { ...agent, teamLead: bulkTeamLead }
          : agent
      )
    );
  }

  // Appends a newly created agent row to the agent list.
  function addAgent(agentData: {
    id: string;
    name: string;
    email: string;
    hireDate: string;
    lob: string;
    coach: string;
    evaluator: string;
    teamLead: string;
    status: string;
  }) {
    setAgents((prev) => [
      ...prev,
      {
        name: agentData.name || "NEW AGENT",
        lob: agentData.lob,
        coach: agentData.coach,
        evaluator: agentData.evaluator,
        teamLead: agentData.teamLead,
        status: agentData.status,
      },
    ]);
  }

  // Main page layout: header, toolbar, bulk actions, table, and footer.
  return (
    <div className="min-h-full bg-surface-base text-text-primary">
      <div className="mx-auto max-w-[1440px] px-6 py-5 md:px-9">
        {/* Header with back navigation */}
        <div className="mb-5 flex items-center gap-4">
          <Link
            href={`/accounts/${account.toLowerCase()}/dashboard`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary transition hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="rounded-2xl border border-border-default bg-card shadow-sm">
          {/* Page Header */}
          <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
            <h2 className="flex items-center gap-2.5 text-[16px] font-bold text-text-primary">
              <span
                className={`grid h-9 w-9 place-items-center rounded-lg ${a.bgLight}`}
              >
                <Settings size={18} className={a.text} />
              </span>
              QA Assignment Settings
            </h2>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-6 py-3">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Search agent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-card py-2 pl-9 pr-3 text-[13px] text-text-primary outline-none transition placeholder:text-text-muted/60 focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              />
            </div>
            <div className="relative">
              <select
                value={lobFilter}
                onChange={(e) => setLobFilter(e.target.value)}
                className="appearance-none rounded-lg border border-border-default bg-card py-2 pl-3 pr-8 text-[13px] text-text-primary outline-none transition focus:border-border-accent focus:ring-1 focus:ring-border-accent"
              >
                {lobOptions.map((lob) => (
                  <option key={lob} value={lob}>
                    {lob === "ALL" ? "All LOBs" : lob}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle bg-surface-raised/50 px-6 py-3">
            <span className="text-[12px] font-semibold text-text-secondary">
              Bulk Coach
            </span>
            <div className="relative">
              <select
                value={bulkCoach}
                onChange={(e) => setBulkCoach(e.target.value)}
                className="appearance-none rounded-lg border border-border-default bg-card py-1.5 pl-3 pr-8 text-[12px] text-text-primary outline-none"
              >
                <option value="">-- Select QA --</option>
                {qaList.map((qa) => (
                  <option key={qa} value={qa}>
                    {qa}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
              />
            </div>
            <button
              onClick={applyBulkCoach}
              className={`rounded-lg border ${a.border} bg-card px-3 py-1.5 text-[12px] font-semibold ${a.text} transition ${a.hoverBg}`}
            >
              Apply
            </button>

            <span className="ml-2 text-[12px] font-semibold text-text-secondary">
              Bulk Evaluator
            </span>
            <div className="relative">
              <select
                value={bulkEvaluator}
                onChange={(e) => setBulkEvaluator(e.target.value)}
                className="appearance-none rounded-lg border border-border-default bg-card py-1.5 pl-3 pr-8 text-[12px] text-text-primary outline-none"
              >
                <option value="">-- Select QA --</option>
                {qaList.map((qa) => (
                  <option key={qa} value={qa}>
                    {qa}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
              />
            </div>
            <button
              onClick={applyBulkEvaluator}
              className={`rounded-lg border ${a.border} bg-card px-3 py-1.5 text-[12px] font-semibold ${a.text} transition ${a.hoverBg}`}
            >
              Apply
            </button>

            <span className="ml-2 text-[12px] font-semibold text-text-secondary">
              Bulk Team Lead
            </span>
            <div className="relative">
              <select
                value={bulkTeamLead}
                onChange={(e) => setBulkTeamLead(e.target.value)}
                className="appearance-none rounded-lg border border-border-default bg-card py-1.5 pl-3 pr-8 text-[12px] text-text-primary outline-none"
              >
                <option value="">-- Select Team Lead --</option>
                {teamLeads.map((tl) => (
                  <option key={tl} value={tl}>
                    {tl}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
              />
            </div>
            <button
              onClick={applyBulkTeamLead}
              className={`rounded-lg border ${a.border} bg-card px-3 py-1.5 text-[12px] font-semibold ${a.text} transition ${a.hoverBg}`}
            >
              Apply
            </button>

            <button
              onClick={() => setAddAgentOpen(true)}
              className={`ml-auto inline-flex items-center gap-1.5 rounded-lg ${a.bg} px-3 py-1.5 text-[12px] font-semibold text-white transition hover:opacity-90`}
            >
              <UserPlus size={13} />
              Add Agent
            </button>
          </div>

          {/* Table */}
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
                {filtered.map((agent) => {
                  const idx = agents.indexOf(agent);
                  return (
                    <tr
                      key={idx}
                      className="border-b border-border-subtle transition hover:bg-surface-overlay/40"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(idx)}
                          onChange={() => toggleSelect(idx)}
                          className="h-4 w-4 rounded border-border-default accent-[var(--primary)]"
                        />
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-text-primary">
                        {agent.name}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">
                        {agent.lob}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">
                        {agent.coach || "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">
                        {agent.evaluator || "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-text-secondary">
                        {agent.teamLead || "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            agent.status === "Active"
                              ? "bg-brand-indigo/10 text-brand-indigo"
                              : "bg-brand-gold/10 text-brand-gold"
                          }`}
                        >
                          {agent.status === "Active" && (
                            <Check size={10} />
                          )}
                          {agent.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {/* Empty state shown when no agents match the filters */}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-[13px] text-text-muted"
                    >
                      No agents match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border-subtle px-6 py-4">
            <button
              className="rounded-lg border border-border-default bg-card px-4 py-2 text-[13px] font-semibold text-text-secondary transition hover:bg-surface-overlay"
            >
              Cancel
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-lg ${a.bg} px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90`}
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
      <AddAgentModal
        open={addAgentOpen}
        onClose={() => setAddAgentOpen(false)}
        onSave={addAgent}
        accent={selectedAccent}
        qaList={qaList}
        teamLeads={teamLeads}
      />
    </div>
  );
}
