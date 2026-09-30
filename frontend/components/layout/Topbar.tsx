"use client";

import { usePathname } from "next/navigation";
import { navItems } from "../../lib/nav-config";

export default function Topbar() {
  const pathname = usePathname();

  const currentPage =
    navItems.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname?.startsWith(item.href)),
    )?.label ?? "Dashboard";

  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between bg-navy-900 px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-gold-500 text-gold-500">
          <span className="font-display text-xs font-bold">RC</span>
        </div>
        <h1 className="font-display text-lg font-semibold text-white">
          {currentPage}
        </h1>
      </div>
      <p className="hidden text-sm text-white/50 sm:block">
        RUCU Hostel Booking System
      </p>
    </header>
  );
}
