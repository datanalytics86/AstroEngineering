"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { MundaneResponse, MundaneRequest, MonthlyForecast, PlanetPosition } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ForecastDashboard from "@/components/ForecastDashboard";
import MonthDetailModal from "@/components/MonthDetailModal";
import { getMundaneInterpretation } from "@/lib/mundane-interpretations";

const TransitZodiacWheel = dynamic(
  () => import("@/components/TransitZodiacWheel"),
  { ssr: false },
);

// ── Country config ──────────────────────────────────────────────────────────
const COUNTRIES = [
  { key: "usa",     label: "Estados Unidos 🇺🇸", flag: "🇺🇸" },
  { key: "chile",   label: "Chile 🇨🇱",          flag: "🇨🇱" },
  { key: "uk",      label: "Reino Unido 🇬🇧",    flag: "🇬🇧" },
  { key: "eu",      label: "Unión Europea 🇪🇺",  flag: "🇪🇺" },
  { key: "germany", label: "Alemania 🇩🇪",        flag: "🇩🇪" },
  { key: "france",  label: "Francia 🇫🇷",         flag: "🇫🇷" },
  { key: "china",   label: "China 🇨🇳",           flag: "🇨🇳" },
  { key: "russia",  label: "Rusia 🇷🇺",           flag: "🇷🇺" },
];

const TABS = ["Birueda Natal", "Pronóstico 12 meses", "Cielo Actual"] as const;
type Tab = (typeof TABS)[number];

const PLANET_SYMBOLS: Record<string, string> = {
  Sol: "☉", Luna: "☽", Mercurio: "☿", Venus: "♀", Marte: "♂",
  Júpiter: "♃", Saturno: "♄", Urano: "♅", Neptuno: "♆", Plutón: "♇",
  "Nodo Norte": "☊", Quirón: "⚷",
};

const TRANSIT_COLORS: Record<string, string> = {
  Plutón: "#7C3AED", Neptuno: "#3B82F6", Urano: "#06B6D4",
  Saturno: "#F59E0B", Júpiter: "#10B981", Marte: "#EF4444",
  Sol: "#F97316", Luna: "#64748B", Mercurio: "#6366F1",
  Venus: "#EC4899", "Nodo Norte": "#94A3B8", Quirón: "#8B5CF6",
};

function intensityColor(score: number): string {
  if (score >= 8) return "#EF4444";
  if (score >= 5) return "#F97316";
  return "#10B981";
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function MundialPage() {
  const router = useRouter();

  const [selectedCountry, setSelectedCountry] = useState("usa");
  const [activeTab, setActiveTab]             = useState<Tab>("Birueda Natal");
  const [data, setData]       = useState<MundaneResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyForecast | null>(null);

  const today    = new Date().toISOString().slice(0, 10);
  const endDate  = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); })();

  const fetchMundane = useCallback(async (countryKey: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    const req: MundaneRequest = {
      country:    countryKey,
      start_date: today,
      end_date:   endDate,
    };

    try {
      const res = await fetch("/api/mundane", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(req),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      const json: MundaneResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [today, endDate]);

  function handleCountrySelect(key: string) {
    setSelectedCountry(key);
    fetchMundane(key);
  }

  // Deduplicate transit planets for the biwheel (use current_sky positions)
  const transitPlanets = useMemo(() => {
    if (!data) return [];
    return data.current_sky.map((p) => ({
      name:      p.name,
      symbol:    PLANET_SYMBOLS[p.name] ?? p.name[0],
      longitude: p.longitude,
      retrograde: p.retrograde,
    }));
  }, [data]);

  const nc = data?.national_chart;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">
            Astrología Mundial
          </h1>
          <p className="text-slate-400 font-mono text-sm mt-1">
            Tránsitos sobre cartas nacionales · {today} → {endDate}
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="border border-border text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600 transition-colors font-mono"
        >
          ← Inicio
        </button>
      </div>

      {/* ── Country selector ── */}
      <div className="flex flex-wrap gap-2">
        {COUNTRIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleCountrySelect(key)}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-mono border transition-colors
              ${selectedCountry === key && data
                ? "border-blue-400 bg-blue-50 text-blue-700 font-semibold"
                : "border-border text-slate-600 hover:border-blue-300 hover:text-blue-600"}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 font-mono text-sm">
              Calculando tránsitos sobre {COUNTRIES.find((c) => c.key === selectedCountry)?.label}…
            </p>
            <p className="text-slate-300 font-mono text-xs mt-1">Esto puede tardar 30-60 segundos</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-mono text-sm">{error}</p>
          <button
            onClick={() => fetchMundane(selectedCountry)}
            className="mt-3 px-4 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm font-mono hover:bg-red-100"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && !data && (
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-10 text-center">
          <p className="text-slate-500 font-mono text-sm mb-2">
            Selecciona un país para calcular su pronóstico astrológico de 12 meses
          </p>
          <p className="text-slate-400 font-mono text-xs">
            Cartas canónicas de Campion · Transits by Sasportas · Tarnas · Barbault
          </p>
          <button
            onClick={() => fetchMundane("usa")}
            className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-mono hover:bg-blue-700 transition-colors"
          >
            Empezar con Estados Unidos
          </button>
        </div>
      )}

      {/* ── Data loaded ── */}
      {data && !loading && (
        <>
          {/* National chart info card */}
          <div className="bg-white border border-border rounded-2xl p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-semibold text-lg text-slate-800">
                  {data.country_name}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {nc?.founding_date} · {nc?.founding_time} · {nc?.location}
                </p>
                <p className="text-xs text-slate-300 font-mono">
                  Fuente: {nc?.source}
                </p>
              </div>
              <div className="flex gap-4">
                {[
                  { label: "Tránsitos activos", value: data.current_transits.length },
                  { label: "Alta importancia",  value: data.current_transits.filter((t) => t.importance === "crítica" || t.importance === "alta").length },
                  { label: "Ingresos",          value: data.ingresses.length },
                  { label: "Meses analizados",  value: data.timeline.length },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-xl font-bold text-blue-600 font-mono">{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ASC + MC badges */}
            {(nc?.ascendant || nc?.midheaven) && (
              <div className="flex gap-3 text-xs font-mono">
                {nc.ascendant && (
                  <span className="border border-blue-200 text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    ASC {nc.ascendant.degree_display} {nc.ascendant.sign}
                  </span>
                )}
                {nc.midheaven && (
                  <span className="border border-sky-200 text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                    MC {nc.midheaven.degree_display} {nc.midheaven.sign}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-mono transition-colors
                  ${activeTab === tab
                    ? "bg-white text-slate-800 shadow-sm font-semibold"
                    : "text-slate-500 hover:text-slate-700"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── TAB: Biwheel ── */}
          {activeTab === "Birueda Natal" && (
            <section className="space-y-6">
              <div>
                <h3 className="font-semibold text-base text-slate-800">Birueda Natal / Tránsitos actuales</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Anillo exterior: cielo de hoy · Anillo interior: carta natal del país
                </p>
              </div>
              <TransitZodiacWheel
                natalPlanets={nc?.planets ?? []}
                natalHouses={nc?.houses}
                ascendant={nc?.ascendant}
                midheaven={nc?.midheaven}
                natalAspects={nc?.aspects}
                transitPlanets={transitPlanets}
                transitEvents={data.current_transits}
              />

              {/* Top transits with mundane interpretations */}
              {data.current_transits.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-slate-700">
                    Tránsitos activos — interpretación mundana
                  </h4>
                  {data.current_transits
                    .filter((t) => t.importance === "crítica" || t.importance === "alta")
                    .slice(0, 6)
                    .map((t, i) => {
                      const interp = getMundaneInterpretation(t.transit_planet, t.aspect_name, t.natal_planet);
                      const importColor = t.importance === "crítica" ? "#EF4444" : "#F97316";
                      const tColor = TRANSIT_COLORS[t.transit_planet] ?? "#94A3B8";
                      return (
                        <div
                          key={i}
                          className="bg-white border border-border rounded-xl p-4 space-y-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-base" style={{ color: tColor }}>
                              {PLANET_SYMBOLS[t.transit_planet] ?? ""}
                            </span>
                            <span className="font-mono text-sm font-semibold text-slate-800">
                              {t.transit_planet} {t.aspect_name} {t.natal_planet} natal
                            </span>
                            <span
                              className="ml-auto text-xs font-mono uppercase tracking-wide border rounded px-2 py-0.5 shrink-0"
                              style={{ color: importColor, borderColor: `${importColor}44`, backgroundColor: `${importColor}10` }}
                            >
                              {t.importance}
                            </span>
                          </div>
                          {interp ? (
                            <>
                              <p className="text-xs text-slate-600 leading-relaxed">{interp.summary}</p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {interp.domains.map((d) => (
                                  <span key={d} className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                    {d}
                                  </span>
                                ))}
                              </div>
                              {interp.historical_examples && (
                                <p className="text-xs text-slate-400 italic">{interp.historical_examples}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-slate-400 font-mono">
                              {t.transit_planet} {t.aspect_name.toLowerCase()} {t.natal_planet} natal — orbe {t.orb.toFixed(1)}°
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </section>
          )}

          {/* ── TAB: Forecast ── */}
          {activeTab === "Pronóstico 12 meses" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-semibold text-base text-slate-800">Pronóstico mes a mes</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Tránsitos de planetas lentos sobre la carta natal de {data.country_name}
                </p>
              </div>
              <ForecastDashboard
                timeline={data.timeline}
                natalPlanets={nc?.planets}
                onMonthClick={(m) => setSelectedMonth(m)}
              />
              {/* Upcoming ingresses */}
              {data.ingresses.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-sm text-slate-700 mb-3">Ingresos de signo próximos</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.ingresses.slice(0, 12).map((ing, i) => {
                      const color = TRANSIT_COLORS[ing.planet] ?? "#94A3B8";
                      const dateStr = format(new Date(ing.date), "d MMM yyyy", { locale: es });
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-white border border-border rounded-lg px-3 py-2"
                        >
                          <span className="text-sm" style={{ color }}>{PLANET_SYMBOLS[ing.planet] ?? ing.planet[0]}</span>
                          <span className="text-xs font-mono text-slate-700 flex-1">
                            <span className="font-semibold">{ing.planet}</span>
                            {" ingresa "}<span className="font-semibold">{ing.sign}</span>
                            {ing.retrograde && <span className="text-slate-400"> ℞</span>}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{dateStr}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── TAB: Current Sky ── */}
          {activeTab === "Cielo Actual" && (
            <section className="space-y-4">
              <div>
                <h3 className="font-semibold text-base text-slate-800">Posiciones planetarias hoy</h3>
                <p className="text-xs text-slate-400 font-mono">{today} · Eclíptica heliocéntrica (geocéntrica)</p>
              </div>

              {/* Planet positions table */}
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-slate-50">
                      <th className="px-4 py-2 text-left font-mono text-xs text-slate-500">Planeta</th>
                      <th className="px-4 py-2 text-left font-mono text-xs text-slate-500">Posición</th>
                      <th className="px-4 py-2 text-left font-mono text-xs text-slate-500">Signo</th>
                      <th className="px-4 py-2 text-center font-mono text-xs text-slate-500">℞</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.current_sky.map((p) => {
                      const color = TRANSIT_COLORS[p.name] ?? "#94A3B8";
                      return (
                        <tr key={p.name} className="border-b border-border/50 hover:bg-slate-50">
                          <td className="px-4 py-2">
                            <span className="flex items-center gap-2">
                              <span style={{ color }}>{p.symbol}</span>
                              <span className="font-mono text-slate-700 text-xs">{p.name}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-600">
                            {p.degree_display} {p.sign_symbol}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-500">{p.sign}</td>
                          <td className="px-4 py-2 text-center font-mono text-xs text-red-500">
                            {p.retrograde ? "℞" : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Critical transits for this country right now */}
              {data.current_transits.filter((t) => t.importance === "crítica" || t.importance === "alta").length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm text-slate-700 mb-3">
                    Tránsitos de alta importancia sobre {data.country_name}
                  </h4>
                  <div className="space-y-2">
                    {data.current_transits
                      .filter((t) => t.importance === "crítica" || t.importance === "alta")
                      .slice(0, 8)
                      .map((t, i) => {
                        const importColor = t.importance === "crítica" ? "#EF4444" : "#F97316";
                        const exactStr = t.exact_date
                          ? format(new Date(t.exact_date.slice(0, 10)), "d MMM yyyy", { locale: es })
                          : null;
                        const interp = getMundaneInterpretation(t.transit_planet, t.aspect_name, t.natal_planet);
                        return (
                          <div
                            key={i}
                            className="bg-white border border-border rounded-xl px-4 py-3 space-y-1.5"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className="text-xs font-mono font-semibold border rounded px-2 py-0.5 shrink-0"
                                style={{ color: importColor, borderColor: `${importColor}44`, backgroundColor: `${importColor}10` }}
                              >
                                {t.importance}
                              </span>
                              <span className="flex-1 text-xs font-mono text-slate-700">
                                <span className="font-semibold">{t.transit_planet}</span>
                                {" "}{t.aspect_name}{" "}
                                <span className="font-semibold">{t.natal_planet}</span> natal
                              </span>
                              {exactStr && (
                                <span className="text-xs font-mono text-slate-400 shrink-0">{exactStr}</span>
                              )}
                            </div>
                            {interp && (
                              <p className="text-xs text-slate-500 leading-relaxed pl-1">{interp.summary}</p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* ── Month detail modal ── */}
      {selectedMonth && (
        <MonthDetailModal
          month={selectedMonth}
          natalPlanets={nc?.planets}
          onClose={() => setSelectedMonth(null)}
        />
      )}
    </div>
  );
}
