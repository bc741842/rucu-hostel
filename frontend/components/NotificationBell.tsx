"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/notifications/my/unread-count");
      setUnreadCount(res.data.count ?? 0);
    } catch {
      // silent - polling errors shouldn't disrupt the dashboard
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications/my");
      setNotifications(res.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await api.patch(`/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silent
      }
    }
    setOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/my/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-danger-600 text-white text-[10px] font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-line rounded-card shadow-lg z-50 text-left">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="font-semibold text-ink text-sm">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-gold-700 hover:text-gold-500 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-ink-light">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-ink-light">
              No notifications yet
            </div>
          ) : (
            <ul>
              {notifications.map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`px-4 py-3 border-b border-line cursor-pointer hover:bg-navy-50 transition-colors ${
                    !item.isRead ? "bg-gold-500/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!item.isRead && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      <p className="text-xs text-ink-light mt-0.5">{item.message}</p>
                      <p className="text-[11px] text-ink-light/70 mt-1">
                        {timeAgo(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="px-4 py-2 text-center border-t border-line">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/dashboard/notifications");
              }}
              className="text-xs text-navy-700 hover:text-navy-900 font-medium"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
