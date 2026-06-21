"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import type {
  TransitResponse,
  ChartResponse,
  BirthData,
  MonthlyForecast,
  SkyPlanet,
} from "@/lib/types";
import { loadChart, loadYearTransits, saveYearTransits } from "@/lib/storage";
import { ASPECT_COLORS, IMPORTANCE_COLORS } from "@/lib/zodiac-utils";
import { generateMonthBrief, generateYearBrief } from "@/lib/brief-summary";
import type { BriefInfluence } from "@/lib/brief-summary";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { useT } from "@/lib/i18n";

const TransitZodiacWheel = dynamic(
  () => import("@/components/TransitZodiacWheel"),
  { ssr: false }
);

// ── Símbolos locales ──────────────────────────────────────────────────────────

const PLANET_SYMBOLS: Record<string, string> = {
  Sol: "☉", Luna: "☽", Mercurio: "☿", Venus: "♀", Marte: "♂",
  "Júpiter": "♃", Saturno: "♄", Urano: "♅", Neptuno: "♆", Plutón: "♇",
  "Nodo Norte": "☊", "Quirón": "⚷",
};

const ASPECT_SYMBOLS: Record<string, string> = {
  "Conjunción": "☌", "Oposición": "☍", "Cuadratura": "□",
  "Trígono": "△", "Sextil": "⚹", "Quincuncio": "⚻",
  "Sesquicuadratura": "⚼", "Semi-sextil": "⚺",
};

const PLANET_COLOR: Record<string, string> = {
  "Plutón":  "#7C3AED",
  "Neptuno": "#3B82F6",
  "Urano":   "#06B6D4",
  "Saturno": "#F59E0B",
  "Júpiter": "#10B981",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function skyDots(sky?: SkyPlanet[]): { name: string; symbol: string; longitude: number; retrograde?: boolean }[] {
  return (sky ?? []).map((p) => ({
    name:      p.name,
    symbol:    p.symbol,
    longitude: p.longitude,
    retrograde: p.retrograde,
  }));
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-mono text-sm">{label}</p>
    </div>
  );
}

function IntensityBadge({ label }: { label: "estable" | "moderado" | "intenso" }) {
  const { t } = useT();
  const styles: Record<string, string> = {
    estable:  "bg-emerald-50 text-emerald-700 border border-emerald-200",
    moderado: "bg-amber-50 text-amber-700 border border-amber-200",
    intenso:  "bg-red-50 text-red-700 border border-red-200",
  };
  const labelMap: Record<string, "transits.intensity.stable" | "transits.intensity.moderate" | "transits.intensity.intense"> = {
    estable:  "transits.intensity.stable",
    moderado: "transits.intensity.moderate",
    intenso:  "transits.intensity.intense",
  };
  return (
    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${styles[label]}`}>
      {t(labelMap[label])}
    </span>
  );
}

function InfluenceRow({ inf }: { inf: BriefInfluence }) {
  const dotColor = ASPECT_COLORS[inf.nature] ?? "#94A3B8";
  const importColor = IMPORTANCE_COLORS[inf.importance] ?? "#94A3B8";
  const sym = PLANET_SYMBOLS[inf.planet] ?? "";
  const asp = ASPECT_SYMBOLS[inf.aspect] ?? inf.aspect;

  return (
    <div className="flex flex-col gap-1 py-2 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        <span className="font-mono text-sm text-slate-800 font-medium">
          {sym} {inf.planet} {asp} {inf.natal} natal
        </span>
        {inf.retrograde && (
          <span className="text-xs font-mono text-red-500 bg-red-50 border border-red-200 px-1 rounded">
            ℞
          </span>
        )}
        <span
          className="ml-auto text-xs font-mono uppercase tracking-wide shrink-0"
          style={{ color: importColor }}
        >
          {inf.importance}
        </span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed pl-4">{inf.narrative || inf.text}</p>
    </div>
  );
}

interface MonthBriefPanelProps {
  month: MonthlyForecast;
  exactCalendar: { date: string; transit_planet: string; aspect: string; natal_planet: string }[];
}

function MonthBriefPanel({ month, exactCalendar }: MonthBriefPanelProps) {
  const { t, lang } = useT();
  const panelLocale = lang === "en" ? enUS : es;
  const brief = generateMonthBrief(month, exactCalendar, lang);
  const keyDates = exactCalendar
    .filter((e) => e.date.startsWith(month.month))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-slate-800 text-sm capitalize">{brief.monthLabel}</span>
        <IntensityBadge label={brief.intensityLabel} />
        {brief.theme && (
          <span className="text-xs text-slate-400 font-mono">{brief.theme}</span>
        )}
      </div>

      {/* Headline */}
      {brief.headline && (
        <p className="text-sm text-slate-700 leading-relaxed">{brief.headline}</p>
      )}

      {/* Influences */}
      {brief.influences.length > 0 && (
        <div>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-1">{t("transits.influences.title")}</p>
          {brief.influences.map((inf, i) => (
            <InfluenceRow key={i} inf={inf} />
          ))}
        </div>
      )}

      {/* Life areas */}
      {brief.lifeAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {brief.lifeAreas.map((area) => (
            <span
              key={area}
              className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-mono"
            >
              {area}
            </span>
          ))}
        </div>
      )}

      {/* Key dates */}
      {keyDates.length > 0 && (
        <div>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">{t("transits.key_dates.title")}</p>
          <div className="space-y-1">
            {keyDates.map((ev, i) => {
              let dateStr = ev.date;
              try {
                dateStr = format(new Date(ev.date), "d MMM", { locale: panelLocale });
              } catch { /* keep raw */ }
              const sym = PLANET_SYMBOLS[ev.transit_planet] ?? "";
              const asp = ASPECT_SYMBOLS[ev.aspect] ?? ev.aspect;
              return (
                <div key={i} className="flex items-center gap-2 text-xs font-mono text-slate-600">
                  <span className="text-slate-400 w-12 shrink-0">{dateStr}</span>
                  <span>{sym} {ev.transit_planet} {asp} {ev.natal_planet} natal</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface YearBriefPanelProps {
  data: TransitResponse;
  year: number;
}

function YearBriefPanel({ data, year }: YearBriefPanelProps) {
  const { t, lang } = useT();
  const brief = generateYearBrief(data, year, lang);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
      {/* Theme + paragraph */}
      <div>
        <span className="inline-block text-xs font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full mb-2 capitalize">
          {brief.theme}
        </span>
        <p className="text-sm text-slate-700 leading-relaxed">{brief.paragraph}</p>
        <p className="text-xs text-slate-400 font-mono mt-1">
          {t("transits.peak_month")} <span className="text-slate-600 capitalize">{brief.peakMonthLabel}</span>
        </p>
      </div>

      {/* Cycles */}
      {brief.cycles.length > 0 && (
        <div>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">{t("transits.cycles.title")}</p>
          <div className="space-y-2">
            {brief.cycles.map((c, i) => {
              const dotColor = PLANET_COLOR[c.planet] ?? "#94A3B8";
              return (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="w-2 h-2 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: dotColor }}
                  />
                  <div>
                    <p className="text-sm font-mono text-slate-800">{c.headline}</p>
                    <p className="text-xs text-slate-400">{c.window}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Opportunities & Challenges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {brief.opportunities.length > 0 && (
          <div>
            <p className="text-xs font-mono text-emerald-600 uppercase tracking-wide mb-1">{t("transits.opportunities.title")}</p>
            <ul className="space-y-1">
              {brief.opportunities.map((o, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-slate-700 leading-relaxed">
                  <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
        {brief.challenges.length > 0 && (
          <div>
            <p className="text-xs font-mono text-red-500 uppercase tracking-wide mb-1">{t("transits.challenges.title")}</p>
            <ul className="space-y-1">
              {brief.challenges.map((c, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-slate-700 leading-relaxed">
                  <span className="text-red-400 shrink-0 mt-0.5">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TransitosPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { t, lang } = useT();
  const dateLocale = lang === "en" ? enUS : es;

  const [chart, setChart]       = useState<ChartResponse | null>(null);
  const [birthData, setBirthData] = useState<BirthData | null>(null);

  const currentYear = new Date().getFullYear();
  const years = [0, 1, 2, 3, 4].map((i) => currentYear + i);

  const [selectedYear, setSelectedYear]     = useState<number>(currentYear);
  const [cache, setCache]                   = useState<Record<number, TransitResponse>>({});
  const [loadingYear, setLoadingYear]       = useState<number | null>(null);
  const [errorByYear, setErrorByYear]       = useState<Record<number, string>>({});
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>("");

  // Load chart on mount
  useEffect(() => {
    if (!id) { router.push("/nueva"); return; }
    const c = loadChart(id);
    if (!c) { router.push("/nueva"); return; }
    setChart(c.chart);
    setBirthData(c.birthData);
  }, [id, router]);

  const fetchYear = useCallback(
    async (year: number) => {
      if (!chart || !birthData) return;
      setLoadingYear(year);
      setErrorByYear((prev) => {
        const next = { ...prev };
        delete next[year];
        return next;
      });
      try {
        const res = await fetch("/api/transits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            natal_planets: chart.planets,
            start_date:    `${year}-01-01`,
            end_date:      `${year}-12-31`,
            latitude:      birthData.latitude,
            longitude:     birthData.longitude,
          }),
        });
        if (!res.ok) {
          const msg =
            res.status === 429
              ? t("transits.error.rate_limit")
              : `${t("transits.error.generic")} (${res.status})`;
          setErrorByYear((prev) => ({ ...prev, [year]: msg }));
          return;
        }
        const data: TransitResponse = await res.json();
        saveYearTransits(id, year, data);
        setCache((prev) => ({ ...prev, [year]: data }));
      } catch {
        setErrorByYear((prev) => ({
          ...prev,
          [year]: t("transits.error.network"),
        }));
      } finally {
        setLoadingYear(null);
      }
    },
    [chart, birthData, id]
  );

  const ensureYear = useCallback(
    (year: number) => {
      if (cache[year]) return;
      const stored = loadYearTransits(id, year);
      if (stored) {
        setCache((prev) => ({ ...prev, [year]: stored }));
        return;
      }
      if (chart && birthData) {
        void fetchYear(year);
      }
    },
    [cache, id, chart, birthData, fetchYear]
  );

  // Ensure the selected year is loaded (also covers the current year on mount,
  // since selectedYear defaults to currentYear). Single source of truth — avoids
  // double-fetching the same year.
  useEffect(() => {
    if (chart && birthData) {
      ensureYear(selectedYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, chart, birthData]);

  // Default selected month for current year
  useEffect(() => {
    const data = cache[currentYear];
    if (!data || selectedMonthKey) return;
    const nowMonth = `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const sorted = [...data.timeline].sort((a, b) => a.month.localeCompare(b.month));
    const exists = sorted.some((m) => m.month === nowMonth);
    setSelectedMonthKey(exists ? nowMonth : (sorted[0]?.month ?? ""));
  }, [cache, currentYear, selectedMonthKey]);

  // ── Render guards ────────────────────────────────────────────────────────────

  if (!chart || !birthData) {
    return <Spinner label={t("transits.loading")} />;
  }

  const data = cache[selectedYear] ?? null;
  const orderedTimeline = data ? [...data.timeline].sort((a, b) => a.month.localeCompare(b.month)) : [];
  const isLoading = loadingYear === selectedYear && !data;
  const yearError = errorByYear[selectedYear];

  // For current-year month selector
  const selectedMonth: MonthlyForecast | null =
    selectedYear === currentYear && data
      ? orderedTimeline.find((m) => m.month === selectedMonthKey) ?? orderedTimeline[0] ?? null
      : null;

  // Mid-year snapshot for future years
  const midYearMonth =
    data
      ? orderedTimeline.find((m) => m.month.endsWith("-07")) ??
        orderedTimeline[Math.floor(orderedTimeline.length / 2)] ??
        null
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">
            {t("transits.title")}
          </h1>
          <p className="text-slate-500 font-mono text-sm mt-1">{chart.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push("/")}
            className="border border-slate-200 text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-blue-300 hover:text-blue-600 transition-colors font-mono"
          >
            {t("transits.nav.home")}
          </button>
          <button
            onClick={() => router.push("/nueva")}
            className="border border-slate-200 text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-blue-300 hover:text-blue-600 transition-colors font-mono"
          >
            {t("transits.nav.new")}
          </button>
          <button
            onClick={() => router.push(`/carta/${id}`)}
            className="border border-slate-200 text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-blue-300 hover:text-blue-600 transition-colors font-mono"
          >
            {t("transits.nav.natal")}
          </button>
        </div>
      </div>

      {/* ── Year tabs ── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {years.map((year) => (
          <button
            key={year}
            onClick={() => setSelectedYear(year)}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-colors ${
              selectedYear === year
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300"
            }`}
          >
            {year === currentYear ? `${year} · ${t("transits.current_year")}` : year}
          </button>
        ))}
      </div>

      {/* ── Content area ── */}
      {isLoading ? (
        <Spinner label={`${t("transits.calculating")} ${selectedYear}…`} />
      ) : yearError && !data ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm text-red-700">{yearError}</p>
          <button
            onClick={() => void fetchYear(selectedYear)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors font-mono"
          >
            {t("transits.retry")}
          </button>
        </div>
      ) : data ? (
        selectedYear === currentYear ? (
          /* ── CURRENT YEAR VIEW ── */
          <div className="space-y-6">
            {/* Month chips */}
            <div className="flex flex-wrap gap-2">
              {orderedTimeline.map((m) => {
                let label = m.month;
                try {
                  label = capitalizeFirst(
                    format(new Date(`${m.month}-01`), "MMM", { locale: dateLocale })
                  );
                } catch { /* keep raw */ }
                return (
                  <button
                    key={m.month}
                    onClick={() => setSelectedMonthKey(m.month)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${
                      selectedMonthKey === m.month
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Two-column layout */}
            {selectedMonth && (
              <div className="xl:grid xl:grid-cols-[1fr_360px] xl:gap-8">
                {/* LEFT — wheel */}
                <div className="space-y-3">
                  <TransitZodiacWheel
                    natalPlanets={chart.planets}
                    natalHouses={chart.houses}
                    ascendant={chart.ascendant}
                    midheaven={chart.midheaven}
                    natalAspects={chart.aspects}
                    transitPlanets={skyDots(selectedMonth.sky)}
                    transitEvents={selectedMonth.transits_active}
                  />
                  <p className="text-xs text-slate-400 font-mono text-center">
                    {capitalizeFirst(
                      format(new Date(`${selectedMonth.month}-01`), "MMMM yyyy", { locale: dateLocale })
                    )}{" "}
                    · {t("transits.wheel.caption")}
                  </p>
                </div>

                {/* RIGHT — month brief */}
                <div className="mt-6 xl:mt-0">
                  <MonthBriefPanel
                    month={selectedMonth}
                    exactCalendar={data.exact_aspects_calendar}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── FUTURE YEAR VIEW ── */
          <div className="space-y-6">
            <YearBriefPanel data={data} year={selectedYear} />

            {/* Mid-year wheel snapshot */}
            {midYearMonth && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">
                  {t("transits.wheel.midyear")} {selectedYear}
                </p>
                <TransitZodiacWheel
                  natalPlanets={chart.planets}
                  natalHouses={chart.houses}
                  ascendant={chart.ascendant}
                  midheaven={chart.midheaven}
                  natalAspects={chart.aspects}
                  transitPlanets={skyDots(midYearMonth.sky)}
                  transitEvents={midYearMonth.transits_active}
                />
                <p className="text-xs text-slate-400 font-mono text-center">
                  {t("transits.wheel.midyear_caption")}
                </p>
              </div>
            )}
          </div>
        )
      ) : null}
    </div>
  );
}
