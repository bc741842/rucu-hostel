"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertCircle,
  CheckCircle2,
  QrCode as QrCodeIcon,
  BedDouble,
} from "lucide-react";
import { api } from "../../../lib/api";
import { LoadingBlock } from "../../../components/ui/Skeleton";
import { useLang } from "../../../lib/i18n";

interface MyQrCode {
  qrCode: string;
  bookingId: string;
  status: string;
  checkedInAt: string | null;
  hostel: string;
  room: string;
  bed: string;
}

export default function QrCodePage() {
  const { t } = useLang();
  const [data, setData] = useState<MyQrCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/bookings/my/qr-code");
      setData(res.data);
      setError("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not load your check-in QR code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const alreadyCheckedIn = data?.status === "CheckedIn";

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        {t("Check-in")}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        {t("My Check-in QR Code")}
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        {t("Show this code to the warden or admin at the hostel gate to check in.")}
      </p>

      <div className="mt-6 max-w-sm">
        {loading && <LoadingBlock />}

        {!loading && error && (
          <div className="flex items-center gap-2 rounded-lg border border-danger-600/20 bg-danger-50 p-4 text-sm text-danger-600">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && data && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-card border border-line bg-white p-6 text-center"
          >
            {alreadyCheckedIn ? (
              <div className="flex flex-col items-center gap-3 py-6">
                <CheckCircle2 size={40} className="text-success-600" />
                <p className="font-display text-lg font-semibold text-ink">
                  {t("You're already checked in")}
                </p>
                {data.checkedInAt && (
                  <p className="text-xs text-ink-light">
                    Checked in on{" "}
                    {new Date(data.checkedInAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-gold-700">
                  <QrCodeIcon size={13} /> {t("Scan at the hostel gate")}
                </div>
                <div className="mt-4 flex items-center justify-center rounded-lg bg-white p-4 keep-white">
                  <QRCodeSVG value={data.qrCode} size={220} />
                </div>
                <p className="mt-4 text-xs text-ink-light">
                  {t("If the camera cannot scan, give the warden this code:")}
                </p>
                <p className="mt-1 break-all rounded-lg bg-cream px-3 py-2 font-mono text-xs text-ink select-all">
                  {data.qrCode}
                </p>
                <button
                  onClick={() => navigator.clipboard?.writeText(data.qrCode)}
                  className="mt-2 text-xs font-semibold text-navy-700 hover:underline"
                >
                  {t("Copy code")}
                </button>
              </>
            )}

            <div className="mt-5 flex items-center justify-center gap-1.5 text-sm text-ink-light">
              <BedDouble size={14} />
              {data.hostel} &middot; Room {data.room} &middot; Bed {data.bed}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
