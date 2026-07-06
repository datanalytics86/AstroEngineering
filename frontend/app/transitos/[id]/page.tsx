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
  TransitEvent,
  RetroPeriod,
} from "@/lib/types";
import { loadChart, loadYearTransits, saveYearTransits } from "@/lib/storage";
import { postWithWakingRetry } from "@/lib/api-fetch";
import { ASPECT_COLORS, IMPORTANCE_COLORS } from "@/lib/zodiac-utils";
import { generateMonthBrief, generateYearBrief } from "@/lib/brief-summary";
import type { BriefInfluence } from "@/lib/brief-summary";
import { parseLocalDate } from "@/lib/date-utils";
import { getInterpretation, buildInterpretationKey } from "@/lib/interpretation-engine";
import { getRetroMeaning } from "@/lib/retro-meanings";
import {
  RETRO_FILTER,
  ROW_ORDER as TIMELINE_ROW_ORDER,
  PLANET_SYMBOLS,
  ASPECT_SYMBOLS,
  transitEventKey,
  retroPeriodKey,
  isRetroKey,
} from "@/lib/transit-timeline";
import { BODY_COLORS as PLANET_COLOR } from "@/components/MundaneWheel";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { useT } from "@/lib/i18n";
import ActionButton from "@/components/ActionButton";

const TransitZodiacWheel = dynamic(
  () => import("@/components/TransitZodiacWheel"),
  { ssr: false }
);
const TransitYearTimeline = dynamic(
  () => import("@/components/TransitYearTimeline"),
  { ssr: false }
);

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

function formatLocalDate(dateStr: string, locale: Locale): string {
  try {
    return format(parseLocalDate(dateStr), "d MMM yyyy", { locale });
  } catch {
    return dateStr;
  }
}

function daysBetween(a: string, b: string): number {
  const diff = parseLocalDate(b).getTime() - parseLocalDate(a).getTime();
  return Math.max(0, Math.round(diff / 86400000));
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

// ── Panel de detalle de la cronología (bloque B) ──────────────────────────────
// Al seleccionar una barra en TransitYearTimeline, muestra los días de
// influencia (enters_orb → leaves_orb) y la interpretación reutilizada del
// motor existente (~270 combinaciones); degradación silenciosa si no hay clave.
// Para bandas retrógradas usa el mini-corpus de retro-meanings.ts.
interface TransitDetailPanelProps {
  event?: TransitEvent;
  retro?: RetroPeriod;
  lang: "es" | "en";
}

function TransitDetailPanel({ event, retro, lang }: TransitDetailPanelProps) {
  const { t } = useT();
  const dateLocale = lang === "en" ? enUS : es;
  const [expanded, setExpanded] = useState(false);

  if (retro) {
    const meaning = getRetroMeaning(retro.planet, lang);
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
        <p className="text-xs font-mono text-slate-400 uppercase tracking-wide">
          {t("transits.timeline.detail.title")}
        </p>
        <h3 className="font-semibold text-slate-800 text-sm">
          {retro.symbol} {retro.planet} {t("transits.timeline.detail.retro_title")}
        </h3>
        <p className="text-sm text-slate-600 font-mono">
          {t("transits.timeline.detail.influence")}: {formatLocalDate(retro.start_date, dateLocale)} –{" "}
          {formatLocalDate(retro.end_date, dateLocale)} ({retro.days} {t("transits.timeline.detail.days")})
        </p>
        <p className="text-xs text-slate-400 font-mono">
          {t("transits.timeline.detail.retro_signs")}: {retro.start_sign} → {retro.end_sign}
        </p>
        {meaning && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <p className="text-sm text-slate-700 leading-relaxed">{meaning.meaning}</p>
            <p className="text-xs text-slate-400 italic leading-relaxed">{meaning.advice}</p>
          </div>
        )}
      </div>
    );
  }

  if (event) {
    const tSym = PLANET_SYMBOLS[event.transit_planet] ?? "";
    const aSym = ASPECT_SYMBOLS[event.aspect_name] ?? event.aspect_name;
    const nSym = PLANET_SYMBOLS[event.natal_planet] ?? "";
    const interp = getInterpretation(
      buildInterpretationKey(event.transit_planet, event.aspect_name, event.natal_planet),
      lang
    );
    const importColor = IMPORTANCE_COLORS[event.importance] ?? "#94A3B8";
    const days = daysBetween(event.enters_orb, event.leaves_orb);

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
        <p className="text-xs font-mono text-slate-400 uppercase tracking-wide">
          {t("transits.timeline.detail.title")}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-slate-800 text-sm">
            {tSym} {event.transit_planet} {aSym} {nSym} {event.natal_planet} {t("transits.timeline.natal_suffix")}
          </h3>
          {event.transit_retrograde && (
            <span className="text-xs font-mono text-red-500 bg-red-50 border border-red-200 px-1 rounded">℞</span>
          )}
          <span
            className="ml-auto text-xs font-mono uppercase tracking-wide shrink-0"
            style={{ color: importColor }}
          >
            {event.importance}
          </span>
        </div>

        <p className="text-sm text-slate-600 font-mono">
          {t("transits.timeline.detail.influence")}: {formatLocalDate(event.enters_orb, dateLocale)} –{" "}
          {formatLocalDate(event.leaves_orb, dateLocale)} ({days} {t("transits.timeline.detail.days")})
          {event.exact_date && (
            <>
              {" "}
              · {t("transits.timeline.exact")}: {formatLocalDate(event.exact_date.slice(0, 10), dateLocale)}
            </>
          )}
        </p>

        {interp && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <p className="text-sm text-slate-700 leading-relaxed">{interp.summary}</p>
            {expanded ? (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">{interp.detailed}</p>
                <p className="text-xs text-slate-400 italic leading-relaxed">{interp.advice}</p>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-blue-500 hover:text-blue-700 font-mono text-[11px]"
                >
                  {t("transits.timeline.detail.collapse")}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-blue-500 hover:text-blue-700 font-mono text-[11px]"
              >
                {t("transits.timeline.detail.expand")}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-5">
      <p className="text-sm text-slate-400">{t("transits.timeline.detail.select_hint")}</p>
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

  // Cronología anual (bloque B): vista por defecto = "timeline", con zoom por
  // astro y selección de barra para el panel de detalle.
  const [viewMode, setViewMode]       = useState<"timeline" | "month">("timeline");
  const [planetFilter, setPlanetFilter] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Al cambiar de año la selección anterior ya no aplica (otros datos).
  useEffect(() => {
    setSelectedKey(null);
    setPlanetFilter(null);
  }, [selectedYear]);

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
        const res = await postWithWakingRetry(
          "/api/transits",
          {
            natal_planets: chart.planets,
            start_date:    `${year}-01-01`,
            end_date:      `${year}-12-31`,
            latitude:      birthData.latitude,
            longitude:     birthData.longitude,
          },
          () => setErrorByYear((prev) => ({ ...prev, [year]: t("common.error.waking") })),
        );
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

  // Planetas presentes en los tránsitos del año, en orden lento→rápido — para
  // los chips de zoom de la cronología.
  const presentPlanets = data
    ? TIMELINE_ROW_ORDER.filter((p) => data.current_transits.some((tr) => tr.transit_planet === p))
    : [];
  const retroPeriods = data?.retro_periods ?? [];

  const selectedEvent: TransitEvent | undefined =
    data && selectedKey && !isRetroKey(selectedKey)
      ? data.current_transits.find((ev) => transitEventKey(ev) === selectedKey)
      : undefined;
  const selectedRetro: RetroPeriod | undefined =
    selectedKey && isRetroKey(selectedKey)
      ? retroPeriods.find((p) => retroPeriodKey(p) === selectedKey)
      : undefined;

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
          <ActionButton variant="secondary" accent="blue" onClick={() => router.push(`/carta/${id}`)}>
            {t("transits.nav.natal")}
          </ActionButton>
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
        <div className="space-y-6">
          {/* ── View toggle ── */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-4 py-2 rounded-lg text-sm font-mono transition-colors ${
                viewMode === "timeline"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300"
              }`}
            >
              {t("transits.view.toggle_timeline")}
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`px-4 py-2 rounded-lg text-sm font-mono transition-colors ${
                viewMode === "month"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300"
              }`}
            >
              {t("transits.view.toggle_month")}
            </button>
          </div>

          {viewMode === "timeline" ? (
            /* ── TIMELINE VIEW (Gantt anual, zoom por astro) ── */
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-700">
                {t("transits.timeline.title")} {selectedYear}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPlanetFilter(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${
                    planetFilter === null
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300"
                  }`}
                >
                  {t("transits.timeline.all")}
                </button>
                {presentPlanets.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlanetFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors border ${
                      planetFilter === p
                        ? "text-white border-transparent"
                        : "bg-white border-slate-200 text-slate-500 hover:border-blue-300"
                    }`}
                    style={planetFilter === p ? { backgroundColor: PLANET_COLOR[p] ?? "#334155" } : undefined}
                  >
                    {PLANET_SYMBOLS[p] ?? ""} {p}
                  </button>
                ))}
                {retroPeriods.length > 0 && (
                  <button
                    onClick={() => setPlanetFilter(RETRO_FILTER)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${
                      planetFilter === RETRO_FILTER
                        ? "bg-red-600 text-white"
                        : "bg-white border border-slate-200 text-red-500 hover:border-red-300"
                    }`}
                  >
                    {t("transits.timeline.retro_chip")}
                  </button>
                )}
              </div>

              <div className="xl:grid xl:grid-cols-[1fr_360px] xl:gap-8 xl:items-start">
                <TransitYearTimeline
                  transits={data.current_transits}
                  retroPeriods={retroPeriods}
                  year={selectedYear}
                  selectedKey={selectedKey}
                  onSelect={setSelectedKey}
                  planetFilter={planetFilter}
                  lang={lang}
                />
                <div className="mt-6 xl:mt-0 xl:sticky xl:top-6">
                  <TransitDetailPanel key={selectedKey ?? "none"} event={selectedEvent} retro={selectedRetro} lang={lang} />
                </div>
              </div>
            </div>
          ) : selectedYear === currentYear ? (
            /* ── CURRENT YEAR VIEW (por mes) ── */
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
            /* ── FUTURE YEAR VIEW (análisis anual) ── */
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
          )}
        </div>
      ) : null}
    </div>
  );
}
