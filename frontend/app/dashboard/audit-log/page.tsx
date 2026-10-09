"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../../../lib/api";

interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  description: string;
  entityType: string | null;
  entityId: string | null;
  beforeData: Record<string, any> | null;
  afterData: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface Actor {
  actorId: string;
  actorName: string;
  actorRole: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function roleBadgeClasses(role: string): string {
  switch (role) {
    case "super_admin":
      return "bg-navy-900/10 text-navy-900";
    case "warden":
      return "bg-gold-500/15 text-gold-700";
    case "accountant":
      return "bg-success-50 text-success-600";
    default:
      return "bg-line/50 text-ink-light";
  }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (actorFilter) params.actorId = actorFilter;
      if (actionFilter) params.action = actionFilter;
      if (fromDate) params.from = new Date(fromDate).toISOString();
      if (toDate) params.to = new Date(toDate + "T23:59:59").toISOString();
      const res = await api.get("/audit-logs", { params });
      setLogs(res.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api
      .get("/audit-logs/actors")
      .then((res) => setActors(res.data ?? []))
      .catch(() => {});
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    fetchLogs();
  }

  function handleClearFilters() {
    setActorFilter("");
    setActionFilter("");
    setFromDate("");
    setToDate("");
    setTimeout(fetchLogs, 0);
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        Super Admin
      </p>
      <h2 className="mt-1 flex items-center gap-2 font-display text-3xl font-semibold text-ink">
        <ShieldAlert size={26} /> Audit Log
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-light">
        A record of sensitive actions taken by staff — payment confirmations,
        maintenance status changes, announcements, and other data changes.
      </p>

      {/* Filters */}
      <form
        onSubmit={handleApplyFilters}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-card border border-line bg-white p-4"
      >
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink">
            Staff member
          </label>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-navy-900"
          >
            <option value="">All staff</option>
            {actors.map((a) => (
              <option key={a.actorId} value={a.actorId}>
                {a.actorName} ({a.actorRole})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink">
            Action contains
          </label>
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="e.g. payment, maintenance"
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-light/50 focus:border-navy-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink">
            From
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-navy-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink">
            To
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-navy-900"
          />
        </div>

        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700"
        >
          <Filter size={14} /> Apply
        </button>
        <button
          type="button"
          onClick={handleClearFilters}
          className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-light hover:bg-cream"
        >
          Clear
        </button>
      </form>

      {/* Logs list */}
      <div className="mt-6 overflow-hidden rounded-card border border-line bg-white">
        {loading ? (
          <div className="py-12 text-center text-sm text-ink-light">
            Loading...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink-light">
            No audit log entries match these filters.
          </div>
        ) : (
          <div className="divide-y divide-line">
            {logs.map((log, index) => {
              const hasDiff = log.beforeData || log.afterData;
              const expanded = expandedId === log.id;
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className="px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {log.actorName}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeClasses(
                            log.actorRole,
                          )}`}
                        >
                          {log.actorRole}
                        </span>
                        <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] font-mono text-ink-light">
                          {log.action}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-ink">
                        {log.description}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-light/80">
                        <span>{formatDate(log.createdAt)}</span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                    {hasDiff && (
                      <button
                        onClick={() =>
                          setExpandedId(expanded ? null : log.id)
                        }
                        className="flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-light hover:bg-cream"
                      >
                        Details
                        {expanded ? (
                          <ChevronUp size={13} />
                        ) : (
                          <ChevronDown size={13} />
                        )}
                      </button>
                    )}
                  </div>

                  {expanded && hasDiff && (
                    <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-cream p-3 text-xs sm:grid-cols-2">
                      {log.beforeData && (
                        <div>
                          <p className="mb-1 font-semibold uppercase tracking-wide text-ink-light">
                            Before
                          </p>
                          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-ink">
                            {JSON.stringify(log.beforeData, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.afterData && (
                        <div>
                          <p className="mb-1 font-semibold uppercase tracking-wide text-ink-light">
                            After
                          </p>
                          <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-ink">
                            {JSON.stringify(log.afterData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
