"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useLang } from "../lib/i18n";

/** Light/dark switch. The choice is remembered; first visit follows the device. */
export default function ThemeToggle({ onDark = false }: { onDark?: boolean }) {
  const { t } = useLang();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("rucu_theme", next ? "dark" : "light");
    } catch {
      /* storage can be unavailable; the choice just won't persist */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t("Switch to light mode") : t("Switch to dark mode")}
      title={dark ? t("Switch to light mode") : t("Switch to dark mode")}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        onDark
          ? "text-white/80 hover:bg-white/10"
          : "text-ink-light hover:bg-navy-50"
      }`}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
