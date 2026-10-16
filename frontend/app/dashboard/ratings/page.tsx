"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Loader2, AlertCircle, CheckCircle2, Send } from "lucide-react";
import { api } from "../../../lib/api";
import { LoadingBlock } from "../../../components/ui/Skeleton";

interface MyRating {
  rating: number;
  comment: string | null;
  hostel: { name: string };
  updatedAt: string;
}

export default function RatingsPage() {
  const [existing, setExisting] = useState<MyRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/ratings/my");
      if (res.data) {
        setExisting(res.data);
        setRating(res.data.rating);
        setComment(res.data.comment || "");
      }
      setError("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Could not load your rating.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (rating < 1) return;
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    try {
      const res = await api.post("/ratings", {
        rating,
        comment: comment.trim() || undefined,
      });
      setExisting(res.data);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || "Could not submit your rating.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        Feedback
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        Rate Your Hostel
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        Tell us how your stay has been. You can update this anytime.
      </p>

      <div className="mt-6 max-w-md">
        {loading && <LoadingBlock />}

        {!loading && error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger-600/20 bg-danger-50 p-4 text-sm text-danger-600">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-card border border-line bg-white p-6"
          >
            {existing && (
              <p className="mb-4 text-xs text-ink-light">
                Your current rating for{" "}
                <span className="font-medium text-ink">
                  {existing.hostel.name}
                </span>{" "}
                &middot; last updated{" "}
                {new Date(existing.updatedAt).toLocaleDateString()}
              </p>
            )}

            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={
                      n <= (hoverRating || rating)
                        ? "fill-gold-500 text-gold-500"
                        : "fill-transparent text-line"
                    }
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Anything you'd like to share? (optional)"
              className="mt-4 w-full resize-none rounded-lg border border-line bg-cream px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
            />

            {submitError && (
              <p className="mt-3 text-xs text-danger-600">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-success-600">
                <CheckCircle2 size={13} /> Thank you for your feedback!
              </p>
            )}

            <button
              onClick={submit}
              disabled={rating < 1 || submitting}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {existing ? "Update rating" : "Submit rating"}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
