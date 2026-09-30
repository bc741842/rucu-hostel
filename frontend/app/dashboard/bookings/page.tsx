"use client";

import { useEffect, useState } from "react";
import { BedDouble, Building2, Clock, Loader2, Wallet } from "lucide-react";
import { api } from "../../../lib/api";

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
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        Booking History
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        My Bookings
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        All the bed bookings you have made, past and present.
      </p>

      {loading && (
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-ink-light">
          <Loader2 size={16} className="animate-spin" /> Loading your
          bookings...
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          {error}
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
          You haven&apos;t booked a bed yet.{" "}
          <a href="/dashboard/book" className="font-medium text-navy-900 hover:underline">
            Book one now
          </a>
          .
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
                <div className="mt-3 flex items-center gap-1.5 text-xs text-warning-600">
                  <Clock size={13} />
                  Hold expires:{" "}
                  {new Date(booking.expiresAt).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
