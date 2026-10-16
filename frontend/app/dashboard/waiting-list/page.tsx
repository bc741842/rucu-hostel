"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Clock,
  Loader2,
  LogOut,
  AlertCircle,
  Hourglass,
} from "lucide-react";
import { api } from "../../../lib/api";
import { LoadingBlock } from "../../../components/ui/Skeleton";

interface Hostel {
  id: string;
  name: string;
  genderAllowed: string;
  location: string | null;
}

interface AcademicYear {
  id: string;
  name: string;
}

interface WaitingEntry {
  id: string;
  status: string;
  joinedAt: string;
  hostel: Hostel;
  academicYear: AcademicYear;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    waiting: "bg-gold-500/15 text-gold-700",
    notified: "bg-navy-50 text-navy-700",
    booked: "bg-success-50 text-success-600",
    cancelled: "bg-danger-50 text-danger-600",
  };
  return map[status] || "bg-cream text-ink-light";
}

const statusLabel: Record<string, string> = {
  waiting: "Waiting",
  notified: "Notified",
  booked: "Bed Secured",
  cancelled: "Cancelled",
};

export default function WaitingListPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [myEntries, setMyEntries] = useState<WaitingEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");

  const [leavingId, setLeavingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [hostelsRes, yearsRes, myRes] = await Promise.all([
        api.get("/hostels"),
        api.get("/academic-years"),
        api.get("/waiting-list/my"),
      ]);
      setHostels(hostelsRes.data);
      if (yearsRes.data?.length > 0) {
        setAcademicYear(yearsRes.data[0]);
      }
      setMyEntries(myRes.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function joinWaitingList() {
    if (!selectedHostelId || !academicYear) return;
    setJoining(true);
    setJoinError("");
    setJoinSuccess("");
    try {
      const res = await api.post("/waiting-list", {
        hostelId: selectedHostelId,
        academicYearId: academicYear.id,
      });
      setMyEntries((prev) => [res.data, ...prev]);
      setJoinSuccess("You have successfully joined the waiting list.");
      setSelectedHostelId("");
    } catch (err: any) {
      setJoinError(
        err?.response?.data?.message ||
          "Failed to join the waiting list. Please try again.",
      );
    } finally {
      setJoining(false);
    }
  }

  async function leaveWaitingList(id: string) {
    setLeavingId(id);
    try {
      await api.patch(`/waiting-list/${id}/leave`);
      setMyEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: "cancelled" } : e)),
      );
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to leave the waiting list. Please try again.",
      );
    } finally {
      setLeavingId(null);
    }
  }

  const activeHostelIds = new Set(
    myEntries.filter((e) => e.status === "waiting").map((e) => e.hostel.id),
  );
  const availableHostels = hostels.filter((h) => !activeHostelIds.has(h.id));

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        {academicYear ? academicYear.name : "Academic Year"}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        Bed Waiting List
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        If your preferred hostel has no free beds right now, join the waiting
        list. We&apos;ll notify you as soon as a bed becomes available.
      </p>

      {loading && <LoadingBlock />}

      {!loading && error && (
        <div className="mt-8 flex items-center gap-2 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Join form */}
          <div className="mt-6 rounded-card border border-line bg-white p-5">
            <h3 className="font-display text-base font-semibold text-ink">
              Join a Waiting List
            </h3>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedHostelId}
                onChange={(e) => setSelectedHostelId(e.target.value)}
                className="flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
              >
                <option value="">-- Select Hostel --</option>
                {availableHostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.genderAllowed})
                  </option>
                ))}
              </select>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={joinWaitingList}
                disabled={!selectedHostelId || joining}
                className="flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
              >
                {joining && <Loader2 size={16} className="animate-spin" />}
                Join Waiting List
              </motion.button>
            </div>

            {availableHostels.length === 0 && hostels.length > 0 && (
              <p className="mt-3 text-xs text-ink-light">
                You are already on the waiting list for every available hostel.
              </p>
            )}

            {joinError && (
              <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                {joinError}
              </p>
            )}
            {joinSuccess && (
              <p className="mt-3 rounded-lg bg-success-50 px-3 py-2 text-sm text-success-600">
                {joinSuccess}
              </p>
            )}
          </div>

          {/* My entries */}
          <h3 className="mt-8 font-display text-base font-semibold text-ink">
            My Waiting List Entries
          </h3>

          {myEntries.length === 0 ? (
            <div className="mt-4 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
              You haven&apos;t joined any waiting list yet.
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence>
                {myEntries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    variants={itemVariants}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-col rounded-card border border-line bg-white p-5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                        <Building2 size={18} />
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge(
                          entry.status,
                        )}`}
                      >
                        {statusLabel[entry.status] || entry.status}
                      </span>
                    </div>
                    <p className="mt-3 font-display text-base font-semibold text-ink">
                      {entry.hostel.name}
                    </p>
                    <p className="text-xs text-ink-light">
                      {entry.academicYear.name}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-light">
                      <Clock size={13} />
                      Joined: {new Date(entry.joinedAt).toLocaleDateString()}
                    </p>

                    {entry.status === "waiting" && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => leaveWaitingList(entry.id)}
                        disabled={leavingId === entry.id}
                        className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-danger-600/30 py-2 text-sm font-semibold text-danger-600 transition-colors hover:bg-danger-50 disabled:opacity-60"
                      >
                        {leavingId === entry.id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <LogOut size={15} />
                        )}
                        Leave Waiting List
                      </motion.button>
                    )}

                    {entry.status === "notified" && (
                      <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-navy-50 px-3 py-2 text-xs font-medium text-navy-700">
                        <Hourglass size={13} />
                        A bed is becoming available — please check back soon.
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
