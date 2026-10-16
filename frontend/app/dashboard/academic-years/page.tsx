"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { api } from "../../../lib/api";
import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import { LoadingBlock } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";

interface Year {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: string;
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function AcademicYearsPage() {
  const toast = useToast();
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", startsAt: "", endsAt: "" });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/academic-years");
      setYears(res.data);
    } catch {
      toast.error("Could not load academic years.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/academic-years", form);
      toast.success(`Academic year ${form.name} created.`);
      setForm({ name: "", startsAt: "", endsAt: "" });
      await load();
    } catch (err: any) {
      const m = err?.response?.data?.message;
      toast.error(Array.isArray(m) ? m.join(", ") : m || "Could not create.");
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-navy-900";
  const label =
    "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-ink";

  return (
    <div>
      <PageHeader
        eyebrow="Manage"
        title="Academic Years"
        description="Students can only book beds while an academic year exists. Create the current one here."
      />

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 gap-4 rounded-card border border-line bg-white p-5 sm:grid-cols-4 sm:items-end"
      >
        <div>
          <label className={label}>Name</label>
          <input
            required
            className={input}
            placeholder="2026/2027"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>Starts</label>
          <input
            required
            type="date"
            className={input}
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>Ends</label>
          <input
            required
            type="date"
            className={input}
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
          />
        </div>
        <Button type="submit" loading={saving}>
          Create year
        </Button>
      </form>

      {loading && <LoadingBlock rows={2} />}

      {!loading && years.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={<CalendarDays size={22} />}
            title="No academic year yet"
            description="Create one above so students can start booking beds."
          />
        </div>
      )}

      {!loading && years.length > 0 && (
        <div className="mt-6 space-y-3">
          {years.map((y) => (
            <div
              key={y.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white p-5"
            >
              <div>
                <p className="font-display text-lg font-semibold text-ink">
                  {y.name}
                </p>
                <p className="text-sm text-ink-light">
                  {fmt(y.startsAt)} – {fmt(y.endsAt)}
                </p>
              </div>
              <Badge status={y.status === "active" ? "Paid" : "Expired"} label={y.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
