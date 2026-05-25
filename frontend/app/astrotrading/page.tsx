"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { AstroTradingResponse, AstroTradingRequest, MonthlySignal, TransitEvent } from "@/lib/types";
import SignalGauge from "@/components/SignalGauge";
import CosmicWeatherStrip from "@/components/CosmicWeatherStrip";
import { getTradingInterpretation } from "@/lib/trading-interpretations";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ── Market config ─────────────────────────────────────────────────────────────
const MARKETS = [
  { key: "sp500",  ticker: "SPX",    name: "S&P 500",               asset: "índice"       },
  { key: "nasdaq", ticker: "COMP",   name: "NASDAQ",                asset: "índice"       },
  { key: "dow",    ticker: "DJIA",   name: "Dow Jones",             asset: "índice"       },
  { key: "nyse",   ticker: "NYSE",   name: "NYSE",                  asset: "índice"       },
  { key: "bitcoin",ticker: "BTC",    name: "Bitcoin",               asset: "cripto"       },
  { key: "gold",   ticker: "XAU",    name: "Oro",                   asset: "materia prima"},
  { key: "crude",  ticker: "CL",     name: "Petróleo WTI",          asset: "materia prima"},
  { key: "eurusd", ticker: "EURUSD", name: "EUR/USD",               asset: "divisa"       },
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sol: "☉", Luna: "☽", Mercurio: "☿", Venus: "♀", Marte: "♂",
  Júpiter: "♃", Saturno: "♄", Urano: "♅", Neptuno: "♆", Plutón: "♇",
  "Nodo Norte": "☊", Quirón: "⚷",
};

const SIGNAL_CONFIG = {
  LONG:    { label: "LONG",    color: "#22C55E", bg: "rgba(34,197,94,0.15)",   border: "rgba(34,197,94,0.35)",   glow: "0 0 16px rgba(34,197,94,0.25)"   },
  SHORT:   { label: "SHORT",   color: "#EF4444", bg: "rgba(239,68,68,0.15)",   border: "rgba(239,68,68,0.35)",   glow: "0 0 16px rgba(239,68,68,0.25)"   },
  NEUTRAL: { label: "HOLD",    color: "#F59E0B", bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.35)",  glow: "0 0 16px rgba(245,158,11,0.25)"  },
};

const ASSET_COLORS: Record<string, string> = {
  "índice":        "#3B82F6",
  "cripto":        "#A855F7",
  "materia prima": "#F59E0B",
  "divisa":        "#06B6D4",
};

// ── Starfield background (static dots) ────────────────────────────────────────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100,
  y: (i * 93.701) % 100,
  r: i % 7 === 0 ? 1.2 : i % 3 === 0 ? 0.8 : 0.5,
  opacity: 0.15 + (i % 5) * 0.07,
}));

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AstroTradingPage() {
  const router = useRouter();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [data, setData]       = useState<AstroTradingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const today   = new Date().toISOString().slice(0, 10);
  const endDate = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); })();

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

  const sig = data?.signal;
  const sigConf = sig ? SIGNAL_CONFIG[sig.direction] : null;
  const selMeta = MARKETS.find((m) => m.key === selectedMarket);

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "linear-gradient(145deg, #070B18 0%, #0E1428 50%, #080D1E 100%)",
        color: "#E2E8F0",
      }}
    >
      {/* Starfield */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        {STARS.map((s) => (
          <circle
            key={s.id}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.r}
            fill="white"
            opacity={s.opacity}
          />
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
                  borderColor:  isActive ? assetColor           : "rgba(255,255,255,0.08)",
                  background:   isActive ? `${assetColor}18`    : "rgba(255,255,255,0.03)",
                  color:        isActive ? assetColor            : "rgba(148,163,184,0.8)",
                  boxShadow:    isActive ? `0 0 12px ${assetColor}30` : "none",
                  fontWeight:   isActive ? "700" : "400",
                }}
              >
                <span style={{ opacity: 0.6, fontSize: "0.7rem" }}>{ticker}</span>
                {" "}{name}
              </button>
            );
          })}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-4 animate-spin"
                style={{ border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#818CF8" }}
              />
              <p className="font-mono text-sm" style={{ color: "rgba(148,163,184,0.7)" }}>
                Calculando señal astrológica de {selMeta?.name}…
              </p>
              <p className="font-mono text-xs mt-1" style={{ color: "rgba(148,163,184,0.4)" }}>
                Esto puede tardar 30–60 segundos
              </p>
            </div>
          </div>
        )}

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
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
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
        {data && !loading && sig && sigConf && (
          <div className="space-y-8">

            {/* ── HERO: Signal gauge + scores ── */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${sigConf.border}`,
                boxShadow: sigConf.glow,
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

                {/* Gauge */}
                <div className="flex flex-col items-center">
                  <SignalGauge
                    direction={sig.direction}
                    confidence={sig.confidence}
                    netScore={sig.net_score}
                  />
                </div>

                {/* Scores */}
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "rgba(148,163,184,0.5)" }}>
                      Señal global — {data.market_name} ({data.ticker})
                    </p>
                    <p className="text-xs font-mono" style={{ color: "rgba(148,163,184,0.4)" }}>
                      Tránsitos activos: {data.current_transits.length}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Alcista",  value: sig.bullish_score.toFixed(2), color: "#22C55E" },
                      { label: "Bajista",  value: sig.bearish_score.toFixed(2), color: "#EF4444" },
                      { label: "Neto",     value: sig.net_score > 0 ? `+${sig.net_score.toFixed(2)}` : sig.net_score.toFixed(2), color: sigConf.color },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl p-3 text-center"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        <div
                          className="text-xl font-bold font-mono tabular-nums"
                          style={{ color: item.color }}
                        >
                          {item.value}
                        </div>
                        <div className="text-xs font-mono mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <CosmicWeatherStrip
                    cautionFlags={sig.caution_flags}
                    volatility={sig.volatility}
                  />
                </div>
              </div>
            </div>

            {/* ── Rationale cards ── */}
            {sig.rationale.length > 0 && (
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
                      const sConf = interp ? SIGNAL_CONFIG[interp.signal] : SIGNAL_CONFIG.NEUTRAL;
                      const exactStr = t.exact_date
                        ? format(new Date(t.exact_date.slice(0, 10)), "d MMM yy", { locale: es })
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
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
                          }}
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

            {/* ── Monthly signal strip ── */}
            {data.monthly_signals.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-mono uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.5)" }}>
                  Señales mensuales — próximos 12 meses
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {data.monthly_signals.map((ms: MonthlySignal) => {
                    const mc = SIGNAL_CONFIG[ms.direction];
                    const confPct = Math.round(ms.confidence * 100);
                    const [year, month] = ms.month.split("-");
                    const monthLabel = format(new Date(+year, +month - 1, 1), "MMM yy", { locale: es });
                    return (
                      <div
                        key={ms.month}
                        className="rounded-xl p-3 text-center transition-all cursor-default"
                        style={{
                          background: mc.bg,
                          border: `1px solid ${mc.border}`,
                        }}
                        title={`${ms.dominant_theme} · confianza ${confPct}%`}
                      >
                        <div className="text-xs font-mono mb-1" style={{ color: "rgba(148,163,184,0.5)" }}>
                          {monthLabel}
                        </div>
                        <div
                          className="text-sm font-bold font-mono"
                          style={{ color: mc.color }}
                        >
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
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold" style={{ color: "#CBD5E1" }}>
                      {data.market_name}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded font-normal" style={{ color: ASSET_COLORS[data.asset_class] ?? "#94A3B8", background: `${ASSET_COLORS[data.asset_class] ?? "#94A3B8"}18`, border: `1px solid ${ASSET_COLORS[data.asset_class] ?? "#94A3B8"}30` }}>
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
