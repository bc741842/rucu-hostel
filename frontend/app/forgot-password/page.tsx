"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  IdCard,
  KeyRound,
  Lock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { api } from "../../lib/api";
import { useLang } from "../../lib/i18n";

type Step = "request" | "verify" | "reset" | "done";

export default function ForgotPasswordPage() {
  const { t } = useLang();
  const [step, setStep] = useState<Step>("request");
  const [regNo, setRegNo] = useState("");
  const [otpSession, setOtpSession] = useState("");
  const [maskedContact, setMaskedContact] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/forgot-password", { regNo });
      setOtpSession(res.data.otpSession);
      setMaskedContact(res.data.maskedContact);
      setStep("verify");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not find that Reg. No. Please check and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/verify-otp", { otpSession, otp });
      setResetToken(res.data.resetToken);
      setStep("reset");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Incorrect or expired OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { resetToken, newPassword });
      setStep("done");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to reset password. Please start again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const stepTitles: Record<Step, string> = {
    request: "Enter your Reg. No. and we'll send a one-time code.",
    verify: `Enter the 6-digit code sent to ${maskedContact || "your contact"}.`,
    reset: "Choose a new password for your account.",
    done: "Your password has been reset.",
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy-900">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-gold-500 text-gold-500">
            <span className="font-display text-lg font-bold">RC</span>
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-100/70">
              {t("Ruaha Catholic University")}
            </p>
            <p className="font-display text-lg font-semibold text-white">
              {t("Hostel Booking System")}
            </p>
          </div>
        </div>
      </header>
      <div className="h-[3px] w-full bg-gold-500" />

      <main className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy-700">
          {t("RUCU Hostel Portal")}
        </p>
        <h1 className="mt-2 text-center font-display text-4xl font-semibold text-ink">
          {t("Reset your password")}
        </h1>
        <p className="mt-3 max-w-sm text-center text-sm text-ink-light">
          {stepTitles[step]}
        </p>

        <div className="mt-10 w-full max-w-md rounded-card border border-line bg-white p-8 shadow-[0_1px_3px_rgba(20,40,75,0.08),0_8px_24px_rgba(20,40,75,0.06)]">
          <AnimatePresence mode="wait">
            {step === "request" && (
              <motion.form
                key="request"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleRequestOtp}
                className="space-y-5"
              >
                <Field
                  label={t("Registration Number (RegNo)")}
                  icon={IdCard}
                  value={regNo}
                  onChange={setRegNo}
                  placeholder="RUCU/2026/001"
                />
                {error && (
                  <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Send OTP
                </button>
              </motion.form>
            )}

            {step === "verify" && (
              <motion.form
                key="verify"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >
                <Field
                  label={t("6-digit OTP")}
                  icon={KeyRound}
                  value={otp}
                  onChange={setOtp}
                  placeholder="123456"
                />
                {error && (
                  <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Verify Code
                </button>
                <button
                  type="button"
                  onClick={() => setStep("request")}
                  className="w-full text-center text-xs font-medium text-ink-light hover:text-navy-900"
                >
                  {t("Use a different Reg. No.")}
                </button>
              </motion.form>
            )}

            {step === "reset" && (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleReset}
                className="space-y-5"
              >
                <Field
                  label={t("New Password")}
                  icon={Lock}
                  value={newPassword}
                  onChange={setNewPassword}
                  placeholder="••••••••"
                  type="password"
                />
                <Field
                  label={t("Confirm New Password")}
                  icon={Lock}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                  type="password"
                />
                {error && (
                  <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Reset Password
                </button>
              </motion.form>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-4 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <CheckCircle2 size={44} className="text-success-600" />
                </motion.div>
                <p className="mt-4 text-sm text-ink-light">
                  {t("Your password has been changed successfully.")}
                </p>
                <a
                  href="/login"
                  className="mt-5 w-full rounded-lg bg-navy-900 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-navy-700"
                >
                  Go to Log in
                </a>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== "done" && (
            <div className="mt-6 border-t border-line pt-5 text-center text-sm">
              <p className="text-ink-light">
                Remembered your password?{" "}
                <a href="/login" className="font-medium text-navy-900 hover:underline">
                  {t("Log in")}
                </a>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  icon: any;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 transition-colors focus-within:border-navy-900">
        <Icon size={16} className="text-ink-light" />
        <input
          required
          type={isPassword ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-light/50"
          {...(isPassword
            ? {
                autoComplete: "new-password",
                "data-gramm": "false",
                "data-gramm_editor": "false",
                "data-enable-grammarly": "false",
              }
            : {})}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="text-ink-light transition-colors hover:text-ink"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
