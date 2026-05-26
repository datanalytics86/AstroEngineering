"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AstroTradingResponse, AstroTradingRequest, MonthlySignal, TransitEvent, ExactAspectEvent } from "@/lib/types";
import SignalGauge from "@/components/SignalGauge";
import CosmicWeatherStrip from "@/components/CosmicWeatherStrip";
import ForecastRibbon from "@/components/ForecastRibbon";
import LunarPhase from "@/components/LunarPhase";
import { getTradingInterpretation } from "@/lib/trading-interpretations";
import { format } from "date-fns";
import { es } from "date-fns/locale";

function safeFormat(input: Date | string, fmt: string): string | null {
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : format(d, fmt, { locale: es });
}

// ── Market config ─────────────────────────────────────────────────────────────
const MARKETS = [
  { key: "sp500",   ticker: "SPX",    name: "S&P 500",      asset: "índice"        },
  { key: "nasdaq",  ticker: "COMP",   name: "NASDAQ",       asset: "índice"        },
  { key: "dow",     ticker: "DJIA",   name: "Dow Jones",    asset: "índice"        },
  { key: "nyse",    ticker: "NYSE",   name: "NYSE",         asset: "índice"        },
  { key: "bitcoin", ticker: "BTC",    name: "Bitcoin",      asset: "cripto"        },
  { key: "gold",    ticker: "XAU",    name: "Oro",          asset: "materia prima" },
  { key: "crude",   ticker: "CL",     name: "Petróleo WTI", asset: "materia prima" },
  { key: "eurusd",  ticker: "EURUSD", name: "EUR/USD",      asset: "divisa"        },
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sol: "☉", Luna: "☽", Mercurio: "☿", Venus: "♀", Marte: "♂",
  Júpiter: "♃", Saturno: "♄", Urano: "♅", Neptuno: "♆", Plutón: "♇",
  "Nodo Norte": "☊", Quirón: "⚷",
};

const SIGNAL_CONFIG = {
  LONG:    { label: "LONG",  color: "#22C55E", bg: "rgba(34,197,94,0.15)",  border: "rgba(34,197,94,0.35)",  glow: "0 0 20px rgba(34,197,94,0.2)"   },
  SHORT:   { label: "SHORT", color: "#EF4444", bg: "rgba(239,68,68,0.15)",  border: "rgba(239,68,68,0.35)",  glow: "0 0 20px rgba(239,68,68,0.2)"   },
  NEUTRAL: { label: "HOLD",  color: "#F59E0B", bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)", glow: "0 0 20px rgba(245,158,11,0.2)"  },
};

const ASSET_COLORS: Record<string, string> = {
  "índice":        "#3B82F6",
  "cripto":        "#A855F7",
  "materia prima": "#F59E0B",
  "divisa":        "#06B6D4",
};

// ── Starfield background ───────────────────────────────────────────────────────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100,
  y: (i * 93.701) % 100,
  r: i % 7 === 0 ? 1.2 : i % 3 === 0 ? 0.8 : 0.5,
  opacity: 0.15 + (i % 5) * 0.07,
}));

// ── Skeleton placeholder ───────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = "1rem", className = "" }: { w?: string; h?: string; className?: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{
        width: w,
        height: h,
        background: "rgba(255,255,255,0.04)",
        animation: "shimmer 1.6s infinite linear",
        backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)",
        backgroundSize: "400px 100%",
      }}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <style>{`
        @keyframes shimmer {
          from { background-position: -400px 0; }
          to   { background-position:  400px 0; }
        }
      `}</style>
      <p className="text-center text-xs font-mono" style={{ color: "rgba(148,163,184,0.5)" }}>
        Calculando tránsitos… el servidor puede tardar hasta 60s la primera vez.
      </p>
      {/* Hero skeleton */}
      <div className="rounded-2xl p-6 space-y-4" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col items-center gap-4">
            <Skeleton w="220px" h="160px" className="rounded-full" />
          </div>
          <div className="space-y-4">
            <Skeleton h="1rem" w="60%" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton h="70px" />
              <Skeleton h="70px" />
              <Skeleton h="70px" />
            </div>
            <Skeleton h="40px" />
          </div>
        </div>
      </div>
      {/* Ribbon skeleton */}
      <Skeleton h="180px" />
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Skeleton h="100px" />
        <Skeleton h="100px" />
        <Skeleton h="100px" />
        <Skeleton h="100px" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AstroTradingPage() {
  const router = useRouter();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [data, setData]       = useState<AstroTradingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const today   = new Date().toISOString().slice(0, 10);
  const endDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  })();

  const fetchTrading = useCallback(async (marketKey: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    const req: AstroTradingRequest = {
      market_key: marketKey,
      start_date: today,
      end_date:   endDate,
    };

    try {
      const res = await fetch("/api/astrotrading", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(req),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [today, endDate]);

  function handleMarketSelect(key: string) {
    setSelectedMarket(key);
    fetchTrading(key);
  }

  const sigTrend = data?.signal_trend ?? data?.signal;
  const sigShort = data?.signal_short_term;
  const selMeta  = MARKETS.find((m) => m.key === selectedMarket);

  // Hero signal = short_term (accionable hoy); macro = trend
  const heroSig   = sigShort ?? sigTrend;
  const heroConf  = heroSig ? SIGNAL_CONFIG[heroSig.direction] : null;

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "linear-gradient(145deg, #070B18 0%, #0E1428 50%, #080D1E 100%)",
        color: "#E2E8F0",
      }}
    >
      {/* Subtle nebula */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 20% 60%, rgba(99,102,241,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(34,197,94,0.03) 0%, transparent 50%)",
        }}
        aria-hidden="true"
      />

      {/* Starfield */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        {STARS.map((s) => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={s.opacity} />
        ))}
      </svg>

      {/* Disclaimer banner */}
      <div
        className="relative z-10 w-full text-center py-2 px-4 text-xs font-mono"
        style={{
          background: "rgba(245,158,11,0.08)",
          borderBottom: "1px solid rgba(245,158,11,0.2)",
          color: "rgba(245,158,11,0.9)",
        }}
      >
        ⚠️ Solo con fines de entretenimiento y educativos. No constituye asesoría ni recomendación financiera. Las decisiones de inversión son tu responsabilidad.
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              className="font-bold text-3xl tracking-tight"
              style={{ color: "#E2E8F0", fontFamily: "JetBrains Mono, monospace" }}
            >
              📈 AstroTrading
            </h1>
            <p className="mt-1 text-sm font-mono" style={{ color: "rgba(148,163,184,0.7)" }}>
              Señales LONG/SHORT basadas en tránsitos astrológicos · tradición Meridian/Merriman
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm font-mono px-4 py-2 rounded-lg border transition-colors"
            style={{
              color: "rgba(148,163,184,0.8)",
              borderColor: "rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.5)";
              (e.currentTarget as HTMLButtonElement).style.color = "#818CF8";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(148,163,184,0.8)";
            }}
          >
            ← Inicio
          </button>
        </div>

        {/* ── Market selector ── */}
        <div className="flex flex-wrap gap-2">
          {MARKETS.map(({ key, ticker, name, asset }) => {
            const isActive = selectedMarket === key && data;
            const assetColor = ASSET_COLORS[asset] ?? "#94A3B8";
            return (
              <button
                key={key}
                onClick={() => handleMarketSelect(key)}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-mono border transition-all"
                style={{
                  borderColor: isActive ? assetColor          : "rgba(255,255,255,0.08)",
                  background:  isActive ? `${assetColor}18`   : "rgba(255,255,255,0.03)",
                  color:       isActive ? assetColor           : "rgba(148,163,184,0.8)",
                  boxShadow:   isActive ? `0 0 12px ${assetColor}30` : "none",
                  fontWeight:  isActive ? "700" : "400",
                }}
              >
                <span style={{ opacity: 0.6, fontSize: "0.7rem" }}>{ticker}</span>
                {" "}{name}
              </button>
            );
          })}
        </div>

        {/* ── Loading skeleton ── */}
        {loading && <LoadingSkeleton />}

        {/* ── Error ── */}
        {error && !loading && (
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <p className="font-mono text-sm" style={{ color: "#EF4444" }}>{error}</p>
            <button
              onClick={() => selectedMarket && fetchTrading(selectedMarket)}
              className="mt-3 px-4 py-1.5 rounded-lg text-sm font-mono transition-colors"
              style={{ border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && !data && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-4xl mb-4">🔭</p>
            <p className="font-mono text-sm mb-2" style={{ color: "rgba(148,163,184,0.7)" }}>
              Selecciona un mercado para calcular su señal astrológica
            </p>
            <p className="font-mono text-xs" style={{ color: "rgba(148,163,184,0.4)" }}>
              Tránsitos planetarios sobre la carta de inicio · tradición astro-financiera
            </p>
            <button
              onClick={() => handleMarketSelect("sp500")}
              className="mt-6 px-6 py-2.5 rounded-lg text-sm font-mono transition-colors"
              style={{ background: "rgba(99,102,241,0.2)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.3)" }}
            >
              Empezar con S&P 500
            </button>
          </div>
        )}

        {/* ── Data loaded ── */}
        {data && !loading && heroSig && heroConf && sigTrend && (
          <div className="space-y-8">

            {/* ── HERO: Doble lectura — timing hoy + tendencia macro ── */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${heroConf.border}`,
                boxShadow: heroConf.glow,
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Gauge corto plazo (accionable hoy) */}
                <div className="flex flex-col items-center">
                  <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "rgba(148,163,184,0.45)" }}>
                    Timing accionable hoy
                  </p>
                  <SignalGauge
                    direction={heroSig.direction}
                    confidence={heroSig.confidence}
                    consensus={heroSig.consensus ?? 0}
                    size="lg"
                  />
                </div>

                {/* Scores + tendencia macro */}
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "rgba(148,163,184,0.5)" }}>
                      {data.market_name} ({data.ticker}) · {data.asset_class}
                    </p>
                    <p className="text-xs font-mono" style={{ color: "rgba(148,163,184,0.4)" }}>
                      Tránsitos lentos activos: {data.current_transits.length}
                    </p>
                  </div>

                  {/* Tendencia macro 12 meses */}
                  {(() => {
                    const mc = SIGNAL_CONFIG[sigTrend.direction];
                    const confPct = Math.round(sigTrend.confidence * 100);
                    const cons = sigTrend.consensus ?? 0;
                    return (
                      <div
                        className="rounded-xl p-4 flex items-center gap-4 transition-all"
                        style={{
                          background: mc.bg,
                          border: `1px solid ${mc.border}`,
                        }}
                      >
                        <div className="text-center shrink-0">
                          <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: mc.color }}>
                            {mc.label}
                          </div>
                          <div className="text-xs font-mono mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>
                            macro
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1 text-xs font-mono">
                          <div style={{ color: "rgba(148,163,184,0.7)" }}>Tendencia 12 meses</div>
                          <div style={{ color: "rgba(148,163,184,0.5)" }}>
                            Confianza {confPct}% · consenso {cons >= 0 ? "+" : ""}{(cons * 100).toFixed(0)}%
                          </div>
                          {sigTrend.rationale[0] && (
                            <div className="truncate" style={{ color: "rgba(148,163,184,0.4)" }}>
                              {sigTrend.rationale[0]}
                            </div>
                          )}
                        </div>
                        {/* Mini gauge */}
                        <SignalGauge
                          direction={sigTrend.direction}
                          confidence={sigTrend.confidence}
                          consensus={sigTrend.consensus ?? 0}
                          size="sm"
                        />
                      </div>
                    );
                  })()}

                  {/* Numeric scores */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Alcista",  value: heroSig.bullish_score.toFixed(2), color: "#22C55E" },
                      { label: "Bajista",  value: heroSig.bearish_score.toFixed(2), color: "#EF4444" },
                      { label: "Consenso", value: ((heroSig.consensus ?? 0) >= 0 ? "+" : "") + ((heroSig.consensus ?? 0) * 100).toFixed(0) + "%", color: heroConf.color },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl p-3 text-center transition-all"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.08)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
                      >
                        <div className="text-xl font-bold font-mono tabular-nums" style={{ color: item.color }}>
                          {item.value}
                        </div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <CosmicWeatherStrip
                    cautionFlags={heroSig.caution_flags}
                    volatility={heroSig.volatility}
                  />
                </div>
              </div>

              {/* Lunar phase strip inside hero */}
              {data.lunar && (
                <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <LunarPhase lunar={data.lunar} />
                </div>
              )}
            </div>

            {/* ── Forecast Ribbon ── */}
            {data.monthly_signals.length > 0 && (
              <ForecastRibbon monthly_signals={data.monthly_signals} />
            )}

            {/* ── Rationale cards ── */}
            {heroSig.rationale.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-mono uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.5)" }}>
                  Fundamentos de la señal
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.current_transits
                    .filter((t) => t.importance === "crítica" || t.importance === "alta")
                    .slice(0, 6)
                    .map((t: TransitEvent, i: number) => {
                      const interp = getTradingInterpretation(t.transit_planet, t.aspect_name, t.natal_planet);
                      const sConf  = interp ? SIGNAL_CONFIG[interp.signal] : SIGNAL_CONFIG.NEUTRAL;
                      const exactStr = t.exact_date
                        ? safeFormat(t.exact_date.slice(0, 10), "d MMM yy")
                        : null;
                      return (
                        <div
                          key={i}
                          className="rounded-xl p-4 space-y-2 transition-all"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: `1px solid ${interp ? sConf.border : "rgba(255,255,255,0.07)"}`,
                            backdropFilter: "blur(8px)",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base" style={{ color: "#94A3B8" }}>
                              {PLANET_SYMBOLS[t.transit_planet] ?? ""}
                            </span>
                            <span className="text-sm font-mono font-semibold" style={{ color: "#CBD5E1" }}>
                              {t.transit_planet} {t.aspect_name} {t.natal_planet}
                            </span>
                            {interp && (
                              <span
                                className="ml-auto text-xs font-mono font-bold px-2 py-0.5 rounded border"
                                style={{ color: sConf.color, borderColor: sConf.border, background: sConf.bg }}
                              >
                                {interp.signal}
                              </span>
                            )}
                          </div>
                          {interp ? (
                            <>
                              <p className="text-xs font-mono" style={{ color: sConf.color, opacity: 0.8 }}>
                                {interp.market_meaning}
                              </p>
                              <p className="text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.7)" }}>
                                {interp.summary}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs font-mono" style={{ color: "rgba(148,163,184,0.5)" }}>
                              Orbe {t.orb.toFixed(1)}° · {t.nature}
                            </p>
                          )}
                          {exactStr && (
                            <p className="text-xs font-mono" style={{ color: "rgba(148,163,184,0.35)" }}>
                              Exacto: {exactStr}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              </section>
            )}

            {/* ── Fechas clave (P2) ── */}
            {data.exact_aspects_calendar && data.exact_aspects_calendar.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-mono uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.5)" }}>
                  Fechas clave — posibles puntos de giro
                </h2>
                <div
                  className="rounded-2xl p-4 space-y-2 overflow-x-auto"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {data.exact_aspects_calendar.slice(0, 10).map((ev: ExactAspectEvent, i: number) => {
                    const interp = getTradingInterpretation(ev.transit_planet, ev.aspect, ev.natal_planet);
                    const sc = interp ? SIGNAL_CONFIG[interp.signal] : SIGNAL_CONFIG.NEUTRAL;
                    const dateStr = safeFormat(ev.date.slice(0, 10), "d MMM yyyy");
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg transition-all"
                        style={{
                          borderLeft: `3px solid ${sc.color}`,
                          background: "rgba(255,255,255,0.01)",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.01)"; }}
                      >
                        <span className="text-sm shrink-0">{PLANET_SYMBOLS[ev.transit_planet] ?? "★"}</span>
                        <span className="font-mono text-xs font-semibold shrink-0" style={{ color: "#CBD5E1", minWidth: "120px" }}>
                          {ev.transit_planet} {ev.aspect} {ev.natal_planet}
                        </span>
                        {dateStr && (
                          <span className="font-mono text-xs shrink-0" style={{ color: "rgba(148,163,184,0.6)", minWidth: "90px" }}>
                            {dateStr}
                          </span>
                        )}
                        <span
                          className="text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                          style={{ color: sc.color, background: sc.bg }}
                        >
                          {sc.label}
                        </span>
                        {interp && (
                          <span className="text-xs font-mono truncate" style={{ color: "rgba(148,163,184,0.4)" }}>
                            {interp.market_meaning}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Monthly signal strip (P3 — complementary view) ── */}
            {data.monthly_signals.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-mono uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.5)" }}>
                  Veredicto mensual
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {data.monthly_signals.map((ms: MonthlySignal) => {
                    const mc = SIGNAL_CONFIG[ms.direction];
                    const confPct = Math.round(ms.confidence * 100);
                    const [year, month] = ms.month.split("-");
                    const monthLabel = safeFormat(new Date(+year, +month - 1, 1), "MMM yy") ?? ms.month;
                    return (
                      <div
                        key={ms.month}
                        className="rounded-xl p-3 text-center transition-all cursor-default"
                        style={{ background: mc.bg, border: `1px solid ${mc.border}` }}
                        title={`${ms.dominant_theme} · confianza ${confPct}% · consenso ${((ms.consensus ?? 0) * 100).toFixed(0)}%`}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.04)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
                      >
                        <div className="text-xs font-mono mb-1" style={{ color: "rgba(148,163,184,0.5)" }}>
                          {monthLabel}
                        </div>
                        <div className="text-sm font-bold font-mono" style={{ color: mc.color }}>
                          {mc.label}
                        </div>
                        <div className="text-xs font-mono mt-1" style={{ color: "rgba(148,163,184,0.4)" }}>
                          {confPct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Inception chart info ── */}
            <section>
              <h2 className="text-sm font-mono uppercase tracking-widest mb-3" style={{ color: "rgba(148,163,184,0.5)" }}>
                Carta de inicio (inception chart)
              </h2>
              <div
                className="rounded-xl p-4 transition-all"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold" style={{ color: "#CBD5E1" }}>
                      {data.market_name}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded font-normal"
                        style={{ color: ASSET_COLORS[data.asset_class] ?? "#94A3B8", background: `${ASSET_COLORS[data.asset_class] ?? "#94A3B8"}18`, border: `1px solid ${ASSET_COLORS[data.asset_class] ?? "#94A3B8"}30` }}>
                        {data.asset_class}
                      </span>
                    </p>
                    <p className="text-xs font-mono mt-1" style={{ color: "rgba(148,163,184,0.5)" }}>
                      {data.inception_chart.founding_date} · {data.inception_chart.founding_time} · {data.inception_chart.location}
                    </p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: "rgba(148,163,184,0.3)" }}>
                      Fuente: {data.inception_chart.source}
                    </p>
                  </div>
                  <div className="flex gap-4 text-center">
                    {data.inception_chart.ascendant && (
                      <div>
                        <div className="text-xs font-mono font-semibold" style={{ color: "#818CF8" }}>
                          ASC {data.inception_chart.ascendant.degree_display} {data.inception_chart.ascendant.sign}
                        </div>
                      </div>
                    )}
                    {data.inception_chart.midheaven && (
                      <div>
                        <div className="text-xs font-mono font-semibold" style={{ color: "#38BDF8" }}>
                          MC {data.inception_chart.midheaven.degree_display} {data.inception_chart.midheaven.sign}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}
      </div>

      {/* Footer disclaimer */}
      <div
        className="relative z-10 w-full text-center py-4 px-4 mt-8 text-xs font-mono"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          color: "rgba(148,163,184,0.35)",
        }}
      >
        AstroTrading · Solo entretenimiento · Tradición astro-financiera (Meridian · Merriman · Gann)
        · No es asesoría financiera · Las constelaciones no garantizan rendimientos
      </div>
    </div>
  );
}
