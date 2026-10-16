import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold-500 text-gold-500">
        <span className="font-display text-lg font-bold">RC</span>
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-navy-700">
        Error 404
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-sm text-ink-light">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
