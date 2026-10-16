"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  AlertCircle,
  Phone,
  Mail,
  Clock,
  ListOrdered,
} from "lucide-react";
import { api } from "../../../lib/api";
import { LoadingBlock } from "../../../components/ui/Skeleton";
import { useLang } from "../../../lib/i18n";

interface Hostel {
  id: string;
  name: string;
  genderAllowed: string;
}

interface QueueEntry {
  id: string;
  status: string;
  joinedAt: string;
  hostel: Hostel;
  academicYear: { id: string; name: string };
  student: {
    id: string;
    regNo: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
};

export default function WaitingQueuePage() {
  const { t } = useLang();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [selectedHostelId, setSelectedHostelId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHostels();
  }, []);

  useEffect(() => {
    loadQueue();
  }, [selectedHostelId]);

  async function loadHostels() {
    try {
      const res = await api.get("/hostels");
      setHostels(res.data);
    } catch {
      // hostel dropdown is optional; the queue still works without it
    }
  }

  async function loadQueue() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/waiting-list", {
        params: selectedHostelId ? { hostelId: selectedHostelId } : {},
      });
      setEntries(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load the waiting list. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    const byHostel: Record<string, { hostel: Hostel; entries: QueueEntry[] }> = {};
    for (const entry of entries) {
      if (!byHostel[entry.hostel.id]) {
        byHostel[entry.hostel.id] = { hostel: entry.hostel, entries: [] };
      }
      byHostel[entry.hostel.id].entries.push(entry);
    }
    return Object.values(byHostel);
  }, [entries]);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        {t("Hostel Operations")}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        {t("Bed Waiting Queue")}
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        {t("A FIFO list of students waiting for a bed, by hostel. Contact them in this order as beds become available.")}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <select
          value={selectedHostelId}
          onChange={(e) => setSelectedHostelId(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
        >
          <option value="">{t("All Hostels")}</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <span className="rounded-full bg-gold-500/15 px-3 py-1.5 text-xs font-medium text-gold-700">
          {entries.length} waiting
        </span>
      </div>

      {loading && <LoadingBlock />}

      {!loading && error && (
        <div className="mt-8 flex items-center gap-2 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
          {t("No students are currently waiting.")}
        </div>
      )}

      {!loading &&
        !error &&
        grouped.map((group) => (
          <div key={group.hostel.id} className="mt-8">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                <Building2 size={16} />
              </span>
              <h3 className="font-display text-lg font-semibold text-ink">
                {group.hostel.name}
              </h3>
              <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-ink-light">
                {group.entries.length} waiting
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mt-3 overflow-hidden rounded-card border border-line bg-white"
            >
              {group.entries.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  variants={itemVariants}
                  className={`flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between ${
                    idx !== 0 ? "border-t border-line" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-sm font-semibold text-gold-700">
                      <ListOrdered size={14} />
                    </span>
                    <div>
                      <p className="font-medium text-ink">
                        {entry.student.name}{" "}
                        <span className="text-xs font-normal text-ink-light">
                          ({entry.student.regNo})
                        </span>
                      </p>
                      <p className="flex items-center gap-1 text-xs text-ink-light">
                        <Clock size={12} />
                        Joined:{" "}
                        {new Date(entry.joinedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-ink-light">
                    {entry.student.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} /> {entry.student.phone}
                      </span>
                    )}
                    {entry.student.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail size={13} /> {entry.student.email}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
    </div>
  );
}
