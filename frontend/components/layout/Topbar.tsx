"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { navItems } from "../../lib/nav-config";
import NotificationBell from "../NotificationBell";

export default function Topbar({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle: () => void;
}) {
  const pathname = usePathname();

  const currentPage =
    navItems.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname?.startsWith(item.href)),
    )?.label ?? "Dashboard";

  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between bg-navy-900 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          aria-label="Open menu"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 sm:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-gold-500 text-gold-500">
          <span className="font-display text-xs font-bold">RC</span>
        </div>
        <h1 className="font-display text-base font-semibold text-white sm:text-lg">
          {currentPage}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <p className="hidden text-sm text-white/50 sm:block">
          RUCU Hostel Booking System
        </p>
        <NotificationBell />
      </div>
    </header>
  );
}
