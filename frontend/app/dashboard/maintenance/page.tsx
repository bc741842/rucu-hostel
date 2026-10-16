"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Wrench,
  Send,
  Clock,
  CheckCircle2,
  Hourglass,
} from "lucide-react";
import { api } from "../../../lib/api";
import { LoadingBlock } from "../../../components/ui/Skeleton";

interface MaintenanceRequest {
  id: string;
  location: string;
  description: string;
  status: "Open" | "InProgress" | "Resolved";
  resolvedNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  hostel: { name: string };
}

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-danger-50 text-danger-600",
  InProgress: "bg-gold-500/15 text-gold-700",
  Resolved: "bg-success-50 text-success-600",
};

const STATUS_ICONS: Record<string, any> = {
  Open: AlertCircle,
  InProgress: Hourglass,
  Resolved: CheckCircle2,
};

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/maintenance/my");
      setRequests(res.data);
      setError("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not load your maintenance requests.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!location.trim() || !description.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    try {
      const res = await api.post("/maintenance", {
        location: location.trim(),
        description: description.trim(),
      });
      setRequests((prev) => [res.data, ...prev]);
      setLocation("");
      setDescription("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message ||
          "Could not submit your report. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        Support
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        Maintenance Requests
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        Report a problem with your room or any common area in your hostel.
      </p>

      {/* New request form */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-xl rounded-card border border-line bg-white p-5"
      >
        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Wrench size={15} /> Report a new issue
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-ink-light">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. My room (Room 12, Bed B) or 2nd floor common bathroom"
              className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-light">
              Describe the problem
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What's wrong and since when?"
              className="mt-1 w-full resize-none rounded-lg border border-line bg-cream px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
            />
          </div>
        </div>

        {submitError && (
          <p className="mt-3 text-xs text-danger-600">{submitError}</p>
        )}
        {submitSuccess && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-success-600">
            <CheckCircle2 size={13} /> Report submitted.
          </p>
        )}

        <button
          type="submit"
          disabled={!location.trim() || !description.trim() || submitting}
          className="mt-4 flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          Submit report
        </button>
      </form>

      {/* My requests list */}
      <div className="mt-8 max-w-xl">
        <p className="text-sm font-semibold text-ink">My reports</p>

        {loading && <LoadingBlock />}

        {!loading && error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-danger-600/20 bg-danger-50 p-4 text-sm text-danger-600">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="mt-3 rounded-card border border-line bg-white p-6 text-center text-sm text-ink-light">
            You haven't reported anything yet.
          </div>
        )}

        {!loading && !error && requests.length > 0 && (
          <div className="mt-3 space-y-2">
            {requests.map((r, i) => {
              const Icon = STATUS_ICONS[r.status] ?? Clock;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-card border border-line bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {r.location}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-light">
                        {r.description}
                      </p>
                    </div>
                    <span
                      className={`flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[r.status]}`}
                    >
                      <Icon size={11} />
                      {r.status === "InProgress" ? "In Progress" : r.status}
                    </span>
                  </div>

                  {r.status === "Resolved" && r.resolvedNote && (
                    <p className="mt-2 rounded-lg bg-success-50 px-3 py-2 text-xs text-success-600">
                      {r.resolvedNote}
                    </p>
                  )}

                  <p className="mt-2 text-[11px] text-ink-light">
                    Reported {new Date(r.createdAt).toLocaleString()}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
