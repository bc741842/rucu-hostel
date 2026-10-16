"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-cream print:block print:h-auto print:overflow-visible">
      <Topbar onMobileMenuToggle={() => setMobileOpen((o) => !o)} />
      <div className="h-[3px] w-full shrink-0 bg-gold-500 print:hidden" />
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        {/* Desktop sidebar */}
        <div className="hidden sm:flex print:hidden">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        </div>

        {/* Mobile sidebar: sits beside the page (pushes content), no overlay */}
        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 168 }}
              exit={{ width: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full shrink-0 overflow-hidden sm:hidden print:hidden"
            >
              <Sidebar
                collapsed={false}
                onToggle={() => {}}
                onNavigate={() => setMobileOpen(false)}
                showToggle={false}
                width={168}
                className="h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="min-w-0 flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 print:overflow-visible print:p-0"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
