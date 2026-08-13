"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

const LIFE_AREAS = [
  { icon: "♥", title: "landing.areas.amor" as const, line: "landing.areas.line.amor" as const },
  { icon: "◈", title: "landing.areas.dinero" as const, line: "landing.areas.line.dinero" as const },
  { icon: "↑", title: "landing.areas.trabajo" as const, line: "landing.areas.line.trabajo" as const },
  { icon: "✚", title: "landing.areas.salud" as const, line: "landing.areas.line.salud" as const },
  { icon: "⌂", title: "landing.areas.familia" as const, line: "landing.areas.line.familia" as const },
  { icon: "✧", title: "landing.areas.crecimiento" as const, line: "landing.areas.line.crecimiento" as const },
];

export default function PortadaPage() {
  const router = useRouter();
  const { t } = useT();

  return (
    <div className="min-h-screen bg-base">
      <section className="rise-in max-w-3xl mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-14 text-center">
        <p className="kicker mb-6">{t("landing.trust_line")}</p>
        <h1 className="font-display text-[length:var(--fs-h1)] text-ink tracking-tight leading-[1.12] mb-5">
          {t("landing.hero.title_line1")}
          <br />
          <span className="italic text-ember">{t("landing.hero.title_line2")}</span>
        </h1>
        <p className="text-base sm:text-lg text-ink-2 leading-relaxed max-w-xl mx-auto mb-8">
          {t("landing.hero.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/nueva")}
            className="focus-lab bg-[var(--ember)] text-[var(--bg)] px-8 py-3.5 min-h-[48px] rounded-[var(--r-md)] text-base font-medium hover:brightness-110 transition-all duration-[var(--dur-2)] ease-instrument w-full sm:w-auto"
          >
            {t("landing.cta.primary")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/nueva?demo=1")}
            className="focus-lab border border-border text-ink-2 px-6 py-3 min-h-[48px] rounded-[var(--r-md)] text-sm font-medium hover:text-ink hover:border-[var(--line-strong)] transition-colors w-full sm:w-auto"
          >
            {t("landing.cta.secondary")}
          </button>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 sm:px-6 pb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {LIFE_AREAS.map((a) => (
            <div
              key={a.title}
              className="surface-card px-4 py-4 text-left min-h-[108px]"
            >
              <span className="text-ember text-sm block mb-1.5" aria-hidden>
                {a.icon}
              </span>
              <span className="text-sm font-medium text-ink block">{t(a.title)}</span>
              <p className="text-xs text-ink-2 mt-1.5 leading-snug">{t(a.line)}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-ink-3 mt-4">
          {t("landing.areas.caption")}
        </p>
      </section>

      <section className="border-y border-border py-14 sm:py-16 bg-elev">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {[
              {
                step: "01",
                titleKey: "landing.features.topics.title" as const,
                descKey: "landing.features.topics.desc" as const,
              },
              {
                step: "02",
                titleKey: "landing.features.pro.title" as const,
                descKey: "landing.features.pro.desc" as const,
              },
              {
                step: "03",
                titleKey: "landing.features.transits.title" as const,
                descKey: "landing.features.transits.desc" as const,
              },
            ].map((f) => (
              <button
                key={f.titleKey}
                type="button"
                onClick={() => router.push("/nueva")}
                className="focus-lab text-left rounded-[var(--r-md)] p-2 hover:bg-[var(--accent-soft)] transition-colors"
              >
                <span className="kicker">{f.step}</span>
                <h3 className="font-display text-lg text-ink mt-2 mb-2">{t(f.titleKey)}</h3>
                <p className="text-sm text-ink-2 leading-relaxed">{t(f.descKey)}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-5 sm:px-6 py-12 text-center">
        <p className="text-sm text-ink-2 leading-relaxed mb-3">
          {t("landing.what_is.short")}
        </p>
        <button
          type="button"
          onClick={() => router.push("/glosario")}
          className="text-sm text-ink-3 hover:text-accent min-h-[44px]"
        >
          {t("landing.what_is.link")}
        </button>
      </section>

      <section className="max-w-xl mx-auto px-5 sm:px-6 pb-20 text-center">
        <h2 className="font-display text-[length:var(--fs-h2)] text-ink mb-3">
          {t("landing.bottom_cta.title")}
        </h2>
        <p className="text-ink-2 text-sm mb-8">{t("landing.bottom_cta.subtitle")}</p>
        <button
          type="button"
          onClick={() => router.push("/nueva")}
          className="focus-lab bg-[var(--ember)] text-[var(--bg)] px-10 py-4 min-h-[48px] rounded-[var(--r-md)] text-base font-medium hover:brightness-110 transition-all duration-[var(--dur-2)] ease-instrument w-full sm:w-auto"
        >
          {t("landing.cta.primary")}
        </button>
      </section>
    </div>
  );
}
