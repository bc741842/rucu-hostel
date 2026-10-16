"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  User,
  Phone,
} from "lucide-react";
import { api } from "../../../lib/api";
import { LoadingBlock } from "../../../components/ui/Skeleton";
import { useTable } from "../../../components/ui/useTable";
import SearchInput from "../../../components/ui/SearchInput";
import Pagination from "../../../components/ui/Pagination";
import Button from "../../../components/ui/Button";
import { downloadCsv } from "../../../lib/csv";
import { useLang } from "../../../lib/i18n";

interface Hostel {
  id: string;
  name: string;
}

interface MaintenanceRequest {
  id: string;
  location: string;
  description: string;
  status: "Open" | "InProgress" | "Resolved";
  resolvedNote: string | null;
  createdAt: string;
  student: { name: string; regNo: string; phone: string | null };
  hostel: { id: string; name: string };
  resolvedBy: { name: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-danger-50 text-danger-600",
  InProgress: "bg-gold-500/15 text-gold-700",
  Resolved: "bg-success-50 text-success-600",
};

const NEXT_STATUS: Record<string, string | null> = {
  Open: "InProgress",
  InProgress: "Resolved",
  Resolved: null,
};

const NEXT_LABEL: Record<string, string> = {
  Open: "Start work",
  InProgress: "Mark resolved",
};

export default function MaintenanceManagePage() {
  const { t } = useLang();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [hostelFilter, setHostelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const table = useTable(requests, (x) => `${x.location} ${x.description} ${x.student.name} ${x.student.regNo} ${x.hostel.name}`, 8);

  function exportCsv() {
    downloadCsv("maintenance-requests.csv", [
      ["Date", "Hostel", "Location", "Description", "Student", "RegNo", "Status"],
      ...table.filtered.map((x) => [new Date(x.createdAt).toLocaleDateString("en-GB"), x.hostel.name, x.location, x.description, x.student.name, x.student.regNo, x.status]),
    ]);
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get("/hostels").then((res) => setHostels(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelFilter, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (hostelFilter) params.hostelId = hostelFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/maintenance/admin", { params });
      setRequests(res.data);
      setError("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Could not load maintenance requests.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function advanceStatus(r: MaintenanceRequest) {
    const next = NEXT_STATUS[r.status];
    if (!next) return;
    setUpdatingId(r.id);
    try {
      const body: any = { status: next };
      if (next === "Resolved" && noteDraft[r.id]) {
        body.resolvedNote = noteDraft[r.id];
      }
      const res = await api.patch(`/maintenance/admin/${r.id}/status`, body);
      setRequests((prev) => prev.map((x) => (x.id === r.id ? res.data : x)));
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Could not update this request.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        {t("Hostel Operations")}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        {t("Manage Maintenance Requests")}
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        {t("Track and resolve issues reported by students.")}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <select
          value={hostelFilter}
          onChange={(e) => setHostelFilter(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
        >
          <option value="">{t("All hostels")}</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
        >
          <option value="">{t("All statuses")}</option>
          <option value="Open">{t("Open")}</option>
          <option value="InProgress">{t("In Progress")}</option>
          <option value="Resolved">{t("Resolved")}</option>
        </select>
      </div>

      <div className="mt-5 max-w-3xl">
        {!loading && !error && requests.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <SearchInput
              value={table.query}
              onChange={table.setQuery}
              placeholder="Search description, student..."
            />
            <Button variant="secondary" onClick={exportCsv}>
              {t("Export CSV")}
            </Button>
          </div>
        )}

        {!loading && !error && requests.length > 0 && table.filtered.length === 0 && (
          <div className="mt-4 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
            {t("No results match your search.")}
          </div>
        )}

        {loading && <LoadingBlock />}

        {!loading && error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger-600/20 bg-danger-50 p-4 text-sm text-danger-600">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
            {t("No maintenance requests match this filter.")}
          </div>
        )}

        {!loading && !error && table.filtered.length > 0 && (
          <div className="mt-4 space-y-3">
            {table.pageRows.map((r, i) => {
              const next = NEXT_STATUS[r.status];
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-card border border-line bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {r.location}{" "}
                        <span className="text-xs font-normal text-ink-light">
                          &middot; {r.hostel.name}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-light">
                        {r.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-light">
                        <span className="flex items-center gap-1">
                          <User size={11} /> {r.student.name} (
                          {r.student.regNo})
                        </span>
                        {r.student.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={11} /> {r.student.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status === "InProgress" ? "In Progress" : r.status}
                    </span>
                  </div>

                  {r.status === "InProgress" && (
                    <input
                      type="text"
                      value={noteDraft[r.id] ?? ""}
                      onChange={(e) =>
                        setNoteDraft((prev) => ({
                          ...prev,
                          [r.id]: e.target.value,
                        }))
                      }
                      placeholder={t("Optional note for the student (e.g. what was fixed)")}
                      className="mt-3 w-full rounded-lg border border-line bg-cream px-3 py-2 text-xs text-ink focus:border-navy-500 focus:outline-none"
                    />
                  )}

                  {r.status === "Resolved" && r.resolvedNote && (
                    <p className="mt-2 rounded-lg bg-success-50 px-3 py-2 text-xs text-success-600">
                      {r.resolvedNote}
                      {r.resolvedBy && (
                        <span className="text-success-600/70">
                          {" "}
                          &mdash; {r.resolvedBy.name}
                        </span>
                      )}
                    </p>
                  )}

                  {next && (
                    <button
                      onClick={() => advanceStatus(r)}
                      disabled={updatingId === r.id}
                      className="mt-3 flex items-center gap-1.5 rounded-lg bg-navy-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-navy-700 disabled:opacity-60"
                    >
                      {updatingId === r.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : r.status === "Open" ? (
                        <Hourglass size={13} />
                      ) : (
                        <CheckCircle2 size={13} />
                      )}
                      {NEXT_LABEL[r.status]}
                      <ArrowRight size={12} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && !error && (
          <Pagination
            page={table.page}
            pageCount={table.pageCount}
            total={table.filtered.length}
            pageSize={table.pageSize}
            onPage={table.setPage}
          />
        )}

      </div>
    </div>
  );
}
