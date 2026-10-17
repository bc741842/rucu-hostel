"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  Trash2,
  Globe2,
  Building2,
  FileAudio,
  FileText,
  Download,
} from "lucide-react";
import { api } from "../../../lib/api";
import { useLang } from "../../../lib/i18n";
import { useAuth } from "../../../lib/auth-context";

interface Hostel {
  id: string;
  name: string;
}

interface ChatMessage {
  id: string;
  message: string | null;
  messageType: "text" | "image" | "audio" | "video" | "file";
  fileName: string | null;
  filePath: string | null;
  fileSize: number | null;
  createdAt: string;
  student: { id: string; name: string; regNo: string };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const POLL_INTERVAL_MS = 5000;

function MediaPreview({
  m,
  onDownload,
  downloading,
}: {
  m: ChatMessage;
  onDownload: (m: ChatMessage) => void;
  downloading: boolean;
}) {
  const { t } = useLang();
  if (!m.filePath) return null;
  // filePath is already the full Cloudinary URL.
  const url = m.filePath;

  const downloadButton = (
    <button
      onClick={() => onDownload(m)}
      disabled={downloading}
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/80 text-navy-900 shadow-sm transition-colors hover:bg-white disabled:opacity-60"
      title={t("Download")}
    >
      {downloading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Download size={13} />
      )}
    </button>
  );

  if (m.messageType === "image") {
    return (
      <div className="relative mb-1.5 inline-block">
        <img
          src={url}
          alt={m.fileName || "image"}
          className="max-h-56 rounded-lg object-cover"
        />
        <div className="absolute right-1.5 top-1.5">{downloadButton}</div>
      </div>
    );
  }
  if (m.messageType === "audio") {
    return (
      <div className="mb-1.5 flex items-center gap-2">
        <FileAudio size={16} className="shrink-0 text-navy-700" />
        <audio controls src={url} className="h-9 max-w-xs" />
        {downloadButton}
      </div>
    );
  }
  if (m.messageType === "video") {
    return (
      <div className="relative mb-1.5 inline-block">
        <video
          controls
          src={url}
          className="max-h-56 max-w-xs rounded-lg bg-black"
        />
        <div className="absolute right-1.5 top-1.5">{downloadButton}</div>
      </div>
    );
  }
  // Any other file type (PDF, Word, ZIP, etc.) - shown as a file chip.
  return (
    <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-white p-2">
      <FileText size={16} className="shrink-0 text-navy-700" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink">{m.fileName}</p>
        {m.fileSize != null && (
          <p className="text-[10px] text-ink-light">{formatSize(m.fileSize)}</p>
        )}
      </div>
      {downloadButton}
    </div>
  );
}

export default function ChatManagePage() {
  const { t } = useLang();
  const { user } = useAuth();
  const canDelete = user?.type === "admin" && (user.role === "super_admin" || user.role === "warden");
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostelId, setSelectedHostelId] = useState(""); // "" = All Hostels

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get("/hostels").then((res) => setHostels(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadMessages(true);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(false), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHostelId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function loadMessages(showSpinner: boolean) {
    if (showSpinner) setLoading(true);
    try {
      const url = selectedHostelId
        ? `/chat/admin/hostel/${selectedHostelId}`
        : "/chat/admin/all";
      const res = await api.get(url);
      setMessages(res.data);
      setError("");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to load this chat. Please try again.",
      );
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  async function deleteMessage(id: string) {
    if (!window.confirm(t("Delete this message permanently?"))) return;
    setDeletingId(id);
    try {
      await api.delete(`/chat/admin/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to delete this message. Please try again.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function downloadMedia(m: ChatMessage) {
    if (!m.filePath) return;
    setDownloadingId(m.id);
    try {
      // Goes through the guarded /chat/:id/download backend route (not the
      // plain /media/chat static URL), so the browser's download request
      // is never blocked by CORS.
      const res = await api.get(`/chat/${m.id}/download`, {
        responseType: "blob",
      });
      const blobUrl = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = m.fileName || "file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Failed to download this file. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        {t("Community")}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        {t("Monitor Chat")}
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        {t("Read-only view of hostel group chats, including shared photos, audio, video and other files. Remove any message that breaks the rules.")}
      </p>

      <div className="mt-5 flex items-center gap-3">
        <select
          value={selectedHostelId}
          onChange={(e) => setSelectedHostelId(e.target.value)}
          className="rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none"
        >
          <option value="">{t("All Hostels (global group)")}</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
        <span className="flex items-center gap-1.5 rounded-full bg-gold-500/15 px-3 py-1.5 text-xs font-medium text-gold-700">
          {selectedHostelId ? <Building2 size={13} /> : <Globe2 size={13} />}
          {messages.length} messages
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-card border border-line bg-white">
        {loading && (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-ink-light">
            <Loader2 size={16} className="animate-spin" /> {t("Loading chat...")}
          </div>
        )}

        {!loading && error && (
          <div className="m-4 flex items-center gap-2 rounded-lg border border-danger-600/20 bg-danger-50 p-4 text-sm text-danger-600">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && !error && (
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink-light">
                {t("No messages in this group yet.")}
              </div>
            ) : (
              messages.map((m) => (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={m.id}
                  className="group flex items-start justify-between gap-2 rounded-lg bg-cream px-3.5 py-2 text-sm"
                >
                  <div>
                    <p className="text-xs font-semibold text-navy-700">
                      {m.student.name} ({m.student.regNo})
                    </p>
                    <div className="mt-0.5">
                      <MediaPreview
                        m={m}
                        onDownload={downloadMedia}
                        downloading={downloadingId === m.id}
                      />
                      {m.message && (
                        <p className="whitespace-pre-wrap text-ink">
                          {m.message}
                        </p>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-ink-light">
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {canDelete && (
                  <button
                    onClick={() => deleteMessage(m.id)}
                    disabled={deletingId === m.id}
                    className="flex-shrink-0 rounded-lg p-1.5 text-ink-light transition-colors hover:bg-danger-50 hover:text-danger-600 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 disabled:opacity-60"
                    title={t("Delete message")}
                  >
                    {deletingId === m.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
