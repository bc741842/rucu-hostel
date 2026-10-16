"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Users,
  BedDouble,
  Phone,
  Mail,
  GraduationCap,
} from "lucide-react";
import { api } from "../../../lib/api";
import { LoadingBlock } from "../../../components/ui/Skeleton";

interface Roommate {
  bed: string;
  status: string;
  name: string;
  regNo: string;
  course: string;
  year: number;
  gender: string;
  phone: string | null;
  email: string | null;
}

interface RoommatesData {
  hostel: string;
  room: string;
  myBed: string;
  roommates: Roommate[];
}

export default function RoommatesPage() {
  const [data, setData] = useState<RoommatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/bookings/my/roommates");
      setData(res.data);
      setError("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not load your roommates. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        My Hostel
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        My Roommates
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        Students who share your room for this academic year.
      </p>

      <div className="mt-6 max-w-2xl">
        {loading && <LoadingBlock />}

        {!loading && error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger-600/20 bg-danger-50 p-4 text-sm text-danger-600">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3.5 py-1.5 text-xs font-medium text-gold-700">
                <BedDouble size={13} />
                {data.hostel} &middot; Room {data.room} &middot; My bed:{" "}
                {data.myBed}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-navy-50 px-3.5 py-1.5 text-xs font-medium text-navy-700">
                <Users size={13} />
                {data.roommates.length}{" "}
                {data.roommates.length === 1 ? "roommate" : "roommates"}
              </span>
            </div>

            {data.roommates.length === 0 ? (
              <div className="mt-4 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
                No one else has booked into your room yet.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.roommates.map((r, i) => (
                  <motion.div
                    key={r.regNo}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-card border border-line bg-white p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-display text-base font-semibold text-ink">
                          {r.name}
                        </p>
                        <p className="text-xs text-ink-light">{r.regNo}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-ink-light">
                        Bed {r.bed}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-ink-light">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap size={13} />
                        {r.course} &middot; Year {r.year}
                      </div>
                      {r.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={13} />
                          {r.phone}
                        </div>
                      )}
                      {r.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} />
                          {r.email}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
