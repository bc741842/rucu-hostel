"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  CheckCircle2,
  Loader2,
  User,
  Wallet,
  X,
} from "lucide-react";
import { api } from "../../../lib/api";
import { LoadingBlock } from "../../../components/ui/Skeleton";
import { useTable } from "../../../components/ui/useTable";
import SearchInput from "../../../components/ui/SearchInput";
import Pagination from "../../../components/ui/Pagination";
import Button from "../../../components/ui/Button";
import { downloadCsv } from "../../../lib/csv";
import { useLang } from "../../../lib/i18n";

interface PaymentRow {
  id: string;
  controlNumber: string;
  amount: string;
  status: string;
  booking: {
    student: { regNo: string; name: string };
    bed: {
      number: string;
      room: { number: string; hostel: { name: string } };
    };
    academicYear: { name: string };
  };
}

export default function ConfirmPaymentsPage() {
  const { t } = useLang();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const table = useTable(
    payments,
    (p) =>
      `${p.controlNumber} ${p.booking.student.name} ${p.booking.student.regNo} ${p.booking.bed.room.hostel.name} ${p.booking.bed.room.number} ${p.booking.bed.number}`,
  );

  function exportCsv() {
    downloadCsv("pending-payments.csv", [
      ["Control No.", "Student", "RegNo", "Hostel", "Room", "Bed", "Amount (TZS)"],
      ...table.filtered.map((p) => [
        p.controlNumber,
        p.booking.student.name,
        p.booking.student.regNo,
        p.booking.bed.room.hostel.name,
        p.booking.bed.room.number,
        p.booking.bed.number,
        Number(p.amount),
      ]),
    ]);
  }

  const [confirmTarget, setConfirmTarget] = useState<PaymentRow | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/payments", { params: { status: "pending" } });
      setPayments(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load pending payments.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!confirmTarget) return;
    setConfirming(true);
    setConfirmError("");
    try {
      await api.patch(`/payments/${confirmTarget.id}/confirm`);
      setPayments((prev) => prev.filter((p) => p.id !== confirmTarget.id));
      setConfirmTarget(null);
    } catch (err: any) {
      setConfirmError(
        err?.response?.data?.message || "Failed to confirm payment.",
      );
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        {t("Accounts")}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        {t("Confirm Payments")}
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        Review control numbers received at the bank, then confirm them here
        to release the student&apos;s booking.
      </p>

      {loading && <LoadingBlock />}

      {!loading && error && (
        <div className="mt-8 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          {error}
        </div>
      )}

      {!loading && !error && payments.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
          {t("No pending payments right now.")}
        </div>
      )}

      {!loading && !error && payments.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <SearchInput
            value={table.query}
            onChange={table.setQuery}
            placeholder="Search student, control number..."
          />
          <Button variant="secondary" onClick={exportCsv}>
            {t("Export CSV")}
          </Button>
        </div>
      )}

      {!loading && !error && payments.length > 0 && table.filtered.length === 0 && (
        <div className="mt-4 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
          {t("No results match your search.")}
        </div>
      )}

      {!loading && !error && table.filtered.length > 0 && (
        <div className="mt-4 overflow-hidden rounded-card border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-cream">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-light">
                  {t("Control No.")}
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-light">
                  {t("Student")}
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-light">
                  {t("Bed")}
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-light">
                  {t("Amount")}
                </th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-ink-light">
                  {t("Action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {table.pageRows.map((payment) => (
                <tr key={payment.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">
                    {payment.controlNumber}
                  </td>
                  <td className="px-5 py-3 text-ink">
                    <div className="flex items-center gap-1.5">
                      <User size={13} className="text-ink-light" />
                      {payment.booking.student.name} (
                      {payment.booking.student.regNo})
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-light">
                    {payment.booking.bed.room.hostel.name} · Room{" "}
                    {payment.booking.bed.room.number} · Bed{" "}
                    {payment.booking.bed.number}
                  </td>
                  <td className="px-5 py-3 font-semibold text-navy-900">
                    TZS {Number(payment.amount).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setConfirmTarget(payment)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-700"
                    >
                      <BadgeCheck size={13} />
                      {t("Confirm")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4"
            onClick={() => !confirming && setConfirmTarget(null)}
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
                  {t("Confirm Payment")}
                </h3>
                <button
                  onClick={() => !confirming && setConfirmTarget(null)}
                  className="text-ink-light hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-2 rounded-lg bg-cream p-4 text-sm">
                <Row label={t("Control No.")} value={confirmTarget.controlNumber} emphasize />
                <Row
                  label={t("Student")}
                  value={`${confirmTarget.booking.student.name} (${confirmTarget.booking.student.regNo})`}
                />
                <Row
                  label={t("Amount")}
                  value={`TZS ${Number(confirmTarget.amount).toLocaleString()}`}
                />
              </div>

              <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-light">
                <Wallet size={13} className="mt-0.5 shrink-0" />
                {t("Only confirm after verifying this control number was actually paid at the bank/payment channel.")}
              </p>

              {confirmError && (
                <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                  {confirmError}
                </p>
              )}

              <button
                onClick={confirm}
                disabled={confirming}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
              >
                {confirming ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                Yes, Confirm Payment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-ink-light">{label}</span>
      <span
        className={
          emphasize
            ? "font-display text-base font-semibold text-navy-900"
            : "text-right font-medium text-ink"
        }
      >
        {value}
      </span>
    </div>
  );
}
