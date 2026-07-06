"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import type { MundaneResponse, MundaneConfiguration, ChartResponse, MundaneAnalog, CountryInfo, NatalImpact } from "@/lib/types";
import { listCharts, loadChart, saveMundane, loadMundane, type SavedChartMeta } from "@/lib/storage";
import { useT } from "@/lib/i18n";
import {
  getConfigNarrative,
  getEventNarrative,
  getThemeLabel,
  getNationalImpactReading,
  BIBLIOGRAPHY,
  type Lang,
} from "@/lib/mundane-corpus";
import { generateMundaneReading, buildImpactInterpretationKey } from "@/lib/mundane-interpretation";
import { getInterpretation } from "@/lib/interpretation-engine";
import { ASPECT_SYMBOL, ASPECT_LINE_COLOR, INGRESS_COLOR } from "@/components/MundaneWheel";
import { SIGN_NAMES, SIGN_SYMBOLS } from "@/lib/wheel-geometry";
import { parseLocalDate } from "@/lib/date-utils";

const MundaneWheel = dynamic(() => import("@/components/MundaneWheel"), { ssr: false });
const MundaneTimelineChart = dynamic(() => import("@/components/MundaneTimelineChart"), { ssr: false });
const CyclicIndexChart = dynamic(() => import("@/components/CyclicIndexChart"), { ssr: false });

type Mode = "world" | "natal" | "country";
type FilterMode = "majors" | "all" | "precedents" | "triggers";
type CompareMode = "overlay" | "era";

// Disparadores rápidos de Marte: mismo rojo que MundaneWheel.BODY_COLORS.Marte
const TRIGGER_COLOR = "#EF4444";

const YEARS = [2026, 2027];
const MAJOR_ASPECTS = new Set(["Conjunción", "Oposición", "Cuadratura"]);
const ASPECT_ANGLES: Record<string, number> = {
  Conjunción: 0, Sextil: 60, Cuadratura: 90, Trígono: 120, Oposición: 180,
};

function angularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Orbe del par protagonista de una config de aspecto, dado un cielo (actual o de época). */
function pairOrb(sky: { name: string; longitude: number }[], bodies: string[], aspect: string | null): number | null {
  if (!aspect || bodies.length !== 2) return null;
  const a = sky.find((s) => s.name === bodies[0]);
  const b = sky.find((s) => s.name === bodies[1]);
  if (!a || !b) return null;
  const angle = angularDistance(a.longitude, b.longitude);
  const exact = ASPECT_ANGLES[aspect];
  if (exact === undefined) return null;
  return Math.abs(angle - exact);
}

/** Glifos de cuerpo(s) + símbolo de aspecto/ingreso, para tarjetas y timeline. */
function configGlyphs(c: MundaneConfiguration): { text: string; color: string } {
  if (c.kind === "eclipse") {
    return { text: "◐", color: "#0F172A" };
  }
  if ((c.kind === "aspect" || c.kind === "trigger") && c.bodies.length === 2) {
    const symbolA = c.sky.find((s) => s.name === c.bodies[0])?.symbol ?? "";
    const symbolB = c.sky.find((s) => s.name === c.bodies[1])?.symbol ?? "";
    const color = c.kind === "trigger" ? TRIGGER_COLOR : (c.aspect && ASPECT_LINE_COLOR[c.aspect]) || "#334155";
    return { text: `${symbolA} ${c.aspect ? ASPECT_SYMBOL[c.aspect] ?? "" : ""} ${symbolB}`, color };
  }
  if (c.kind === "ingress" && c.bodies.length === 1) {
    const symbolBody = c.sky.find((s) => s.name === c.bodies[0])?.symbol ?? "";
    const signIdx = c.sign ? SIGN_NAMES.indexOf(c.sign as (typeof SIGN_NAMES)[number]) : -1;
    const signSymbol = signIdx >= 0 ? SIGN_SYMBOLS[signIdx] : "";
    return { text: `${symbolBody} → ${signSymbol}`, color: INGRESS_COLOR };
  }
  return { text: "", color: "#334155" };
}

/** Formatea una fecha "YYYY-MM-DD" con el locale dado; cae al string original si falla. */
function formatGeoDate(dateStr: string, dateLocale: Locale): string {
  try {
    return format(parseLocalDate(dateStr), "d MMM yyyy", { locale: dateLocale });
  } catch {
    return dateStr;
  }
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-mono text-sm">{label}</p>
    </div>
  );
}

// useSearchParams exige un límite de <Suspense> en el build estático de Next;
// el default export solo envuelve el contenido real.
export default function GeopoliticaPage() {
  return (
    <Suspense fallback={null}>
      <GeopoliticaContent />
    </Suspense>
  );
}

function GeopoliticaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useT();
  const L = lang as Lang;
  const dateLocale = lang === "en" ? enUS : es;

  // Deep-links: ?year=&mode=&chart=&config= — el estado inicial usa siempre
  // los valores neutros por defecto (nunca lee searchParams en el
  // inicializador de useState) para que el primer render del cliente
  // coincida con el HTML del servidor; los params entrantes se aplican en un
  // useEffect de montaje (ver más abajo), evitando el error de hidratación.
  const [mode, setMode] = useState<Mode>("world");
  const [year, setYear] = useState<number>(YEARS[0]);
  const pendingConfigRef = useRef<string | null>(null);
  // Se vuelve true tras aplicar los searchParams entrantes una vez montado;
  // hasta entonces, el efecto de sincronización de URL no debe ejecutarse
  // (pisaría la URL con los valores neutros antes de leer los reales).
  const [paramsApplied, setParamsApplied] = useState(false);

  // Natal mode
  const [charts, setCharts] = useState<SavedChartMeta[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string>("");

  // Country mode ("impacto por país" — cartas nacionales, tradición de Campion)
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    const m: Mode = modeParam === "natal" ? "natal" : modeParam === "country" ? "country" : "world";
    const y = Number(searchParams.get("year"));
    const yr = YEARS.includes(y) ? y : YEARS[0];
    const chart = searchParams.get("chart") ?? "";
    const country = searchParams.get("country") ?? "";
    pendingConfigRef.current = searchParams.get("config");
    setMode(m);
    setYear(yr);
    setSelectedChartId(chart);
    setSelectedCountry(country);
    setParamsApplied(true);
    // Solo al montar: los searchParams entrantes se aplican una única vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carga la lista de países una vez, al entrar en el modo "country" (fuente
  // única de verdad: GET /api/mundane/countries). Fallo silencioso — si no
  // carga, la UI se queda mostrando el estado "cargando países".
  useEffect(() => {
    if (mode !== "country" || countries.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/mundane/countries");
        if (res.ok && !cancelled) {
          const list: CountryInfo[] = await res.json();
          setCountries(list);
        }
      } catch {
        /* se deja countries=[] — reintenta al re-entrar al modo */
      }
    })();
    return () => { cancelled = true; };
  }, [mode, countries.length]);

  function countryName(id: string): string {
    const c = countries.find((x) => x.id === id);
    if (!c) return id;
    return lang === "en" ? c.name_en : c.name_es;
  }

  // La carta natal se deriva SÍNCRONAMENTE del id seleccionado (no como estado con
  // retraso), para que la petición y la clave de caché siempre correspondan a la
  // misma carta y no se guarde la respuesta de una persona bajo la clave de otra.
  const natalChart = useMemo<ChartResponse | null>(() => {
    if (mode === "natal" && selectedChartId) {
      return loadChart(selectedChartId)?.chart ?? null;
    }
    return null;
  }, [mode, selectedChartId]);

  // Data
  const [cache, setCache] = useState<Record<string, MundaneResponse>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedConfigId, setSelectedConfigId] = useState<string>("");
  const [compareEra, setCompareEra] = useState<string | null>(null); // analog id being compared
  const [compareMode, setCompareMode] = useState<CompareMode>("era"); // cómo se muestra compareEra
  const [filterMode, setFilterMode] = useState<FilterMode>("majors");
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [showAllConfigs, setShowAllConfigs] = useState(false); // móvil: "Ver todas (N)"

  useEffect(() => {
    setCharts(listCharts());
  }, []);

  // id de caché: la carta guardada (natal), el país (country) o "world".
  const cacheId = mode === "natal" ? selectedChartId : mode === "country" ? selectedCountry : "world";
  const cacheKey = useMemo(
    () => `${mode}_${year}_${cacheId}`,
    [mode, year, cacheId],
  );

  const fetchData = useCallback(async () => {
    if (mode === "natal" && !natalChart) return;
    if (mode === "country" && !selectedCountry) return;
    setLoading(true);
    setError("");

    const body: Record<string, unknown> = {
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
    };
    if (mode === "natal" && natalChart) body.natal_planets = natalChart.planets;
    if (mode === "country" && selectedCountry) body.country = selectedCountry;

    // El backend (Render free tier) puede estar hibernando: la primera petición
    // tarda en despertar. Reintentamos una vez tras un fallo de cold start (503/502
    // o error de red) mostrando un aviso, ya que en caliente responde en ~2s.
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch("/api/mundane", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (res.ok) {
            const data: MundaneResponse = await res.json();
            setCache((prev) => ({ ...prev, [cacheKey]: data }));
            saveMundane(year, mode, cacheId || null, data);
            setError("");
            return;
          }
          if ((res.status === 503 || res.status === 502) && attempt === 0) {
            setError(t("geo.error.waking"));
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          setError(res.status === 429 ? t("geo.error.rate_limit") : `${t("geo.error.generic")} (${res.status})`);
          return;
        } catch {
          if (attempt === 0) {
            setError(t("geo.error.waking"));
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          setError(t("geo.error.network"));
          return;
        }
      }
    } finally {
      setLoading(false);
    }
  }, [mode, year, natalChart, cacheKey, t, cacheId]);

  useEffect(() => {
    if (cache[cacheKey]) return;
    if (mode === "natal" && !natalChart) return;
    if (mode === "country" && !selectedCountry) return;

    // Caché persistente (localStorage) — evita re-pedir al backend (Render free
    // tier, cold start ~30s) datos ya calculados en una sesión anterior. El
    // botón "Reintentar" del panel de error llama a fetchData() directamente,
    // sin pasar por aquí, así que siempre salta esta caché.
    const cached = loadMundane(year, mode, cacheId || null);
    if (cached) {
      setCache((prev) => ({ ...prev, [cacheKey]: cached }));
      return;
    }

    if (mode === "world") void fetchData();
    if (mode === "natal" && natalChart) void fetchData();
    if (mode === "country" && selectedCountry) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, mode, natalChart, year, cacheId, selectedCountry]);

  const data = cache[cacheKey] ?? null;
  const configs = data?.configurations ?? [];

  // Filtro: "Mayores" (default) = ingresos + conjunción/oposición/cuadratura de los
  // lentos + disparadores de Marte (como marcadores menores); "Todos"; "Con
  // precedentes"; "Disparadores" = solo los disparadores rápidos de Marte.
  const filteredConfigs = useMemo(() => {
    if (filterMode === "all") return configs;
    if (filterMode === "triggers") return configs.filter((c) => c.kind === "trigger");
    if (filterMode === "precedents") return configs.filter((c) => c.analogs.length > 0);
    return configs.filter(
      (c) =>
        c.kind === "trigger" ||
        c.kind === "ingress" ||
        c.kind === "eclipse" ||
        (c.aspect !== null && MAJOR_ASPECTS.has(c.aspect)),
    );
  }, [configs, filterMode]);

  // Lista de tarjetas (columna izquierda): en el filtro "Mayores" se ocultan
  // los disparadores de Marte (siguen visibles en el timeline, solo como
  // marcadores menores) para no ahogar los ciclos lentos entre las tarjetas
  // (B1). En "Todos"/"Con precedentes"/"Disparadores" se mantienen.
  const cardConfigs = useMemo(
    () => (filterMode === "majors" ? filteredConfigs.filter((c) => c.kind !== "trigger") : filteredConfigs),
    [filteredConfigs, filterMode],
  );

  // Al cambiar de filtro, la lista móvil vuelve a mostrar solo las primeras N.
  useEffect(() => {
    setShowAllConfigs(false);
  }, [filterMode]);

  // Default selected config = first con análogos dentro del filtro activo, si no el primero
  useEffect(() => {
    if (!data) return;
    // Deep-link: si la URL traía ?config= y existe en los datos, priorízala
    // (y amplía el filtro si el filtro por defecto la ocultaría).
    const pending = pendingConfigRef.current;
    if (pending && configs.some((c) => c.id === pending)) {
      pendingConfigRef.current = null;
      setSelectedConfigId(pending);
      if (!filteredConfigs.some((c) => c.id === pending)) setFilterMode("all");
      setCompareEra(null);
      setCompareMode("era");
      return;
    }
    setSelectedConfigId((prev) => {
      if (prev && filteredConfigs.some((c) => c.id === prev)) return prev;
      const withAnalog = filteredConfigs.find((c) => c.analogs.length > 0);
      return withAnalog?.id ?? filteredConfigs[0]?.id ?? "";
    });
    setCompareEra(null);
    setCompareMode("era");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filterMode]);

  // Mantiene la URL sincronizada (replace, sin recargar) para compartir enlaces.
  // Guardado por `paramsApplied`: si corriera antes de aplicar los searchParams
  // entrantes, pisaría la URL con los valores neutros por defecto.
  useEffect(() => {
    if (!paramsApplied) return;
    const params = new URLSearchParams();
    params.set("year", String(year));
    if (mode === "natal") {
      params.set("mode", "natal");
      if (selectedChartId) params.set("chart", selectedChartId);
    } else if (mode === "country") {
      params.set("mode", "country");
      if (selectedCountry) params.set("country", selectedCountry);
    }
    if (selectedConfigId) params.set("config", selectedConfigId);
    router.replace(`/geopolitica?${params.toString()}`, { scroll: false });
  }, [paramsApplied, year, mode, selectedChartId, selectedCountry, selectedConfigId, router]);

  // Meses del índice cíclico que contienen configuraciones mayores → marcadores
  // clicables sobre la línea del índice (ata la gráfica de Barbault al timeline).
  const indexMarkers = useMemo(() => {
    const map: Record<string, { id: string; title: string }[]> = {};
    for (const c of configs) {
      const isMajor = c.kind === "ingress" || (c.aspect !== null && MAJOR_ASPECTS.has(c.aspect));
      if (!isMajor) continue;
      const m = c.exact_date.slice(0, 7);
      (map[m] ??= []).push({ id: c.id, title: getConfigNarrative(c, L).title });
    }
    return map;
  }, [configs, L]);

  const selectedConfig: MundaneConfiguration | null =
    configs.find((c) => c.id === selectedConfigId) ?? null;

  // Disparadores: la configuración lenta (no-trigger) más cercana en el tiempo,
  // para que la lectura pueda mencionar genéricamente sobre qué ciclo de fondo actúa.
  const nearbySlowConfig = useMemo(() => {
    if (!selectedConfig || selectedConfig.kind !== "trigger") return null;
    const targetMs = parseLocalDate(selectedConfig.exact_date).getTime();
    let best: MundaneConfiguration | null = null;
    let bestDist = Infinity;
    for (const c of configs) {
      if (c.kind === "trigger" || c.kind === "eclipse") continue;
      const dist = Math.abs(parseLocalDate(c.exact_date).getTime() - targetMs);
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    }
    const maxDistMs = 45 * 24 * 60 * 60 * 1000;
    return best && bestDist <= maxDistMs ? best : null;
  }, [selectedConfig, configs]);

  const comparedAnalog = selectedConfig?.analogs.find((a) => a.id === compareEra) ?? null;

  function selectEra(id: string) {
    setCompareEra(id);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">{t("geo.title")}</h1>
        <p className="text-slate-500 font-mono text-sm mt-1">{t("geo.subtitle")}</p>
      </div>

      {/* Disclaimer — compacto, expandible al texto completo (B6) */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-6">
        <p className="text-xs text-amber-800 leading-relaxed">
          ⓘ {disclaimerOpen ? t("geo.disclaimer") : t("geo.disclaimer_short")}{" "}
          <button
            type="button"
            onClick={() => setDisclaimerOpen((v) => !v)}
            className="text-amber-900 underline underline-offset-2 hover:text-amber-950 font-medium"
          >
            {disclaimerOpen ? t("geo.disclaimer_less") : t("geo.disclaimer_more")}
          </button>
        </p>
      </div>

      {/* Mode buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setMode("world")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === "world" ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
        >🌍 {t("geo.mode.world")}</button>
        <button
          onClick={() => setMode("natal")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === "natal" ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
        >⊕ {t("geo.mode.natal")}</button>
        <button
          onClick={() => setMode("country")}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === "country" ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
        >🏳️ {t("geo.mode.country")}</button>
      </div>

      {/* Natal chart selector */}
      {mode === "natal" && (
        <div className="mb-6">
          {charts.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center">
              <p className="text-sm text-slate-600">{t("geo.no_charts")}</p>
              <button onClick={() => router.push("/nueva")} className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors font-mono">{t("geo.no_charts_hint")}</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">{t("geo.select_chart")}</span>
              {charts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedChartId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${selectedChartId === c.id ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
                >{c.name}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Country selector (modo "impacto por país") */}
      {mode === "country" && (
        <div className="mb-6 space-y-2">
          {countries.length === 0 ? (
            <p className="text-sm text-slate-400 font-mono">{t("geo.country.loading")}</p>
          ) : (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">{t("geo.country.select")}</span>
              {countries.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCountry(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${selectedCountry === c.id ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
                >{lang === "en" ? c.name_en : c.name_es}</button>
              ))}
            </div>
          )}
          <p className="text-[11px] text-slate-400 font-mono">{t("geo.country.method_note")}</p>
        </div>
      )}

      {/* Year tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-colors ${year === y ? "bg-indigo-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
          >{y}</button>
        ))}
      </div>

      {/* Content */}
      {mode === "natal" && !natalChart ? (
        <p className="text-slate-400 font-mono text-sm text-center py-12">{t("geo.select_chart")}</p>
      ) : mode === "country" && !selectedCountry ? (
        <p className="text-slate-400 font-mono text-sm text-center py-12">{t("geo.country.select")}</p>
      ) : loading ? (
        <Spinner label={`${t("geo.calculating")} ${year}…`} />
      ) : error && !data ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => void fetchData()} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors font-mono">{t("geo.retry")}</button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Cronología del año — el corazón de la página, primera pantalla (B5) */}
          <MundaneTimelineChart
            configs={filteredConfigs}
            year={year}
            selectedId={selectedConfigId}
            onSelect={(id) => { setSelectedConfigId(id); setCompareEra(null); }}
            lang={L}
          />

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">{t("geo.configs.title")}</span>
            {([
              ["majors", "geo.filter.majors"],
              ["all", "geo.filter.all"],
              ["precedents", "geo.filter.with_precedents"],
              ["triggers", "geo.filter.triggers"],
            ] as [FilterMode, "geo.filter.majors" | "geo.filter.all" | "geo.filter.with_precedents" | "geo.filter.triggers"][]).map(([fm, key]) => (
              <button
                key={fm}
                onClick={() => setFilterMode(fm)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${filterMode === fm ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
              >{t(key)}</button>
            ))}
          </div>

          <div className="xl:grid xl:grid-cols-[300px_1fr] xl:gap-8">
            {/* LEFT — config list. Contenida (max-h + scroll) para que la página no
                crezca con el número de configuraciones; en móvil solo se ven las
                primeras 5 + "Ver todas (N)" (B2). */}
            <div className="mb-6 xl:mb-0">
              <div className="space-y-2 xl:max-h-[70vh] xl:overflow-y-auto xl:sticky xl:top-20 xl:pr-1">
                {cardConfigs.map((c, idx) => {
                  const nar = getConfigNarrative(c, L);
                  const glyphs = configGlyphs(c);
                  let dateStr = c.exact_date;
                  try { dateStr = format(parseLocalDate(c.exact_date), "d MMM yyyy", { locale: dateLocale }); } catch { /* keep */ }
                  const active = c.id === selectedConfigId;
                  const hideOnMobile = !showAllConfigs && idx >= 5;

                  // Disparadores: tarjeta compacta de una sola línea (B1) — solo
                  // aparecen aquí en los filtros "Todos" y "Disparadores".
                  if (c.kind === "trigger") {
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedConfigId(c.id); setCompareEra(null); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-2 ${active ? "bg-red-50 border-red-200" : "bg-white border-slate-200 hover:border-red-200"} ${hideOnMobile ? "hidden xl:flex" : ""}`}
                      >
                        <span className="font-mono text-xs shrink-0" style={{ color: glyphs.color }}>{glyphs.text}</span>
                        <span className="text-xs text-slate-700 truncate flex-1">{nar.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{dateStr}</span>
                        <span className="text-[9px] font-mono text-red-500 bg-red-50 px-1 py-0.5 rounded-full shrink-0">{t("geo.trigger.badge")}</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedConfigId(c.id); setCompareEra(null); }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${active ? "bg-indigo-50 border-indigo-300" : "bg-white border-slate-200 hover:border-indigo-200"} ${hideOnMobile ? "hidden xl:block" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                          <span className="font-mono text-xs" style={{ color: glyphs.color }}>{glyphs.text}</span>
                          {nar.title}
                        </span>
                        {c.analogs.length > 0 && (
                          <span className="text-[10px] font-mono text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded-full shrink-0">{c.analogs.length}★</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {dateStr}
                        {c.kind === "eclipse" && c.eclipse_subtype && (
                          <span className="text-amber-600"> · {t(`geo.eclipse.subtype.${c.eclipse_subtype}`)}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!showAllConfigs && cardConfigs.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllConfigs(true)}
                  className="xl:hidden mt-2 w-full text-center text-xs font-mono text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-lg py-2 hover:bg-indigo-100 transition-colors"
                >
                  {t("geo.configs.show_all")} ({cardConfigs.length})
                </button>
              )}
            </div>

            {/* RIGHT — detail */}
            {selectedConfig && (() => {
              const nar = getConfigNarrative(selectedConfig, L);
              const showAnalog = comparedAnalog !== null;
              const showOverlay = showAnalog && compareMode === "overlay";
              const showEraOnly = showAnalog && compareMode === "era";
              const wheelSky = showEraOnly ? comparedAnalog!.sky : selectedConfig.sky;
              const overlaySky = showOverlay ? comparedAnalog!.sky : undefined;
              // Fecha formateada según locale para la lectura
              let readingDate = selectedConfig.exact_date;
              try {
                readingDate = format(
                  parseLocalDate(selectedConfig.exact_date),
                  lang === "es" ? "d 'de' MMMM yyyy" : "MMMM d, yyyy",
                  { locale: dateLocale },
                );
              } catch { /* keep */ }
              const configImpacts = data.natal_impacts.filter((i) => i.config_id === selectedConfig.id);
              const countryImpacts: NatalImpact[] = (data.national_impacts ?? []).filter(
                (i) => i.config_id === selectedConfig.id,
              );
              const reading = generateMundaneReading({
                config: selectedConfig,
                analogs: selectedConfig.analogs,
                natalImpacts: mode === "country" ? countryImpacts : configImpacts,
                themes: data.probable_themes,
                year,
                natalMode: mode === "natal",
                countryMode: mode === "country",
                countryName: mode === "country" ? countryName(selectedCountry) : undefined,
                nationalChartNote: data.national_chart_note,
                dateLabel: readingDate,
                lang: L,
                nearbySlowConfig,
              });

              const orbNow = pairOrb(selectedConfig.sky, selectedConfig.bodies, selectedConfig.aspect);
              const orbEra = showAnalog ? pairOrb(comparedAnalog!.sky, selectedConfig.bodies, selectedConfig.aspect) : null;

              return (
                <div className="space-y-5">
                  {/* Title */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-lg text-slate-900">{nar.title}</h2>
                    {nar.theme && <span className="text-xs font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">{nar.theme}</span>}
                    {selectedConfig.kind === "eclipse" && selectedConfig.eclipse_subtype && (
                      <span className="text-xs font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {t(`geo.eclipse.subtype.${selectedConfig.eclipse_subtype}`)}
                      </span>
                    )}
                  </div>

                  {/* Eco histórico (mini-strip) — los disparadores no tienen precedentes,
                      recurren cada ~2 años y se leen por arquetipo. */}
                  {selectedConfig.kind === "trigger" ? (
                    <p className="text-xs text-slate-400 font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      {t("geo.trigger.recurrence_note")}
                    </p>
                  ) : selectedConfig.analogs.length > 0 && (
                    <MundaneEchoStrip
                      analogs={selectedConfig.analogs}
                      year={year}
                      activeId={compareEra}
                      onSelect={(id) => { setCompareEra(id); }}
                      lang={L}
                    />
                  )}

                  {/* Era compare: selector de época + modo de comparación (3 estados) */}
                  {selectedConfig.analogs.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">{t("geo.compare")}</span>
                        <button
                          onClick={() => setCompareEra(null)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${!showAnalog ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
                        >{year}</button>
                        <button
                          onClick={() => { setCompareMode("overlay"); if (!compareEra) selectEra(selectedConfig.analogs[0].id); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${showOverlay ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
                        >{t("geo.compare.overlay")}</button>
                        <button
                          onClick={() => { setCompareMode("era"); if (!compareEra) selectEra(selectedConfig.analogs[0].id); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${showEraOnly ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
                        >{t("geo.compare.era_only")}</button>
                      </div>
                      {showAnalog && (
                        <div className="flex flex-wrap gap-2 items-center">
                          {selectedConfig.analogs.map((a) => {
                            const en = getEventNarrative(a.id, L);
                            return (
                              <button
                                key={a.id}
                                onClick={() => setCompareEra(a.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${compareEra === a.id ? "bg-indigo-100 border border-indigo-300 text-indigo-700" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
                              >
                                {en.title} · {a.date.slice(0, 4)}
                                {a.match_type === "phase" && a.event_aspect && (
                                  <span className="text-slate-400"> ({t("geo.analogs.phase_prefix")}: {a.event_aspect})</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Wheel (izquierda) + Lectura (derecha) */}
                  <div className="xl:grid xl:grid-cols-[1fr_360px] xl:gap-6">
                    <div className="space-y-2">
                      <MundaneWheel
                        sky={wheelSky}
                        highlightBodies={
                          (selectedConfig.kind === "aspect" || selectedConfig.kind === "trigger" || selectedConfig.kind === "eclipse")
                            ? selectedConfig.bodies
                            : undefined
                        }
                        highlightAspect={
                          selectedConfig.kind === "eclipse"
                            ? (selectedConfig.eclipse_type === "lunar" ? "Oposición" : "Conjunción")
                            : selectedConfig.aspect
                        }
                        highlightSign={selectedConfig.kind === "ingress" ? selectedConfig.sign : undefined}
                        natalPlanets={
                          showAnalog
                            ? undefined
                            : mode === "natal"
                              ? natalChart?.planets
                              : mode === "country"
                                ? data.national_planets
                                : undefined
                        }
                        overlaySky={overlaySky}
                      />
                      <p className="text-xs text-slate-400 font-mono text-center">
                        {showOverlay
                          ? (orbNow !== null && orbEra !== null
                            ? `${t("geo.compare.orb_now")}: ${orbNow.toFixed(1)}° · ${t("geo.compare.orb_era")} (${comparedAnalog!.date.slice(0, 4)}): ${orbEra.toFixed(1)}°`
                            : `${getEventNarrative(comparedAnalog!.id, L).title} · ${comparedAnalog!.date}`)
                          : showEraOnly
                            ? `${getEventNarrative(comparedAnalog!.id, L).title} · ${comparedAnalog!.date} · ${t("geo.wheel.caption_era")}`
                            : `${selectedConfig.exact_date} · ${t("geo.wheel.caption_now")}`}
                      </p>
                      {selectedConfig.kind === "trigger" && selectedConfig.window_start && selectedConfig.window_end && (
                        <p className="text-xs text-red-500 font-mono text-center">
                          {t("geo.trigger.window_label")}: {formatGeoDate(selectedConfig.window_start, dateLocale)} – {formatGeoDate(selectedConfig.window_end, dateLocale)}
                        </p>
                      )}
                      {mode === "country" && selectedCountry && !showAnalog && (
                        <p className="text-xs text-indigo-400 font-mono text-center">
                          {t("geo.country.wheel_caption")} {countryName(selectedCountry)}
                        </p>
                      )}
                    </div>

                    {/* Lectura narrativa */}
                    <div className="mt-6 xl:mt-0">
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 xl:sticky xl:top-20">
                        <p className="text-xs font-mono text-indigo-500 uppercase tracking-wide">{t("geo.reading.title")}</p>
                        {reading.paragraphs.map((p, i) => (
                          <p key={i} className="text-sm text-slate-700 leading-relaxed">{p}</p>
                        ))}
                        {reading.natalNote && (
                          <p className="text-sm text-slate-900 leading-relaxed bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                            {reading.natalNote}
                          </p>
                        )}
                        {nar.source && (
                          <p className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                            {t("geo.source_label")}: {nar.source}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Analog details */}
                  {showAnalog && (() => {
                    const en = getEventNarrative(comparedAnalog!.id, L);
                    return (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-800">{en.title}</h3>
                          <span className="text-xs font-mono text-slate-400">{comparedAnalog!.region}</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{en.description}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {comparedAnalog!.tags.map((tg) => (
                            <span key={tg} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">{getThemeLabel(tg, L)}</span>
                          ))}
                        </div>
                        {en.source && <p className="text-[11px] text-slate-400 font-mono pt-1">{en.source}</p>}
                      </div>
                    );
                  })()}

                  {/* Historical analogs list — oculto para disparadores y eclipses (no tienen precedentes en este corpus) */}
                  {!showAnalog && selectedConfig.kind !== "trigger" && selectedConfig.kind !== "eclipse" && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5">
                      <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-3">{t("geo.analogs.title")}</p>
                      {selectedConfig.analogs.length === 0 ? (
                        <p className="text-sm text-slate-400">{t("geo.analogs.none")}</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedConfig.analogs.map((a) => {
                            const en = getEventNarrative(a.id, L);
                            return (
                              <button key={a.id} onClick={() => setCompareEra(a.id)} className="w-full text-left border-b border-slate-100 last:border-0 pb-3 last:pb-0 hover:bg-slate-50 rounded-lg px-1 transition-colors">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium text-slate-800">{en.title}</span>
                                  <span className="text-xs text-slate-400 font-mono">{a.date} · {a.region}</span>
                                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${a.match_type === "exact" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                                    {a.match_type === "exact" ? t("geo.analogs.match_exact") : t("geo.analogs.match_phase")}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                                  {en.description}
                                  {a.match_type === "phase" && a.event_aspect && (
                                    <span className="text-slate-400"> — {t("geo.analogs.phase_prefix")}: {a.event_aspect}</span>
                                  )}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Natal impacts (natal mode) */}
                  {mode === "natal" && data.natal_impacts.length > 0 && (() => {
                    const impacts = data.natal_impacts.filter((i) => i.config_id === selectedConfig.id);
                    return (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">{t("geo.natal_impacts.title")}</p>
                        {impacts.length === 0 ? (
                          <p className="text-sm text-slate-400">{t("geo.natal_impacts.none")}</p>
                        ) : (
                          <div className="space-y-1.5">
                            {impacts.map((im, i) => (
                              <NatalImpactRow key={i} impact={im} lang={L} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* National impacts (modo "impacto por país") — lectura mundialista,
                      no la personal-psicológica de interpretation-engine.ts. */}
                  {mode === "country" && (data.national_impacts?.length ?? 0) > 0 && (() => {
                    const impacts = (data.national_impacts ?? []).filter((i) => i.config_id === selectedConfig.id);
                    return (
                      <div className="bg-white border border-slate-200 rounded-2xl p-5">
                        <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">{t("geo.country.impacts.title")}</p>
                        {impacts.length === 0 ? (
                          <p className="text-sm text-slate-400">{t("geo.country.impacts.none")}</p>
                        ) : (
                          <div className="space-y-1.5">
                            {impacts.map((im, i) => (
                              <NationalImpactRow key={i} impact={im} lang={L} />
                            ))}
                          </div>
                        )}
                        {data.national_chart_note && (
                          <p className="text-[11px] text-slate-400 font-mono pt-2 mt-2 border-t border-slate-100">
                            {t("geo.country.chart_used")}: {data.national_chart_note[L]}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Puente hacia la cronología personal (bloque C) — no aplica en modo país */}
                  {mode === "natal" && selectedChartId && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 space-y-2">
                      <p className="text-sm font-semibold text-indigo-900">{t("geo.personal_cta.title")}</p>
                      <p className="text-xs text-indigo-700 leading-relaxed">{t("geo.personal_cta.body")}</p>
                      <button
                        onClick={() => router.push(`/transitos/${selectedChartId}`)}
                        className="mt-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors font-mono"
                      >
                        {t("geo.personal_cta.button")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Probable themes — sección compacta (B5) */}
          {data.probable_themes.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">{t("geo.probable_themes")}</p>
              <div className="flex flex-wrap gap-1.5">
                {data.probable_themes.map((th) => (
                  <span key={th} className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full font-mono">{getThemeLabel(th, L)}</span>
                ))}
              </div>
            </div>
          )}

          {/* Cyclic index (Barbault) — colapsable, no compite con la cronología (B4/B5) */}
          {data.cyclic_index.length > 0 && (
            <CyclicIndexChart
              data={data.cyclic_index}
              lang={L}
              markers={indexMarkers}
              onSelectConfig={(id) => {
                setSelectedConfigId(id);
                setCompareEra(null);
                if (!filteredConfigs.some((c) => c.id === id)) setFilterMode("all");
              }}
            />
          )}

          {/* Bibliography */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-2">{t("geo.bibliography.title")}</p>
            <ul className="space-y-1">
              {BIBLIOGRAPHY.map((b, i) => (
                <li key={i} className="text-xs text-slate-500 leading-relaxed">• {b[L]}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Fila de impacto natal con interpretación reutilizada del motor existente ──
// Construye "{cuerpo}_{aspecto}_{planeta natal}" y busca en interpretation-engine.ts
// (las ~270 interpretaciones ya escritas para tránsitos natales normales). Si no
// existe la clave, la fila se degrada silenciosamente al formato simple anterior.
function NatalImpactRow({ impact, lang }: { impact: import("@/lib/types").NatalImpact; lang: Lang }) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  const interp = useMemo(() => getInterpretation(buildImpactInterpretationKey(impact), lang), [impact, lang]);

  return (
    <div className="border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
      <button
        type="button"
        onClick={() => interp && setExpanded((v) => !v)}
        className={`w-full flex items-center gap-2 text-sm font-mono text-slate-700 text-left ${interp ? "cursor-pointer" : "cursor-default"}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
        <span>{impact.body} {impact.aspect} {impact.natal_planet} natal</span>
        <span className="ml-auto text-xs text-slate-400 uppercase">{impact.importance}</span>
      </button>
      {interp && (
        <p className="text-xs text-slate-500 leading-relaxed pl-3.5 mt-0.5">
          {interp.summary}
          {expanded ? null : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="ml-1.5 text-indigo-500 hover:text-indigo-700 font-mono text-[11px]"
            >
              {t("geo.natal_impacts.expand")}
            </button>
          )}
        </p>
      )}
      {interp && expanded && (
        <div className="pl-3.5 mt-1 space-y-1">
          <p className="text-xs text-slate-600 leading-relaxed">{interp.detailed}</p>
          <p className="text-xs text-slate-400 italic leading-relaxed">{interp.advice}</p>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-indigo-500 hover:text-indigo-700 font-mono text-[11px]"
          >
            {t("geo.natal_impacts.collapse")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Fila de impacto sobre una carta NACIONAL (modo "impacto por país") ──────
// A diferencia de NatalImpactRow, NO reutiliza interpretation-engine.ts (esas
// ~270 interpretaciones son psicológico-personales); compone su propia
// lectura mundialista con getNationalImpactReading (mundane-corpus.ts).
function NationalImpactRow({ impact, lang }: { impact: NatalImpact; lang: Lang }) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  const reading = useMemo(() => getNationalImpactReading(impact, lang), [impact, lang]);

  return (
    <div className="border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 text-sm font-mono text-slate-700 text-left cursor-pointer"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
        <span>{impact.body} {impact.aspect} {impact.natal_planet} nacional</span>
        <span className="ml-auto text-xs text-slate-400 uppercase">{impact.importance}</span>
      </button>
      {expanded && (
        <p className="text-xs text-slate-500 leading-relaxed pl-3.5 mt-0.5">
          {reading}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="ml-1.5 text-indigo-500 hover:text-indigo-700 font-mono text-[11px]"
          >
            {t("geo.natal_impacts.collapse")}
          </button>
        </p>
      )}
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="pl-3.5 mt-0.5 text-indigo-500 hover:text-indigo-700 font-mono text-[11px]"
        >
          {t("geo.natal_impacts.expand")}
        </button>
      )}
    </div>
  );
}

// ── Eco histórico (mini-strip) ────────────────────────────────────────────────
// Eje horizontal ~1400→2030: un punto por análogo (relleno=exact, hueco=phase),
// año actual marcado en indigo. Hover = tooltip, click = seleccionar esa época.
const ECHO_MIN_YEAR = 1400;
const ECHO_MAX_YEAR = 2030;
const ECHO_WIDTH = 1000;
const ECHO_HEIGHT = 60;
const ECHO_MARGIN = 24;

function echoX(year: number): number {
  const clamped = Math.min(ECHO_MAX_YEAR, Math.max(ECHO_MIN_YEAR, year));
  const frac = (clamped - ECHO_MIN_YEAR) / (ECHO_MAX_YEAR - ECHO_MIN_YEAR);
  return ECHO_MARGIN + frac * (ECHO_WIDTH - 2 * ECHO_MARGIN);
}

function MundaneEchoStrip({
  analogs,
  year,
  activeId,
  onSelect,
  lang,
}: {
  analogs: MundaneAnalog[];
  year: number;
  activeId: string | null;
  onSelect: (id: string) => void;
  lang: Lang;
}) {
  const { t } = useT();
  const [tip, setTip] = useState<{ x: number; title: string; yearLabel: string } | null>(null);
  const midY = ECHO_HEIGHT / 2 + 4;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3">
      <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wide mb-1">{t("geo.echo.title")}</p>
      <svg viewBox={`0 0 ${ECHO_WIDTH} ${ECHO_HEIGHT}`} className="w-full" style={{ fontFamily: "monospace" }}>
        <line x1={ECHO_MARGIN} y1={midY} x2={ECHO_WIDTH - ECHO_MARGIN} y2={midY} stroke="#E2E8F0" strokeWidth={1} />
        {/* Año actual */}
        <line x1={echoX(year)} y1={midY - 14} x2={echoX(year)} y2={midY + 14} stroke="#4F46E5" strokeWidth={1.5} opacity={0.6} />
        <text x={echoX(year)} y={midY - 18} textAnchor="middle" fontSize={9} fill="#4F46E5" fontWeight="700" className="select-none">{year}</text>

        {analogs.map((a) => {
          const y = Number(a.date.slice(0, 4));
          const x = echoX(y);
          const isExact = a.match_type === "exact";
          const active = a.id === activeId;
          return (
            <g key={a.id} className="cursor-pointer"
              onClick={() => onSelect(a.id)}
              onMouseEnter={() => setTip({ x, title: getEventNarrative(a.id, lang).title, yearLabel: String(y) })}
              onMouseLeave={() => setTip(null)}>
              {active && <circle cx={x} cy={midY} r={8} fill="none" stroke="#4F46E5" strokeWidth={1.5} opacity={0.6} />}
              <circle cx={x} cy={midY} r={5} fill={isExact ? "#4F46E5" : "white"} stroke="#4F46E5" strokeWidth={1.5} />
            </g>
          );
        })}

        {tip && (() => {
          const tx = Math.min(Math.max(tip.x, 70), ECHO_WIDTH - 70);
          return (
            <g>
              <rect x={tx - 60} y={2} width={120} height={30} rx={4} fill="#1E293B" opacity={0.94} />
              <text x={tx} y={14} textAnchor="middle" fontSize={9} fill="white" fontWeight="600">{tip.title}</text>
              <text x={tx} y={25} textAnchor="middle" fontSize={8} fill="#94A3B8">{tip.yearLabel}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
