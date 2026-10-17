"use client";

import { ReactNode } from "react";
import { useLang } from "../../lib/i18n";

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const { t } = useLang();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy-700">
            {t(eyebrow)}
          </p>
        )}
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {t(title)}
        </h2>
        {description && (
          <p className="mt-2 max-w-lg text-sm text-ink-light">{t(description)}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
