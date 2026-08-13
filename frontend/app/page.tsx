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
      <section className="max-w-3xl mx-auto px-5 sm:px-6 pt-16 sm:pt-24 pb-14 text-center">
        <p className="text-xs text-slate-400 mb-5 tracking-wide">
          {t("landing.trust_line")}
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.15] mb-5">
          {t("landing.hero.title_line1")}
          <br />
          <span className="text-blue-600">{t("landing.hero.title_line2")}</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl mx-auto mb-8">
          {t("landing.hero.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/nueva")}
            className="bg-blue-600 text-white px-8 py-3.5 min-h-[48px] rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-card-md w-full sm:w-auto"
          >
            {t("landing.cta.primary")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/nueva?demo=1")}
            className="border border-slate-200 text-slate-500 px-6 py-3 min-h-[48px] rounded-xl text-sm font-medium hover:border-blue-300 hover:text-blue-600 transition-colors w-full sm:w-auto"
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
              className="bg-white border border-border rounded-xl px-4 py-4 text-left shadow-card min-h-[108px]"
            >
              <span className="text-blue-600 text-sm block mb-1.5" aria-hidden>
                {a.icon}
              </span>
              <span className="text-sm font-semibold text-slate-800 block">{t(a.title)}</span>
              <p className="text-xs text-slate-500 mt-1.5 leading-snug">{t(a.line)}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          {t("landing.areas.caption")}
        </p>
      </section>

      <section className="bg-white border-y border-border py-14 sm:py-16">
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
                className="text-left rounded-xl p-1 hover:bg-slate-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="text-xs text-blue-600 font-semibold">{f.step}</span>
                <h3 className="font-semibold text-slate-900 mt-1.5 mb-2">{t(f.titleKey)}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t(f.descKey)}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-5 sm:px-6 py-12 text-center">
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          {t("landing.what_is.short")}
        </p>
        <button
          type="button"
          onClick={() => router.push("/glosario")}
          className="text-sm text-slate-400 hover:text-blue-600 min-h-[44px]"
        >
          {t("landing.what_is.link")}
        </button>
      </section>

      <section className="max-w-xl mx-auto px-5 sm:px-6 pb-20 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
          {t("landing.bottom_cta.title")}
        </h2>
        <p className="text-slate-500 text-sm mb-8">{t("landing.bottom_cta.subtitle")}</p>
        <button
          type="button"
          onClick={() => router.push("/nueva")}
          className="bg-blue-600 text-white px-10 py-4 min-h-[48px] rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-card-md w-full sm:w-auto"
        >
          {t("landing.cta.primary")}
        </button>
      </section>
    </div>
  );
}
