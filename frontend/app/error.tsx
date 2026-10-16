"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold-500 text-gold-500">
        <span className="font-display text-lg font-bold">RC</span>
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold text-ink">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-sm text-ink-light">
        An unexpected error occurred. Please try again, and if it keeps
        happening, contact the hostel administrator.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
      >
        Try again
      </button>
    </div>
  );
}
