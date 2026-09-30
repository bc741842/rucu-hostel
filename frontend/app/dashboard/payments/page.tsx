"use client";

import { useEffect, useState } from "react";
import { BedDouble, CheckCircle2, Clock, Loader2, Wallet } from "lucide-react";
import { api } from "../../../lib/api";

interface PaymentItem {
  id: string;
  controlNumber: string;
  amount: string;
  status: string;
  paidAt: string | null;
  booking: {
    bed: {
      number: string;
      room: {
        number: string;
        hostel: { name: string };
      };
    };
    academicYear: { name: string };
  };
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning-50 text-warning-600",
  completed: "bg-success-50 text-success-600",
  failed: "bg-danger-50 text-danger-600",
};

export default function MyPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/payments/my");
      setPayments(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load your payments. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        Payment History
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        My Payments
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        Track the status of your hostel fee payments and control numbers.
      </p>

      {loading && (
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-ink-light">
          <Loader2 size={16} className="animate-spin" /> Loading your
          payments...
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          {error}
        </div>
      )}

      {!loading && !error && payments.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
          No payments yet. Once you book a bed, a control number will appear
          here automatically.
        </div>
      )}

      {!loading && !error && payments.length > 0 && (
        <div className="mt-6 space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-card border border-line bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                    <Wallet size={18} />
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-ink">
                      {payment.controlNumber}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-light">
                      <BedDouble size={12} />
                      {payment.booking.bed.room.hostel.name} · Room{" "}
                      {payment.booking.bed.room.number} · Bed{" "}
                      {payment.booking.bed.number} ·{" "}
                      {payment.booking.academicYear.name}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    STATUS_STYLES[payment.status] ?? "bg-cream-100 text-ink-light"
                  }`}
                >
                  {payment.status === "completed" && <CheckCircle2 size={12} />}
                  {payment.status === "pending" && <Clock size={12} />}
                  {payment.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-cream p-3 text-sm">
                <div className="text-ink-light">
                  Amount:{" "}
                  <span className="font-semibold text-ink">
                    TZS {Number(payment.amount).toLocaleString()}
                  </span>
                </div>
                {payment.paidAt && (
                  <div className="text-ink-light">
                    Paid on:{" "}
                    <span className="font-semibold text-ink">
                      {new Date(payment.paidAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {payment.status === "pending" && (
                <p className="mt-3 text-xs text-ink-light">
                  Take this control number to the bank/payment channel to
                  complete payment. It will be confirmed by the university
                  accountant once received.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
