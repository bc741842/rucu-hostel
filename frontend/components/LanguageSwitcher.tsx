"use client";

import { useLang } from "../lib/i18n";

export default function LanguageSwitcher({
  onDark = false,
}: {
  onDark?: boolean;
}) {
  const { lang, setLang } = useLang();
  const base = onDark
    ? "border-white/25 text-white/70"
    : "border-line text-ink-light";
  const active = onDark
    ? "bg-gold-500 text-navy-900"
    : "bg-navy-900 text-white";
  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex overflow-hidden rounded-full border text-[11px] font-semibold ${base}`}
    >
      {(["en", "sw"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2.5 py-1 uppercase transition-colors ${
            lang === l ? active : "hover:bg-white/10"
          }`}
        >
          {l === "en" ? "EN" : "SW"}
        </button>
      ))}
    </div>
  );
}
