"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IdCard,
  Lock,
  User,
  GraduationCap,
  Phone,
  Mail,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import ThemeToggle from "../../components/ThemeToggle";
import { useLang } from "../../lib/i18n";

export default function RegisterPage() {
  const { t } = useLang();
  const { registerStudent } = useAuth();
  const [form, setForm] = useState({
    regNo: "",
    name: "",
    gender: "male",
    course: "",
    year: "1",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await registerStudent({
        regNo: form.regNo,
        name: form.name,
        gender: form.gender,
        course: form.course,
        year: Number(form.year),
        phone: form.phone || undefined,
        email: form.email || undefined,
        password: form.password,
      });
    } catch (err: any) {
      const messages = err?.response?.data?.message;
      setError(
        Array.isArray(messages)
          ? messages.join(", ")
          : messages || t("Registration failed. Please check your details."),
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
        <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher onDark />
            <ThemeToggle onDark />
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
          {t("Create your account")}
        </h1>
        <p className="mt-3 max-w-sm text-center text-sm text-ink-light">
          {t("Register with your student details to start booking a hostel bed.")}
        </p>

        <div className="mt-10 w-full max-w-lg rounded-card border border-line bg-white p-8 shadow-[0_1px_3px_rgba(20,40,75,0.08),0_8px_24px_rgba(20,40,75,0.06)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label={t("Registration Number (RegNo)")}
                icon={IdCard}
                value={form.regNo}
                onChange={(v) => update("regNo", v)}
                placeholder="RUCU/2026/001"
                required
              />
              <Field
                label={t("Full Name")}
                icon={User}
                value={form.name}
                onChange={(v) => update("name", v)}
                placeholder="Jina Lako"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                  {t("Gender")}
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                >
                  <option value="male">{t("Male")}</option>
                  <option value="female">{t("Female")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink">
                  {t("Year of Study")}
                </label>
                <select
                  value={form.year}
                  onChange={(e) => update("year", e.target.value)}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900"
                >
                  {[1, 2, 3, 4, 5].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Field
              label={t("Course")}
              icon={GraduationCap}
              value={form.course}
              onChange={(v) => update("course", v)}
              placeholder="BSc Computer Science"
              required
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label={t("Phone (optional)")}
                icon={Phone}
                value={form.phone}
                onChange={(v) => update("phone", v)}
                placeholder="0712345678"
              />
              <Field
                label={t("Email (optional)")}
                icon={Mail}
                value={form.email}
                onChange={(v) => update("email", v)}
                placeholder="you@example.com"
                type="email"
              />
            </div>

            <Field
              label={t("Password")}
              icon={Lock}
              value={form.password}
              onChange={(v) => update("password", v)}
              placeholder="••••••••"
              type="password"
              required
              minLength={8}
            />

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
              Create Account
            </button>
          </form>

          <div className="mt-6 border-t border-line pt-5 text-center text-sm">
            <p className="text-ink-light">
              Already have an account?{" "}
              <a
                href="/login"
                className="font-medium text-navy-900 hover:underline"
              >
                {t("Log in")}
              </a>
            </p>
          </div>
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
  required = false,
  minLength,
}: {
  label: string;
  icon: any;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  minLength?: number;
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
          required={required}
          minLength={minLength}
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
