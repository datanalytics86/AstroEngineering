"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n";
import type { TranslationKeys } from "@/lib/locales/es";
import { track } from "@/lib/analytics";
import ProOffer from "@/components/ProOffer";
import Disclaimer from "@/components/Disclaimer";

export default function ProLanding() {
  const { t } = useT();
  useEffect(() => {
    track("landing_viewed");
  }, []);
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 sm:py-14 space-y-8">
      <p className="text-xs uppercase tracking-widest text-accent">{t("pro.page.kicker")}</p>
      <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-tight">{t("pro.page.title")}</h1>
      <p className="text-ink-2 leading-relaxed">{t("pro.page.lead")}</p>
      <Disclaimer />
      <ProOffer birth={null} months={[]} keyDateCount={0} />
      <p className="text-sm text-ink-3">{t("pro.page.sample")}</p>
      <p className="text-sm text-ink-2">{t("pro.page.anchor")}</p>
      <section className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-medium text-ink mb-2">{t("pro.page.table.free")}</h2>
          <p className="text-sm text-ink-2">{t("chart.topics.title")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-medium text-ink mb-2">{t("pro.page.table.paid")}</h2>
          <p className="text-sm text-ink-2">{t("chart.pro.feature.intensity")}</p>
        </div>
      </section>
      <section className="space-y-4">
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <div key={n}>
            <h3 className="font-medium text-ink">{t(`pro.page.faq.q${n}` as TranslationKeys)}</h3>
            <p className="text-sm text-ink-2 mt-1">{t(`pro.page.faq.a${n}` as TranslationKeys)}</p>
          </div>
        ))}
      </section>
    </article>
  );
}
