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
  Open: "bg-danger-50 text-danger-600",
  InProgress: "bg-warning-50 text-warning-600",
  Resolved: "bg-success-50 text-success-600",
  Available: "bg-success-50 text-success-600",
  Occupied: "bg-navy-50 text-navy-700",
  Maintenance: "bg-danger-50 text-danger-600",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLES[status] ?? "bg-cream-100 text-ink-light",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? status}
    </span>
  );
}
