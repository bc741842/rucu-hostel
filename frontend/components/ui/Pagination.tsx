"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "../../lib/i18n";

export default function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const { t } = useLang();
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-ink-light">
      <p>
        {from}–{to} {t("of")} {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          className={btn}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label={t("Previous page")}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[4.5rem] text-center">
          {page} / {pageCount}
        </span>
        <button
          className={btn}
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          aria-label={t("Next page")}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
