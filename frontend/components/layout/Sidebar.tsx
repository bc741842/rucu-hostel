"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { navItems } from "../../lib/nav-config";
import { useLang } from "../../lib/i18n";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  showToggle?: boolean;
  className?: string;
  width?: number;
}

export default function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
  showToggle = true,
  className = "",
  width,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLang();

  const roleKey = user?.type === "admin" ? user.role : "student";

  const visibleItems = navItems.filter(
    (item) => !item.allow || (roleKey && item.allow.includes(roleKey as any)),
  );

  const displayName =
    user?.type === "admin" ? user.name : user?.regNo ?? "Student";

  return (
    <motion.aside
      initial={false}
      animate={{ width: width ?? (collapsed ? 72 : 224) }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={`flex h-full flex-col bg-navy-900 shrink-0 overflow-hidden ${className}`}
    >
      {showToggle && (
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex items-center justify-center py-4 text-white/50 transition-colors hover:text-gold-300"
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      )}

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto scrollbar-thin px-3 space-y-1.5 ${!showToggle ? "pt-4" : ""}`}>
        {visibleItems.map((item, idx) => {
          const showGroup =
            idx === 0 || visibleItems[idx - 1].group !== item.group;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Fragment key={item.href}>
            {showGroup &&
              (collapsed ? (
                idx > 0 && <div className="mx-3 my-2 border-t border-white/10" />
              ) : (
                <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                  {t(item.group ?? "")}
                </p>
              ))}
            <Link
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? t(item.label) : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors sm:py-2.5 ${
                isActive
                  ? "bg-gold-500/15 text-gold-300 before:absolute before:-left-3 before:top-2 before:bottom-2 before:w-[3px] before:rounded-r-full before:bg-gold-500"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span className="truncate font-medium">{t(item.label)}</span>}
            </Link>
            </Fragment>
          );
        })}
      </nav>

      {/* Bottom: avatar + logout */}
      <div
        className={`flex items-center gap-3 border-t border-white/10 px-3 py-4 ${
          collapsed ? "flex-col" : ""
        }`}
      >
        <div className={`flex items-center gap-2.5 ${collapsed ? "" : "flex-1 min-w-0"}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
            {displayName?.slice(0, 1).toUpperCase()}
          </span>
          {!collapsed && (
            <span className="truncate text-sm text-white/80">{displayName}</span>
          )}
        </div>
        <button
          onClick={logout}
          aria-label={t("Log out")}
          title={t("Log out")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} />
        </button>
      </div>
    </motion.aside>
  );
}
