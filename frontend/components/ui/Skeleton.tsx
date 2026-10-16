import { cn } from "./cn";

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-navy-100/70", className)}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-card border border-line bg-white p-5">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-6 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
    </div>
  );
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="mt-6 space-y-3"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
