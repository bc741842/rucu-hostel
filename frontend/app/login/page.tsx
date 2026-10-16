"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, IdCard, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { useLang } from "../../lib/i18n";

export default function LoginPage() {
  const { t } = useLang();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || t("Invalid Reg. No./username or password."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
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
        <div className="ml-auto">
            <LanguageSwitcher onDark />
          </div>
        </div>
      </header>
      <div className="h-[3px] w-full bg-gold-500" />

      {/* Content */}
      <main className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy-700">
          {t("RUCU Hostel Portal")}
        </p>
        <h1 className="mt-2 text-center font-display text-4xl font-semibold text-ink">
          {t("Log in to continue")}
        </h1>
        <p className="mt-3 max-w-sm text-center text-sm text-ink-light">
          {t("Students, wardens, and staff all sign in here.")}
        </p>

        <div className="mt-10 w-full max-w-md rounded-card border border-line bg-white p-8 shadow-[0_1px_3px_rgba(20,40,75,0.08),0_8px_24px_rgba(20,40,75,0.06)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                {t("Registration Number or Username")}
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 transition-colors focus-within:border-navy-900">
                <IdCard size={16} className="text-ink-light" />
                <input
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="RUCU/2026/001 or admin1"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-light/50"
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                {t("Password")}
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 transition-colors focus-within:border-navy-900">
                <Lock size={16} className="text-ink-light" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-light/50"
                  autoComplete="current-password"
                  data-gramm="false"
                  data-gramm_editor="false"
                  data-enable-grammarly="false"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-ink-light transition-colors hover:text-ink"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="mt-1.5 flex justify-end">
                <a
                  href="/forgot-password"
                  className="text-xs font-medium text-navy-900 hover:underline"
                >
                  {t("Forgot password?")}
                </a>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Log in
            </button>
          </form>

          <div className="mt-6 border-t border-line pt-5 text-center text-sm">
            <p className="text-ink-light">
              New student?{" "}
              <a
                href="/register"
                className="font-medium text-navy-900 hover:underline"
              >
                {t("Create an account")}
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
