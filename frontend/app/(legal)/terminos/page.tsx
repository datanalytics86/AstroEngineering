"use client";

import { useT } from "@/lib/i18n";

export default function TerminosPage() {
  const { t } = useT();
  return (
    <article className="max-w-2xl mx-auto px-4 py-10 sm:py-14 space-y-6 text-ink">
      <p className="text-xs uppercase tracking-widest text-accent">{t("terms.kicker")}</p>
      <h1 className="font-display text-3xl tracking-tight">{t("terms.title")}</h1>
      <p className="text-ink-2 text-sm">{t("legal.placeholder_note")}</p>
      {([1, 2, 3, 4, 5, 6] as const).map((n) => (
        <p key={n} className="text-ink-2 leading-relaxed">
          {t(`terms.p${n}`)}
        </p>
      ))}
    </article>
  );
}
