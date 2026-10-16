"use client";

import { Search, X } from "lucide-react";
import { useLang } from "../../lib/i18n";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const { t } = useLang();
  return (
    <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 transition-colors focus-within:border-navy-900">
      <Search size={16} className="shrink-0 text-ink-light" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t(placeholder)}
        aria-label={t(placeholder)}
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-light/60 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("Clear")}
          className="text-ink-light hover:text-ink"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
