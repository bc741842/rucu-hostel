"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BedDouble, Building2, Clock, Loader2, Wallet, X } from "lucide-react";
import { api } from "../../../lib/api";
import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import { CardSkeleton } from "../../../components/ui/Skeleton";
import Button from "../../../components/ui/Button";
import { useLang } from "../../../lib/i18n";

interface BookingItem {
  id: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  bed: {
    number: string;
    room: {
      number: string;
      floor: number | null;
      hostel: { name: string };
    };
  };
  academicYear: { name: string };
  payment: {
    controlNumber: string;
    amount: string;
    status: string;
  } | null;
}

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-warning-50 text-warning-600",
  Paid: "bg-success-50 text-success-600",
  Confirmed: "bg-navy-50 text-navy-700",
  CheckedIn: "bg-navy-50 text-navy-700",
  Completed: "bg-success-50 text-success-600",
  Expired: "bg-cream-100 text-ink-light",
  Cancelled: "bg-danger-50 text-danger-600",
  Refunded: "bg-cream-100 text-ink-light",
};

export default function MyBookingsPage() {
  const { t } = useLang();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancelTarget, setCancelTarget] = useState<BookingItem | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/bookings/my");
      setBookings(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load your bookings. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await api.patch(`/bookings/${cancelTarget.id}/cancel`);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancelTarget.id ? { ...b, status: "Cancelled" } : b,
        ),
      );
      setCancelTarget(null);
    } catch (err: any) {
      setCancelError(
        err?.response?.data?.message || "Failed to cancel booking.",
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("Booking History")}
        title={t("My Bookings")}
        description={t("All the bed bookings you have made, past and present.")}
      />

      {loading && (
        <div className="mt-6 space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          <span>{error}</span>
          <Button variant="secondary" onClick={load}>
            {t("Try again")}
          </Button>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={<BedDouble size={22} />}
            title={t("No bookings yet")}
            description={t("When you book a bed it will appear here with its payment status.")}
            action={
              <a
                href="/dashboard/book"
                className="inline-flex rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-700"
              >
                {t("Book a bed")}
              </a>
            }
          />
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="mt-6 space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-card border border-line bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                    <BedDouble size={18} />
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-ink">
                      {booking.bed.room.hostel.name} · Room{" "}
                      {booking.bed.room.number} · Bed {booking.bed.number}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-light">
                      <Building2 size={12} />
                      {booking.academicYear.name}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    STATUS_STYLES[booking.status] ?? "bg-cream-100 text-ink-light"
                  }`}
                >
                  {booking.status}
                </span>
              </div>

              {booking.payment && (
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-cream p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-navy-700" />
                    <span className="text-ink-light">Control No.</span>
                    <span className="font-semibold text-ink">
                      {booking.payment.controlNumber}
                    </span>
                  </div>
                  <div className="text-ink-light">
                    Amount:{" "}
                    <span className="font-semibold text-ink">
                      TZS {Number(booking.payment.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {booking.status === "Pending" && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-warning-600">
                    <Clock size={13} />
                    Hold expires:{" "}
                    {new Date(booking.expiresAt).toLocaleString()}
                  </div>
                  <button
                    onClick={() => setCancelTarget(booking)}
                    className="rounded-lg border border-danger-600/30 px-3 py-1.5 text-xs font-semibold text-danger-600 transition-colors hover:bg-danger-50"
                  >
                    {t("Cancel Booking")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cancel confirm modal */}
      <AnimatePresence>
        {cancelTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4"
            onClick={() => !cancelling && setCancelTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-card border border-line bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-ink">
                  {t("Cancel this booking?")}
                </h3>
                <button
                  onClick={() => !cancelling && setCancelTarget(null)}
                  className="text-ink-light hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-3 text-sm text-ink-light">
                {cancelTarget.bed.room.hostel.name} · Room{" "}
                {cancelTarget.bed.room.number} · Bed {cancelTarget.bed.number}{" "}
                will be released immediately and made available to other
                students. This cannot be undone.
              </p>

              {cancelError && (
                <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                  {cancelError}
                </p>
              )}

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setCancelTarget(null)}
                  disabled={cancelling}
                  className="flex-1 rounded-lg border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-cream"
                >
                  {t("Keep Booking")}
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={confirmCancel}
                  disabled={cancelling}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger-600/90 disabled:opacity-60"
                >
                  {cancelling && <Loader2 size={16} className="animate-spin" />}
                  Yes, Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
