import Link from "next/link";
import { LucideIcon } from "lucide-react";
import Skeleton from "./Skeleton";

export default function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  href,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  loading?: boolean;
  href?: string;
  hint?: string;
}) {
  const body = (
    <div
      className={`rounded-card border border-line bg-white p-5 transition-shadow ${
        href ? "hover:shadow-[0_6px_20px_rgba(20,40,75,0.10)]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-light">
          {label}
        </p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-50 text-navy-700">
          <Icon size={16} />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-16" />
      ) : (
        <p className="mt-2 font-display text-3xl font-semibold text-navy-900">
          {value}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-ink-light">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
