"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Loader2,
  AlertCircle,
  Users,
  Globe2,
  Smile,
  Paperclip,
  X,
  FileAudio,
  FileVideo,
  FileText,
  Download,
} from "lucide-react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { useLang } from "../../../lib/i18n";

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

type Tab = "hostel" | "all";

const POLL_INTERVAL_MS = 5000;

const EMOJIS = [
  "😀", "😂", "😍", "😊", "😢", "😡", "👍", "👎", "🙏", "👏",
  "🔥", "🎉", "❤️", "💯", "😴", "🤔", "😅", "😭", "😎", "🙌",
  "👀", "✅", "❌", "⚠️", "📚", "🏠", "⏰", "📣", "🤝", "💪",
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MediaBubble({
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
      <div className="relative mb-1.5">
        <img
          src={url}
          alt={m.fileName || "image"}
          className="max-h-64 w-full rounded-lg object-cover"
        />
        <div className="absolute right-1.5 top-1.5">{downloadButton}</div>
      </div>
    );
  }
  if (m.messageType === "audio") {
    return (
      <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-white/50 p-2">
        <FileAudio size={16} className="shrink-0 text-navy-700" />
        <audio controls src={url} className="h-9 max-w-full flex-1" />
        {downloadButton}
      </div>
    );
  }
  if (m.messageType === "video") {
    return (
      <div className="relative mb-1.5">
        <video
          controls
          src={url}
          className="max-h-64 w-full rounded-lg bg-black"
        />
        <div className="absolute right-1.5 top-1.5">{downloadButton}</div>
      </div>
    );
  }
  // Any other file type (PDF, Word, ZIP, etc.) - shown as a file chip.
  return (
    <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-white/50 p-2">
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

export default function ChatPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const myRegNo = (user as any)?.regNo;

  const [tab, setTab] = useState<Tab>("hostel");
  const [hostelMessages, setHostelMessages] = useState<ChatMessage[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadBoth(true);
    pollRef.current = setInterval(() => loadBoth(false), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [tab, hostelMessages, allMessages]);

  async function loadBoth(showSpinner: boolean) {
    if (showSpinner) setLoading(true);
    try {
      const [hostelRes, allRes] = await Promise.all([
        api.get("/chat/hostel").catch((err) => ({ error: err })),
        api.get("/chat/all"),
      ]);
      if (!("error" in hostelRes)) {
        setHostelMessages(hostelRes.data);
      }
      setAllMessages(allRes.data);
      setError("");
    } catch (err: any) {
      if (showSpinner) {
        setError(
          err?.response?.data?.message ||
            "Failed to load chat. Please try again.",
        );
      }
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const chosen = e.target.files?.[0] ?? null;
    if (!chosen) return;
    if (chosen.size > MAX_FILE_SIZE) {
      setError("This file is too large. The limit is 10MB.");
      return;
    }
    setAttachedFile(chosen);
    setError("");
  }

  function insertEmoji(emoji: string) {
    setDraft((prev) => prev + emoji);
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

  async function sendMessage() {
    if (!draft.trim() && !attachedFile) return;
    setSending(true);
    try {
      const endpoint = tab === "hostel" ? "/chat/hostel" : "/chat/all";
      let res;
      if (attachedFile) {
        const formData = new FormData();
        if (draft.trim()) formData.append("message", draft.trim());
        formData.append("file", attachedFile);
        res = await api.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        res = await api.post(endpoint, { message: draft.trim() });
      }
      if (tab === "hostel") {
        setHostelMessages((prev) => [...prev, res.data]);
      } else {
        setAllMessages((prev) => [...prev, res.data]);
      }
      setDraft("");
      setAttachedFile(null);
      setShowEmoji(false);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const activeMessages = tab === "hostel" ? hostelMessages : allMessages;
  const noHostelGroupYet = tab === "hostel" && !loading && hostelMessages.length === 0 && error.includes("active bed booking");

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
        {t("Community")}
      </p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
        {t("Chat")}
      </h2>
      <p className="mt-2 max-w-lg text-sm text-ink-light">
        {t("Talk with your hostel mates, or with everyone across the hostels.")}
      </p>

      {/* Tabs */}
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => setTab("hostel")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            tab === "hostel"
              ? "bg-navy-900 text-white"
              : "bg-white text-ink-light hover:bg-cream"
          }`}
        >
          <Users size={15} /> {t("My Hostel")}
        </button>
        <button
          onClick={() => setTab("all")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            tab === "all"
              ? "bg-navy-900 text-white"
              : "bg-white text-ink-light hover:bg-cream"
          }`}
        >
          <Globe2 size={15} /> {t("All Hostels")}
        </button>
      </div>

      {/* Chat panel */}
      <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-card border border-line bg-white">
        {loading && (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-ink-light">
            <Loader2 size={16} className="animate-spin" /> {t("Loading chat...")}
          </div>
        )}

        {!loading && error && !noHostelGroupYet && (
          <div className="m-4 flex items-center gap-2 rounded-lg border border-danger-600/20 bg-danger-50 p-4 text-sm text-danger-600">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!loading && (
          <>
            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {tab === "hostel" && hostelMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-sm text-ink-light">
                  {t("No messages yet in your hostel group.")}
                  <br />
                  {t("You need an active bed booking to join this chat.")}
                </div>
              ) : tab === "all" && allMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-ink-light">
                  {t("No messages yet. Say hello!")}
                </div>
              ) : (
                activeMessages.map((m) => {
                  const isMine = m.student.regNo === myRegNo;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={m.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                          isMine
                            ? "rounded-br-sm bg-gold-500/20 text-ink"
                            : "rounded-bl-sm bg-navy-50 text-ink"
                        }`}
                      >
                        {!isMine && (
                          <p className="mb-0.5 text-xs font-semibold text-navy-700">
                            {m.student.name}
                          </p>
                        )}
                        <MediaBubble
                          m={m}
                          onDownload={downloadMedia}
                          downloading={downloadingId === m.id}
                        />
                        {m.message && (
                          <p className="whitespace-pre-wrap">{m.message}</p>
                        )}
                        <p className="mt-1 text-right text-[10px] text-ink-light">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Attached file preview */}
            {attachedFile && (
              <div className="flex items-center justify-between gap-2 border-t border-line bg-cream px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-ink">
                  {attachedFile.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(attachedFile)}
                      alt=""
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : attachedFile.type.startsWith("video/") ? (
                    <FileVideo size={16} className="text-navy-700" />
                  ) : attachedFile.type.startsWith("audio/") ? (
                    <FileAudio size={16} className="text-navy-700" />
                  ) : (
                    <FileText size={16} className="text-navy-700" />
                  )}
                  {attachedFile.name}
                  <span className="text-ink-light">
                    ({formatSize(attachedFile.size)})
                  </span>
                </div>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="rounded-md p-1 text-ink-light hover:bg-white hover:text-danger-600"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Emoji picker */}
            {showEmoji && (
              <div className="grid grid-cols-10 gap-1 border-t border-line bg-cream p-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="rounded-md p-1.5 text-lg hover:bg-white"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Composer */}
            <div className="flex items-center gap-2 border-t border-line p-3">
              <button
                onClick={() => setShowEmoji((s) => !s)}
                disabled={noHostelGroupYet}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-light hover:bg-cream disabled:opacity-60"
                title={t("Emoji")}
              >
                <Smile size={18} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={noHostelGroupYet}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-light hover:bg-cream disabled:opacity-60"
                title={t("Attach a file (up to 10MB)")}
              >
                <Paperclip size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  tab === "hostel"
                    ? "Message your hostel..."
                    : "Message everyone..."
                }
                disabled={noHostelGroupYet}
                className="flex-1 rounded-full border border-line bg-cream px-4 py-2.5 text-sm text-ink focus:border-navy-500 focus:outline-none disabled:opacity-60"
              />
              <button
                onClick={sendMessage}
                disabled={(!draft.trim() && !attachedFile) || sending || noHostelGroupYet}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy-900 text-white transition-colors hover:bg-navy-700 disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
