"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LucideIcon } from "lucide-react";
import Skeleton from "./Skeleton";
import { useLang } from "../../lib/i18n";

export type Tone = "navy" | "success" | "warning" | "danger" | "gold";

const TONES: Record<Tone, { icon: string; bar: string }> = {
  navy: { icon: "bg-navy-50 text-navy-700", bar: "bg-navy-700" },
  success: { icon: "bg-success-50 text-success-600", bar: "bg-success-600" },
  warning: { icon: "bg-warning-50 text-warning-600", bar: "bg-warning-600" },
  danger: { icon: "bg-danger-50 text-danger-600", bar: "bg-danger-600" },
  gold: { icon: "bg-gold-500/15 text-gold-700", bar: "bg-gold-500" },
};

/** Counts up from 0 to the number inside the value ("TZS 1,200", "45%", 12). */
function useCountUp(value: string | number, enabled: boolean) {
  const text = String(value);
  const m = text.match(/^(\D*)([\d,]+(?:\.\d+)?)(\D*)$/);
  const target = m ? Number(m[2].replace(/,/g, "")) : NaN;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!enabled || !m || Number.isNaN(target)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / 700, 1);
      setShown(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, enabled]);

  if (!m || Number.isNaN(target)) return text;
  const decimals = m[2].includes(".") ? m[2].split(".")[1].length : 0;
  const n = decimals
    ? shown.toFixed(decimals)
    : Math.round(shown).toLocaleString(m[2].includes(",") ? "en-US" : undefined, {
        useGrouping: m[2].includes(","),
      });
  return `${m[1]}${n}${m[3]}`;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  href,
  hint,
  tone = "navy",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  loading?: boolean;
  href?: string;
  hint?: string;
  tone?: Tone;
}) {
  const { t } = useLang();
  const display = useCountUp(value, !loading);
  const c = TONES[tone];
  const body = (
    <div
      className={`relative h-full overflow-hidden rounded-card border border-line bg-white p-4 transition-all duration-200 sm:p-5 ${
        href
          ? "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(20,40,75,0.12)]"
          : ""
      }`}
    >
      <span className={`absolute inset-x-0 top-0 h-[3px] ${c.bar}`} />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-light">
          {t(label)}
        </p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${c.icon}`}
        >
          <Icon size={17} />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-16" />
      ) : (
        <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-navy-900 sm:text-3xl">
          {display}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-ink-light">{hint}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
