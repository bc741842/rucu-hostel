"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, IdCard, Loader2 } from "lucide-react";
import { useAuth } from "../../lib/auth-context";

type Mode = "student" | "admin";

export default function LoginPage() {
  const { loginStudent, loginAdmin } = useAuth();
  const [mode, setMode] = useState<Mode>("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "student") {
        await loginStudent(identifier, password);
      } else {
        await loginAdmin(identifier, password);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Invalid RegNo/username or password.",
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
              Ruaha Catholic University
            </p>
            <p className="font-display text-lg font-semibold text-white">
              Hostel Booking System
            </p>
          </div>
        </div>
      </header>
      {/* Gold line */}
      <div className="h-[3px] w-full bg-gold-500" />

      {/* Content */}
      <main className="mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-navy-700">
          RUCU Hostel Portal
        </p>
        <h1 className="mt-2 text-center font-display text-4xl font-semibold text-ink">
          Log in to continue
        </h1>
        <p className="mt-3 max-w-sm text-center text-sm text-ink-light">
          For students and staff.
        </p>

        <div className="mt-10 w-full max-w-md rounded-card border border-line bg-white p-8 shadow-[0_1px_3px_rgba(20,40,75,0.08),0_8px_24px_rgba(20,40,75,0.06)]">
          {/* Toggle mode */}
          <div className="mb-6 flex rounded-full border border-line bg-cream p-1">
            {(["student", "admin"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`relative flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
                  mode === m ? "text-white" : "text-ink-light"
                }`}
              >
                {mode === m && (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-full bg-navy-900"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">
                  {m === "student" ? "Student" : "Administrator"}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                {mode === "student" ? "Registration Number (RegNo)" : "Username"}
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 transition-colors focus-within:border-navy-900">
                <IdCard size={16} className="text-ink-light" />
                <input
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={mode === "student" ? "RUCU/2026/001" : "admin1"}
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-light/50"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                Password
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 transition-colors focus-within:border-navy-900">
                <Lock size={16} className="text-ink-light" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-light/50"
                />
              </div>
              {mode === "student" && (
                <p className="mt-1.5 text-xs text-ink-light">
                  Use the password you set when registering.
                </p>
              )}
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
            {mode === "student" ? (
              <p className="text-ink-light">
                Don&apos;t have an account?{" "}
                <a
                  href="/register"
                  className="font-medium text-navy-900 hover:underline"
                >
                  Sign up
                </a>
              </p>
            ) : (
              <p className="text-ink-light">
                Trouble logging in?{" "}
                <span className="font-medium text-navy-900">
                  Contact the system administrator
                </span>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
