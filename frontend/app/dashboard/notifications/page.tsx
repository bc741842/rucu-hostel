"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "../../../lib/i18n";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const { t } = useLang();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

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
    fetchNotifications();
  }, []);

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await api.patch(`/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      } catch {
        // silent
      }
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/my/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="w-6 h-6 text-navy-900" />
          <h1 className="text-xl font-semibold text-ink">{t("Notifications")}</h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm text-gold-700 hover:text-gold-500 font-medium"
          >
            <CheckCheck className="w-4 h-4" />
            {t("Mark all as read")}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-ink-light py-12">{t("Loading...")}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-ink-light py-12 border border-line rounded-card bg-white">
          {t("No notifications yet")}
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleItemClick(item)}
              className={`p-4 rounded-card border cursor-pointer transition-colors ${
                !item.isRead
                  ? "bg-gold-500/5 border-gold-500/30"
                  : "bg-white border-line hover:bg-navy-50"
              }`}
            >
              <div className="flex items-start gap-2">
                {!item.isRead && (
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-gold-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="text-sm text-ink-light mt-1">{item.message}</p>
                  <p className="text-xs text-ink-light/70 mt-2">
                    {formatDate(item.createdAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
