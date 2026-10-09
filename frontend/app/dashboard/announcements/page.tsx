"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  Loader2,
  AlertCircle,
  Building2,
  Globe,
  FileText,
  Download,
} from "lucide-react";
import { api } from "../../../lib/api";

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  hostel: { id: string; name: string } | null;
  author: { id: string; name: string; role: string };
  documentTitle: string | null;
  fileName: string | null;
  fileSize: number | null;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/announcements/my");
      setAnnouncements(res.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load announcements. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(a: Announcement) {
    if (!a.fileName) return;
    setDownloadingId(a.id);
    try {
      const res = await api.get(`/announcements/${a.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = a.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Could not download this document. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        RUCU Hostel
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        Announcements
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        Important updates and notices from the hostel administration.
      </p>

      {loading && (
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-ink-light">
          <Loader2 size={16} className="animate-spin" /> Loading announcements...
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 flex items-center gap-2 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && announcements.length === 0 && (
        <div className="mt-8 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
          There are no announcements right now.
        </div>
      )}

      {!loading && !error && announcements.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 flex flex-col gap-4"
        >
          {announcements.map((a) => (
            <motion.div
              key={a.id}
              variants={itemVariants}
              className="rounded-card border border-line bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-700">
                    <Megaphone size={18} />
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-ink">
                      {a.title}
                    </p>
                    <p className="mt-1 text-xs text-ink-light">
                      {a.author.name} &middot;{" "}
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
                  {a.hostel ? (
                    <>
                      <Building2 size={12} /> {a.hostel.name}
                    </>
                  ) : (
                    <>
                      <Globe size={12} /> All Hostels
                    </>
                  )}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink">
                {a.message}
              </p>

              {a.fileName && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line bg-cream px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-navy-700" />
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {a.documentTitle || a.fileName}
                      </p>
                      {a.fileSize != null && (
                        <p className="text-[11px] text-ink-light">
                          {formatSize(a.fileSize)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(a)}
                    disabled={downloadingId === a.id}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-700 disabled:opacity-60"
                  >
                    <Download size={13} />
                    {downloadingId === a.id ? "Downloading..." : "Download"}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
