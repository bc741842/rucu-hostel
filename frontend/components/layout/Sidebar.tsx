"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { navItems } from "../../lib/nav-config";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const roleKey = user?.type === "admin" ? user.role : "student";

  const visibleItems = navItems.filter(
    (item) => !item.allow || (roleKey && item.allow.includes(roleKey as any)),
  );

  const displayName =
    user?.type === "admin" ? user.name : user?.regNo ?? "Student";

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 224 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="flex h-full flex-col bg-navy-900 shrink-0 overflow-hidden"
    >
      {/* Toggle */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="flex items-center justify-center py-4 text-white/50 transition-colors hover:text-gold-300"
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 space-y-1.5">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-gold-500/15 text-gold-300"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              {!collapsed && (
                <span className="truncate font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: avatar + logout */}
      <div
        className={`flex items-center gap-3 border-t border-white/10 px-3 py-4 ${
          collapsed ? "flex-col" : ""
        }`}
      >
        <div
          className={`flex items-center gap-2.5 ${collapsed ? "" : "flex-1 min-w-0"}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
            {displayName?.slice(0, 1).toUpperCase()}
          </span>
          {!collapsed && (
            <span className="truncate text-sm text-white/80">
              {displayName}
            </span>
          )}
        </div>
        <button
          onClick={logout}
          aria-label="Log out"
          title="Log out"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={16} />
        </button>
      </div>
    </motion.aside>
  );
}
