"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Loader2, AlertCircle, MessageSquare } from "lucide-react";
import { api } from "../../../lib/api";

interface Hostel {
  id: string;
  name: string;
}

interface Summary {
  hostelId: string;
  hostel: string;
  average: number;
  count: number;
}

interface RatingRow {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  student: { name: string; regNo: string };
  hostel: { id: string; name: string };
}

export default function RatingsSummaryPage() {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [hostelFilter, setHostelFilter] = useState("");

  const [summary, setSummary] = useState<Summary[]>([]);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/hostels").then((res) => setHostels(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostelFilter]);

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (hostelFilter) params.hostelId = hostelFilter;
      const res = await api.get("/ratings/admin", { params });
      setSummary(res.data.summary);
      setRatings(res.data.ratings);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not load ratings.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        Phase 3
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        Hostel Ratings
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        What students think of their hostels.
      </p>

      <div className="mt-5">
        <select
          value={hostelFilter}
          onChange={(e) => setHostelFilter(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
        >
          <option value="">All hostels</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="mt-6 flex items-center gap-2 rounded-card border border-line bg-white p-8 text-sm text-ink-light">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-danger-600/20 bg-danger-50 p-4 text-sm text-danger-600">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 max-w-3xl space-y-6">
          {/* Average per hostel */}
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.length === 0 ? (
              <p className="text-sm text-ink-light">
                No ratings submitted yet.
              </p>
            ) : (
              summary.map((s, i) => (
                <motion.div
                  key={s.hostelId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-card border border-line bg-white p-4"
                >
                  <p className="text-sm font-semibold text-ink">
                    {s.hostel}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={16}
                          className={
                            n <= Math.round(s.average)
                              ? "fill-gold-500 text-gold-500"
                              : "fill-transparent text-line"
                          }
                        />
                      ))}
                    </div>
                    <span className="font-display text-lg font-semibold text-ink">
                      {s.average}
                    </span>
                    <span className="text-xs text-ink-light">
                      ({s.count} {s.count === 1 ? "rating" : "ratings"})
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Recent comments */}
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <MessageSquare size={15} /> Recent feedback
            </p>
            {ratings.filter((r) => r.comment).length === 0 ? (
              <p className="mt-3 text-sm text-ink-light">
                No written feedback yet.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {ratings
                  .filter((r) => r.comment)
                  .map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-card border border-line bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-navy-700">
                          {r.student.name} ({r.student.regNo}) &middot;{" "}
                          {r.hostel.name}
                        </p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={12}
                              className={
                                n <= r.rating
                                  ? "fill-gold-500 text-gold-500"
                                  : "fill-transparent text-line"
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1.5 text-sm text-ink">{r.comment}</p>
                      <p className="mt-1 text-[11px] text-ink-light">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
