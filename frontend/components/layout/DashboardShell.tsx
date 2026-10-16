"use client";

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-cream print:block print:h-auto print:overflow-visible">
      <Topbar onMobileMenuToggle={() => setMobileOpen(true)} />
      <div className="h-[3px] w-full shrink-0 bg-gold-500 print:hidden" />
      <div className="flex flex-1 overflow-hidden print:block print:overflow-visible">
        {/* Desktop sidebar */}
        <div className="hidden sm:flex print:hidden">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-40 bg-navy-900/50 sm:hidden"
              />
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 z-50 w-56 sm:hidden"
              >
                <div className="relative h-full">
                  <button
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    className="absolute -right-11 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-white"
                  >
                    <X size={16} />
                  </button>
                  <Sidebar
                    collapsed={false}
                    onToggle={() => {}}
                    onNavigate={() => setMobileOpen(false)}
                    showToggle={false}
                    className="h-full"
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 print:overflow-visible print:p-0"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
