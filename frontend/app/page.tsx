"use client";

import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";

const PLANET_CARDS = [
  {
    symbol: "☉",
    name: "Sol",
    roleKey: "tu identidad y voluntad",
    color: "#F97316",
    description:
      "El Sol representa quién eres en esencia: tu propósito de vida, tu vitalidad y la expresión más auténtica de tu ego.",
    descriptionEn:
      "The Sun represents who you are at your core: your life purpose, vitality, and the most authentic expression of your ego.",
  },
  {
    symbol: "☽",
    name: "Luna",
    roleKey: "tus emociones y hábitos",
    color: "#6366F1",
    description:
      "La Luna rige el mundo interior: tus emociones, instintos, memoria y la forma en que te nutres y conectas con el hogar.",
    descriptionEn:
      "The Moon governs the inner world: your emotions, instincts, memory, and how you nourish yourself and connect with home.",
  },
  {
    symbol: "☿",
    name: "Mercurio",
    roleKey: "tu mente y comunicación",
    color: "#06B6D4",
    description:
      "Mercurio gobierna el pensamiento, el lenguaje y los vínculos intelectuales. Revela cómo procesas información y te comunicas.",
    descriptionEn:
      "Mercury governs thought, language, and intellectual connections. It reveals how you process information and communicate.",
  },
  {
    symbol: "♀",
    name: "Venus",
    roleKey: "tus valores y relaciones",
    color: "#EC4899",
    description:
      "Venus muestra qué aprecias en el amor, la belleza y el dinero. Define tu capacidad de atracción y los valores que guían tus elecciones.",
    descriptionEn:
      "Venus shows what you value in love, beauty, and money. It defines your capacity for attraction and the values guiding your choices.",
  },
  {
    symbol: "♂",
    name: "Marte",
    roleKey: "tu energía y acción",
    color: "#EF4444",
    description:
      "Marte es el impulso que te mueve a actuar: tu ambición, deseo, coraje y la forma en que enfrentas los conflictos.",
    descriptionEn:
      "Mars is the drive that moves you to act: your ambition, desire, courage, and how you face conflicts.",
  },
  {
    symbol: "♃",
    name: "Júpiter",
    roleKey: "tu expansión y optimismo",
    color: "#10B981",
    description:
      "Júpiter señala dónde encuentras abundancia, crecimiento y significado. Es el principio de expansión y búsqueda filosófica.",
    descriptionEn:
      "Jupiter shows where you find abundance, growth, and meaning. It is the principle of expansion and philosophical quest.",
  },
  {
    symbol: "♄",
    name: "Saturno",
    roleKey: "tu estructura y limitaciones",
    color: "#64748B",
    description:
      "Saturno representa las lecciones kármicas, la disciplina y las estructuras que te dan forma. Es donde maduras y construyes con solidez.",
    descriptionEn:
      "Saturn represents karmic lessons, discipline, and the structures that shape you. It is where you mature and build with solidity.",
  },
];

export default function PortadaPage() {
  const router = useRouter();
  const { t, lang } = useT();

  return (
    <div className="min-h-screen bg-base">
      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 mb-6 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-xs font-mono text-blue-600">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          {t("landing.badge")}
        </div>
        <h1 className="text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
          {t("landing.hero.title_line1")}<br />
          <span className="text-blue-600">{t("landing.hero.title_line2")}</span>
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10">
          {t("landing.hero.subtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push("/nueva")}
            className="bg-blue-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-card-md w-full sm:w-auto"
          >
            {t("landing.cta.primary")}
          </button>
          <button
            onClick={() => router.push("/glosario")}
            className="border border-border text-slate-600 px-8 py-3.5 rounded-xl text-base font-medium hover:border-blue-300 hover:text-blue-600 transition-colors w-full sm:w-auto"
          >
            {t("landing.cta.secondary")}
          </button>
        </div>
      </section>

      {/* ── ¿Qué es una carta natal? ── */}
      <section className="bg-white border-y border-border py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{t("landing.what_is.title")}</h2>
          <p className="text-slate-600 leading-relaxed text-base mb-4">{t("landing.what_is.p1")}</p>
          <p className="text-slate-600 leading-relaxed text-base mb-4">{t("landing.what_is.p2")}</p>
          <p className="text-slate-500 leading-relaxed text-sm">
            {lang === "es" ? (
              <>Los cálculos utilizan <span className="font-semibold text-slate-700">Swiss Ephemeris</span>, la misma biblioteca astronómica usada por el software profesional Astro.com, con una precisión de ±0.05° en las posiciones planetarias.</>
            ) : (
              <>Calculations use <span className="font-semibold text-slate-700">Swiss Ephemeris</span>, the same astronomical library used by professional software Astro.com, with planetary position precision of ±0.05°.</>
            )}
          </p>
        </div>
      </section>

      {/* ── Planetas principales ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t("landing.planets.title")}</h2>
          <p className="text-slate-500 text-sm font-mono">{t("landing.planets.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PLANET_CARDS.map((p) => (
            <div
              key={p.name}
              className="bg-white border border-border rounded-2xl p-5 shadow-card hover:border-blue-200 hover:shadow-card-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-border font-mono"
                  style={{ color: p.color }}
                >
                  {p.symbol}
                </span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{p.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{p.roleKey}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === "en" ? p.descriptionEn : p.description}
              </p>
            </div>
          ))}

          {/* CTA card */}
          <div
            className="bg-blue-600 border border-blue-500 rounded-2xl p-5 shadow-card flex flex-col items-start justify-between cursor-pointer hover:bg-blue-700 transition-colors"
            onClick={() => router.push("/glosario")}
          >
            <div>
              <p className="font-semibold text-white text-sm mb-2">{t("landing.planets.more")}</p>
              <p className="text-xs text-blue-100 leading-relaxed">{t("landing.planets.more_desc")}</p>
            </div>
            <span className="mt-4 text-xs font-mono text-blue-200 hover:text-white transition-colors">
              {t("landing.planets.glossary_link")}
            </span>
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="bg-white border-t border-border py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "⊕",
                titleKey: "landing.features.natal.title" as const,
                descKey: "landing.features.natal.desc" as const,
              },
              {
                icon: "✦",
                titleKey: "landing.features.transits.title" as const,
                descKey: "landing.features.transits.desc" as const,
              },
              {
                icon: "☉",
                titleKey: "landing.features.solar.title" as const,
                descKey: "landing.features.solar.desc" as const,
              },
            ].map((f) => (
              <div key={f.titleKey} className="text-center">
                <div className="text-3xl mb-3 font-mono text-blue-600">{f.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-2">{t(f.titleKey)}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Geopolítica banner ── */}
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div
          onClick={() => router.push("/geopolitica")}
          className="bg-indigo-600 rounded-2xl p-8 shadow-card-md cursor-pointer hover:bg-indigo-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌍</span>
              <h3 className="font-semibold text-white text-lg">{t("geo.title")}</h3>
            </div>
            <p className="text-sm text-indigo-100 leading-relaxed max-w-xl">
              {lang === "es"
                ? "Astrología mundial: los grandes ciclos de planetas lentos de 2026–2027 y su eco en eventos históricos, mostrados en la rueda."
                : "Mundane astrology: the great slow-planet cycles of 2026–2027 and their echo in historical events, shown on the wheel."}
            </p>
          </div>
          <span className="text-sm font-mono text-white border border-indigo-400 rounded-lg px-4 py-2 shrink-0 hover:bg-indigo-500 transition-colors">
            {lang === "es" ? "Explorar →" : "Explore →"}
          </span>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="max-w-xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">{t("landing.bottom_cta.title")}</h2>
        <p className="text-slate-500 text-sm mb-8">{t("landing.bottom_cta.subtitle")}</p>
        <button
          onClick={() => router.push("/nueva")}
          className="bg-blue-600 text-white px-10 py-4 rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors shadow-card-md"
        >
          {t("landing.cta.primary")}
        </button>
      </section>
    </div>
  );
}
