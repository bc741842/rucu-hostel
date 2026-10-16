"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Loader2,
  AlertCircle,
  Building2,
  Globe,
  Trash2,
  Plus,
  FileText,
  Paperclip,
  X,
} from "lucide-react";
import { api } from "../../../lib/api";
import { useToast } from "../../../components/ui/Toast";

interface Hostel {
  id: string;
  name: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  hostel: Hostel | null;
  author: { id: string; name: string; role: string };
  documentTitle: string | null;
  fileName: string | null;
  fileSize: number | null;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ManageAnnouncementsPage() {
  const toast = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [hostelId, setHostelId] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [annRes, hostelsRes] = await Promise.all([
        api.get("/announcements"),
        api.get("/hostels"),
      ]);
      setAnnouncements(annRes.data);
      setHostels(hostelsRes.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load announcements. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    if (chosen && chosen.type !== "application/pdf") {
      setCreateError("Only PDF files are allowed.");
      setFile(null);
      return;
    }
    setCreateError("");
    setFile(chosen);
  }

  async function createAnnouncement() {
    if (!title.trim() || !message.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("message", message.trim());
      if (hostelId) formData.append("hostelId", hostelId);
      if (file) {
        formData.append("documentTitle", documentTitle.trim() || file.name);
        formData.append("file", file);
      }

      const res = await api.post("/announcements", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnnouncements((prev) => [res.data, ...prev]);
      setTitle("");
      setMessage("");
      setHostelId("");
      setDocumentTitle("");
      setFile(null);
    } catch (err: any) {
      setCreateError(
        err?.response?.data?.message ||
          "Failed to post the announcement. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function deleteAnnouncement(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to delete the announcement. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function downloadAttachment(a: Announcement) {
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
      toast.error("Could not download this document. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        Phase 2
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        Manage Announcements
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        Post a notice to every student, or target just one hostel. You can
        optionally attach a PDF document (forms, rules, official letters).
      </p>

      {/* Create form */}
      <div className="mt-6 rounded-card border border-line bg-white p-5">
        <h3 className="font-display text-base font-semibold text-ink">
          New Announcement
        </h3>
        <div className="mt-3 flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            rows={3}
            className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={hostelId}
              onChange={(e) => setHostelId(e.target.value)}
              className="flex-1 rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
            >
              <option value="">All Hostels (everyone)</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} only
                </option>
              ))}
            </select>
          </div>

          {/* Optional PDF attachment */}
          <div className="rounded-lg border border-dashed border-line bg-cream p-3">
            {!file ? (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-light">
                <Paperclip size={16} />
                Attach a PDF document (optional)
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-ink">
                    <FileText size={16} className="text-navy-700" />
                    {file.name}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setDocumentTitle("");
                    }}
                    className="rounded-md p-1 text-ink-light hover:bg-white hover:text-danger-600"
                  >
                    <X size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="Document title (e.g. Hostel Rules 2026/27)"
                  className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-navy-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={createAnnouncement}
            disabled={!title.trim() || !message.trim() || creating}
            className="flex items-center justify-center gap-2 self-start rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
          >
            {creating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Post Announcement
          </motion.button>
        </div>

        {createError && (
          <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
            {createError}
          </p>
        )}
      </div>

      {/* List */}
      <h3 className="mt-8 font-display text-base font-semibold text-ink">
        All Announcements
      </h3>

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-ink-light">
          <Loader2 size={16} className="animate-spin" /> Loading...
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 flex items-center gap-2 rounded-card border border-danger-600/20 bg-danger-50 p-6 text-sm text-danger-600">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && announcements.length === 0 && (
        <div className="mt-4 rounded-card border border-line bg-white p-8 text-center text-sm text-ink-light">
          No announcements have been posted yet.
        </div>
      )}

      {!loading && !error && announcements.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-4 flex flex-col gap-3"
        >
          <AnimatePresence>
            {announcements.map((a) => (
              <motion.div
                key={a.id}
                variants={itemVariants}
                exit={{ opacity: 0, scale: 0.97 }}
                className="flex items-start justify-between gap-3 rounded-card border border-line bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-700">
                    <Megaphone size={16} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{a.title}</p>
                      <span className="flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700">
                        {a.hostel ? (
                          <>
                            <Building2 size={11} /> {a.hostel.name}
                          </>
                        ) : (
                          <>
                            <Globe size={11} /> All
                          </>
                        )}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-light">{a.message}</p>
                    <p className="mt-1 text-xs text-ink-light">
                      {a.author.name} &middot;{" "}
                      {new Date(a.createdAt).toLocaleString()}
                    </p>

                    {a.fileName && (
                      <button
                        onClick={() => downloadAttachment(a)}
                        disabled={downloadingId === a.id}
                        className="mt-2 flex items-center gap-1.5 rounded-lg border border-line bg-cream px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-navy-50 disabled:opacity-60"
                      >
                        <FileText size={13} className="text-navy-700" />
                        {a.documentTitle || a.fileName}
                        {a.fileSize != null && (
                          <span className="text-ink-light">
                            ({formatSize(a.fileSize)})
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  disabled={deletingId === a.id}
                  className="flex-shrink-0 rounded-lg p-2 text-ink-light transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:opacity-60"
                >
                  {deletingId === a.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
