"use client";

import { FormEvent, useState } from "react";
import { Copy, KeyRound, Search, ShieldCheck } from "lucide-react";
import { api } from "../../../lib/api";
import { useLang } from "../../../lib/i18n";
import PageHeader from "../../../components/ui/PageHeader";
import EmptyState from "../../../components/ui/EmptyState";
import Button from "../../../components/ui/Button";
import { LoadingBlock } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";

interface Student {
  id: string;
  regNo: string;
  name: string;
  course: string;
  year: number;
  phone: string | null;
  email: string | null;
}

interface Issued {
  regNo: string;
  name: string;
  temporaryPassword: string;
}

export default function StudentsPage() {
  const { t } = useLang();
  const toast = useToast();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Student[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [issued, setIssued] = useState<Issued | null>(null);

  async function search(e: FormEvent) {
    e.preventDefault();
    if (term.trim().length < 2) {
      toast.error(t("Type at least 2 characters."));
      return;
    }
    setSearching(true);
    try {
      const res = await api.get("/students", { params: { search: term.trim() } });
      setResults(res.data);
    } catch {
      toast.error(t("Could not search students."));
    } finally {
      setSearching(false);
    }
  }

  async function reset(s: Student) {
    if (
      !window.confirm(
        `${t("Set a new temporary password for")} ${s.name} (${s.regNo})? ${t("Their old password will stop working.")}`,
      )
    )
      return;
    setBusyId(s.id);
    try {
      const res = await api.post(`/students/${s.id}/reset-password`);
      setIssued(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("Could not reset the password."));
    } finally {
      setBusyId(null);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("Copied."));
    } catch {
      toast.error(t("Could not copy. Please copy it by hand."));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Manage"
        title="Student Passwords"
        description="Use this when a student cannot reset their password by email. Give them the temporary password in person; they can change it after logging in."
      />

      <form onSubmit={search} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("Search by name or registration number")}
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-navy-900 sm:max-w-md"
        />
        <Button type="submit" loading={searching} icon={<Search size={16} />}>
          {t("Search")}
        </Button>
      </form>

      {issued && (
        <div className="mt-6 rounded-card border border-success-600/30 bg-success-50 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-success-600">
            <ShieldCheck size={16} /> {t("Temporary password created")}
          </p>
          <p className="mt-2 text-sm text-ink">
            {issued.name} ({issued.regNo})
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="select-all rounded-lg bg-white px-4 py-2 font-mono text-lg font-semibold tracking-wider text-navy-900 keep-white">
              {issued.temporaryPassword}
            </code>
            <Button variant="secondary" onClick={() => copy(issued.temporaryPassword)} icon={<Copy size={15} />}>
              {t("Copy")}
            </Button>
          </div>
          <p className="mt-3 text-xs text-ink-light">
            {t("This is shown only once. Give it to the student and ask them to change it after logging in.")}
          </p>
        </div>
      )}

      {searching && <LoadingBlock rows={2} />}

      {!searching && results && results.length === 0 && (
        <div className="mt-6">
          <EmptyState icon={<Search size={20} />} title={t("No students found")} description={t("Check the name or registration number and try again.")} />
        </div>
      )}

      {!searching && results && results.length > 0 && (
        <div className="stagger mt-6 space-y-3">
          {results.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white p-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-ink">{s.name}</p>
                <p className="text-sm text-ink-light">
                  {s.regNo} · {s.course} · Year {s.year}
                </p>
                <p className="text-xs text-ink-light">
                  {s.phone || "—"} · {s.email || "—"}
                </p>
              </div>
              <Button
                variant="secondary"
                loading={busyId === s.id}
                onClick={() => reset(s)}
                icon={<KeyRound size={15} />}
              >
                {t("Set temporary password")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
