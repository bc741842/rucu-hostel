import { cn } from "./cn";

// One place that decides how every status in the system looks.
const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-warning-50 text-warning-600",
  pending: "bg-warning-50 text-warning-600",
  Paid: "bg-success-50 text-success-600",
  paid: "bg-success-50 text-success-600",
  Confirmed: "bg-navy-50 text-navy-700",
  CheckedIn: "bg-navy-50 text-navy-700",
  Completed: "bg-success-50 text-success-600",
  Expired: "bg-cream-100 text-ink-light",
  Cancelled: "bg-danger-50 text-danger-600",
  Refunded: "bg-cream-100 text-ink-light",
};

export default function Badge({
  status,
  label,
  className,
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLES[status] ?? "bg-cream-100 text-ink-light",
        className,
      )}
    >
      {label ?? status}
    </span>
  );
}
