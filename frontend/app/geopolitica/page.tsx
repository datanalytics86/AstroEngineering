"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import type { MundaneResponse, MundaneConfiguration, ChartResponse } from "@/lib/types";
import { listCharts, loadChart, type SavedChartMeta } from "@/lib/storage";
import { useT } from "@/lib/i18n";
import {
  getConfigNarrative,
  getEventNarrative,
  getThemeLabel,
  BIBLIOGRAPHY,
  type Lang,
} from "@/lib/mundane-corpus";

const MundaneWheel = dynamic(() => import("@/components/MundaneWheel"), { ssr: false });

type Mode = "world" | "natal";

const YEARS = [2026, 2027];

// Parsea "YYYY-MM-DD" como fecha LOCAL. `new Date("2026-02-20")` se interpreta como
// medianoche UTC y, en zonas al oeste de UTC, se muestra el día anterior. Al descomponer
// los campos evitamos el desfase de zona horaria en la fecha del evento.
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 font-mono text-sm">{label}</p>
    </div>
  );
}

export default function GeopoliticaPage() {
  const router = useRouter();
  const { t, lang } = useT();
  const L = lang as Lang;
  const dateLocale = lang === "en" ? enUS : es;

  const [mode, setMode] = useState<Mode>("world");
  const [year, setYear] = useState<number>(2026);

  // Natal mode
  const [charts, setCharts] = useState<SavedChartMeta[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string>("");

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

  useEffect(() => {
    setCharts(listCharts());
  }, []);

  const cacheKey = useMemo(
    () => `${mode}_${year}_${mode === "natal" ? selectedChartId : "world"}`,
    [mode, year, selectedChartId],
  );

  const fetchData = useCallback(async () => {
    if (mode === "natal" && !natalChart) return;
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        start_date: `${year}-01-01`,
        end_date: `${year}-12-31`,
      };
      if (mode === "natal" && natalChart) body.natal_planets = natalChart.planets;

      const res = await fetch("/api/mundane", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(res.status === 429 ? t("geo.error.rate_limit") : `${t("geo.error.generic")} (${res.status})`);
        return;
      }
      const data: MundaneResponse = await res.json();
      setCache((prev) => ({ ...prev, [cacheKey]: data }));
    } catch {
      setError(t("geo.error.network"));
    } finally {
      setLoading(false);
    }
  }, [mode, year, natalChart, cacheKey, t]);

  useEffect(() => {
    if (cache[cacheKey]) return;
    if (mode === "world") void fetchData();
    if (mode === "natal" && natalChart) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, mode, natalChart]);

  const data = cache[cacheKey] ?? null;
  const configs = data?.configurations ?? [];

  // Default selected config = first with analogs, else first
  useEffect(() => {
    if (!data) return;
    const withAnalog = configs.find((c) => c.analogs.length > 0);
    setSelectedConfigId((prev) => {
      if (prev && configs.some((c) => c.id === prev)) return prev;
      return withAnalog?.id ?? configs[0]?.id ?? "";
    });
    setCompareEra(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const selectedConfig: MundaneConfiguration | null =
    configs.find((c) => c.id === selectedConfigId) ?? null;

  const comparedAnalog = selectedConfig?.analogs.find((a) => a.id === compareEra) ?? null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">{t("geo.title")}</h1>
          <p className="text-slate-500 font-mono text-sm mt-1">{t("geo.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => router.push("/")} className="border border-slate-200 text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors font-mono">{t("nav.home")}</button>
          <button onClick={() => router.push("/nueva")} className="border border-slate-200 text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-indigo-300 hover:text-indigo-600 transition-colors font-mono">{t("nav.new_chart")}</button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
        <p className="text-xs text-amber-800 leading-relaxed">{t("geo.disclaimer")}</p>
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
      ) : loading ? (
        <Spinner label={`${t("geo.calculating")} ${year}…`} />
      ) : error && !data ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => void fetchData()} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors font-mono">{t("geo.retry")}</button>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Probable themes */}
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

          <div className="xl:grid xl:grid-cols-[300px_1fr] xl:gap-8">
            {/* LEFT — config timeline */}
            <div className="space-y-2 mb-6 xl:mb-0">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wide mb-1">{t("geo.configs.title")}</p>
              {configs.map((c) => {
                const nar = getConfigNarrative(c, L);
                let dateStr = c.exact_date;
                try { dateStr = format(parseLocalDate(c.exact_date), "d MMM yyyy", { locale: dateLocale }); } catch { /* keep */ }
                const active = c.id === selectedConfigId;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedConfigId(c.id); setCompareEra(null); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${active ? "bg-indigo-50 border-indigo-300" : "bg-white border-slate-200 hover:border-indigo-200"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800">{nar.title}</span>
                      {c.analogs.length > 0 && (
                        <span className="text-[10px] font-mono text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded-full shrink-0">{c.analogs.length}★</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{dateStr}</span>
                  </button>
                );
              })}
            </div>

            {/* RIGHT — detail */}
            {selectedConfig && (() => {
              const nar = getConfigNarrative(selectedConfig, L);
              const showAnalog = comparedAnalog !== null;
              const wheelSky = showAnalog ? comparedAnalog!.sky : selectedConfig.sky;
              return (
                <div className="space-y-5">
                  {/* Title + synthesis */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-lg text-slate-900">{nar.title}</h2>
                      {nar.theme && <span className="text-xs font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">{nar.theme}</span>}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{nar.synthesis}</p>
                  </div>

                  {/* Era compare toggle */}
                  {selectedConfig.analogs.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-wide">{t("geo.compare")}</span>
                      <button
                        onClick={() => setCompareEra(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${!showAnalog ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
                      >{year}</button>
                      {selectedConfig.analogs.map((a) => {
                        const en = getEventNarrative(a.id, L);
                        return (
                          <button
                            key={a.id}
                            onClick={() => setCompareEra(a.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${compareEra === a.id ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-indigo-300"}`}
                          >{en.title} · {a.date.slice(0, 4)}</button>
                        );
                      })}
                    </div>
                  )}

                  {/* Wheel */}
                  <div className="space-y-2">
                    <MundaneWheel
                      sky={wheelSky}
                      highlightBodies={selectedConfig.kind === "aspect" ? selectedConfig.bodies : undefined}
                      highlightAspect={selectedConfig.aspect}
                      highlightSign={selectedConfig.kind === "ingress" ? selectedConfig.sign : undefined}
                      natalPlanets={mode === "natal" && !showAnalog ? natalChart?.planets : undefined}
                    />
                    <p className="text-xs text-slate-400 font-mono text-center">
                      {showAnalog
                        ? `${getEventNarrative(comparedAnalog!.id, L).title} · ${comparedAnalog!.date} · ${t("geo.wheel.caption_era")}`
                        : `${selectedConfig.exact_date} · ${t("geo.wheel.caption_now")}`}
                    </p>
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

                  {/* Historical analogs list */}
                  {!showAnalog && (
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
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{en.description}</p>
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
                              <div key={i} className="flex items-center gap-2 text-sm font-mono text-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                <span>{im.body} {im.aspect} {im.natal_planet} natal</span>
                                <span className="ml-auto text-xs text-slate-400 uppercase">{im.importance}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>

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
