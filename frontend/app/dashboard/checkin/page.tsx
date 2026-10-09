"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  Loader2,
  ScanLine,
  KeyRound,
} from "lucide-react";
import { api } from "../../../lib/api";

const SCANNER_ELEMENT_ID = "qr-scanner-view";

interface CheckInResult {
  ok: boolean;
  message: string;
  detail?: string;
}

export default function CheckInPage() {
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);

  const scannerRef = useRef<any>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startScanner() {
    setCameraError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        (decodedText: string) => {
          if (!processingRef.current) {
            handleScan(decodedText);
          }
        },
        () => {
          // ignore per-frame decode misses
        },
      );
      setCameraOn(true);
    } catch (err: any) {
      setCameraError(
        "Could not access the camera. Check permissions, or use the manual code box below.",
      );
    }
  }

  async function stopScanner() {
    try {
      const scanner = scannerRef.current;
      if (scanner) {
        // html5-qrcode throws if stop() is called while it isn't actively
        // scanning (e.g. camera permission was denied) — guard with state.
        if (typeof scanner.getState === "function") {
          const state = scanner.getState();
          // 2 = SCANNING in html5-qrcode's Html5QrcodeScannerState enum.
          if (state === 2) {
            await scanner.stop();
          }
        } else {
          await scanner.stop();
        }
        await scanner.clear();
      }
    } catch {
      // ignore — the scanner may already be stopped/cleared.
    }
    scannerRef.current = null;
    setCameraOn(false);
  }

  async function handleScan(code: string) {
    processingRef.current = true;
    await submitCode(code);
    // Give staff a moment to read the result before scanning the next person.
    setTimeout(() => {
      processingRef.current = false;
    }, 2500);
  }

  async function submitCode(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/bookings/checkin/${trimmed}`);
      setResult({
        ok: true,
        message: "Checked in successfully",
        detail: `${res.data.student.name} (${res.data.student.regNo}) — ${res.data.bed.room.hostel.name}, Room ${res.data.bed.room.number}, Bed ${res.data.bed.number}`,
      });
      setManualCode("");
    } catch (err: any) {
      setResult({
        ok: false,
        message: "Check-in failed",
        detail:
          err?.response?.data?.message ||
          "That code is not valid. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    submitCode(manualCode);
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        Phase 2
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        QR Check-in
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        Scan a student's QR code at the gate, or enter their code manually.
      </p>

      <div className="mt-6 grid max-w-2xl gap-6 md:grid-cols-2">
        {/* Camera scanner */}
        <div className="rounded-card border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <ScanLine size={15} /> Camera scanner
            </p>
            {!cameraOn ? (
              <button
                onClick={startScanner}
                className="flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-navy-700"
              >
                <Camera size={13} /> Start
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="flex items-center gap-1.5 rounded-full bg-danger-50 px-3.5 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-50/70"
              >
                <CameraOff size={13} /> Stop
              </button>
            )}
          </div>

          {/*
            IMPORTANT: html5-qrcode takes full ownership of the DOM inside
            the element with id={SCANNER_ELEMENT_ID} — it injects its own
            <video>/<canvas> nodes directly, outside of React's knowledge.
            React must NEVER render children inside that same element, or
            the two will fight over the same DOM nodes (causing
            "Failed to execute 'removeChild'" errors). The placeholder text
            is therefore a separate, absolutely-positioned sibling overlay
            instead of a child of the scanner div.
          */}
          <div className="relative mt-4">
            <div
              id={SCANNER_ELEMENT_ID}
              className={`overflow-hidden rounded-lg bg-navy-900/5 ${
                cameraOn ? "min-h-[260px]" : "h-[180px]"
              }`}
            />
            {!cameraOn && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="text-center text-xs text-ink-light">
                  Camera preview appears here once started.
                </p>
              </div>
            )}
          </div>

          {cameraError && (
            <p className="mt-3 text-xs text-danger-600">{cameraError}</p>
          )}
        </div>

        {/* Manual entry */}
        <div className="rounded-card border border-line bg-white p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <KeyRound size={15} /> Enter code manually
          </p>
          <p className="mt-1 text-xs text-ink-light">
            Use this if the camera isn't available.
          </p>
          <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste or type the QR code"
              className="flex-1 rounded-lg border border-line bg-cream px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || submitting}
              className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                "Check In"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Result banner */}
      <div className="mt-6 max-w-2xl">
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.message + result.detail}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-start gap-3 rounded-card border p-4 text-sm ${
                result.ok
                  ? "border-success-600/20 bg-success-50 text-success-600"
                  : "border-danger-600/20 bg-danger-50 text-danger-600"
              }`}
            >
              {result.ok ? (
                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle size={18} className="mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold">{result.message}</p>
                {result.detail && (
                  <p className="mt-0.5 text-ink-light">{result.detail}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
