"use client";

import { useState, ReactNode } from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-cream">
      <Topbar />
      <div className="h-[3px] w-full shrink-0 bg-gold-500" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <motion.main
          key={typeof window !== "undefined" ? window.location.pathname : "main"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex-1 overflow-y-auto scrollbar-thin p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
