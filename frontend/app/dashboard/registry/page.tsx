"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { FileUp, ShieldCheck, ShieldAlert } from "lucide-react";
import { api } from "../../../lib/api";
import { useLang } from "../../../lib/i18n";
import PageHeader from "../../../components/ui/PageHeader";
import Button from "../../../components/ui/Button";
import { LoadingBlock } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";

interface Summary {
  count: number;
  lastImportedAt: string | null;
  enforced: boolean;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function RegistryPage() {
  const { t } = useLang();
  const toast = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function load() {
    try {
      const res = await api.get("/registry/summary");
      setSummary(res.data);
    } catch {
      toast.error(t("Could not load the student list."));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    setCsv(await file.text());
  }

  async function upload() {
    if (!csv) return;
    setBusy(true);
    try {
      const res = await api.post("/registry/import", { csv });
      setResult(res.data);
      toast.success(t("Student list uploaded."));
      setCsv("");
      setFileName("");
      load();
    } catch (err: any) {
      const m = err?.response?.data?.message;
      toast.error(Array.isArray(m) ? m.join(", ") : m || t("Could not upload the list."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Setup"
        title="RUCU Student List"
        description="Upload the official list of RUCU students. Once it is uploaded, a student can only create an account if their Reg. No., name, course and year match this list."
      />

      {!summary ? (
        <LoadingBlock />
      ) : (
        <div
          className={`mt-6 rounded-card border p-5 ${
            summary.enforced ? "border-success-600/30 bg-success-50" : "border-warning-600/30 bg-warning-50"
          }`}
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            {summary.enforced ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
            {summary.enforced
              ? t("Sign-up check is ON")
              : t("Sign-up check is OFF: no student list has been uploaded yet")}
          </p>
          <p className="mt-2 text-sm text-ink-light">
            {t("Students in the list")}: <strong>{summary.count}</strong>
            {summary.lastImportedAt && (
              <>
                {" · "}
                {t("Last upload")}: {new Date(summary.lastImportedAt).toLocaleString()}
              </>
            )}
          </p>
        </div>
      )}

      <div className="mt-6 rounded-card border border-line bg-white p-5">
        <p className="text-sm font-semibold text-ink">{t("Upload a CSV file")}</p>
        <p className="mt-2 text-sm text-ink-light">
          {t("The first row must be the column names:")} <code>regNo,name,course,year,gender</code>.{" "}
          {t("The gender column is optional. Uploading again updates students already in the list.")}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} className="text-sm" />
          <Button onClick={upload} loading={busy} disabled={!csv} icon={<FileUp size={16} />}>
            {t("Upload")}
          </Button>
        </div>
        {fileName && <p className="mt-2 text-xs text-ink-light">{fileName}</p>}
      </div>

      {result && (
        <div className="mt-6 rounded-card border border-line bg-white p-5">
          <p className="text-sm text-ink">
            {t("Added or updated")}: <strong>{result.imported}</strong> · {t("Skipped")}:{" "}
            <strong>{result.skipped}</strong>
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-ink-light">
              {result.errors.slice(0, 20).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
