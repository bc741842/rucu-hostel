"use client";

import { FormEvent, useState } from "react";
import { api } from "../../../lib/api";
import { useLang } from "../../../lib/i18n";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import { useToast } from "../../../components/ui/Toast";

export default function ChangePasswordPage() {
  const { t } = useLang();
  const toast = useToast();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.next.length < 8) {
      toast.error(t("The new password must be at least 8 characters."));
      return;
    }
    if (form.next !== form.confirm) {
      toast.error(t("The two new passwords do not match."));
      return;
    }
    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: form.current,
        newPassword: form.next,
      });
      toast.success(t("Password changed successfully."));
      setForm({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      const m = err?.response?.data?.message;
      toast.error(Array.isArray(m) ? m.join(", ") : m || t("Could not change the password."));
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900";
  const label = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink";

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Change Password"
        description="Use your current (or temporary) password to set a new one."
      />
      <form onSubmit={submit} className="mt-6 max-w-sm space-y-4 rounded-card border border-line bg-white p-5">
        <div>
          <label className={label}>{t("Current password")}</label>
          <input type="password" required autoComplete="current-password" className={input} value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
        </div>
        <div>
          <label className={label}>{t("New password")}</label>
          <input type="password" required minLength={8} autoComplete="new-password" className={input} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
        </div>
        <div>
          <label className={label}>{t("Confirm new password")}</label>
          <input type="password" required minLength={8} autoComplete="new-password" className={input} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </div>
        <Button type="submit" loading={saving} className="w-full">
          {t("Change password")}
        </Button>
      </form>
    </div>
  );
}
