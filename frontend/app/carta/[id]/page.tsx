"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { ChartResponse, BirthData, ClickTarget } from "@/lib/types";
import { loadChart, saveTransits, saveSolarReturn } from "@/lib/storage";
import ChartWheel from "@/components/ChartWheel";
import PlanetPositions from "@/components/PlanetPositions";
import AspectTable from "@/components/AspectTable";
import InterpretationModal from "@/components/InterpretationModal";
import ChartSummaryModal from "@/components/ChartSummary";
import { generateChartSummary } from "@/lib/chart-summary";
import BaZiPanel from "@/components/bazi/BaZiPanel";
import type { BaZiResponse } from "@/lib/bazi-types";

export default function CartaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [highlighted, setHighlighted] = useState<string | undefined>(undefined);
  const [loadingTransits, setLoadingTransits] = useState(false);
  const [transitError, setTransitError] = useState<string | null>(null);
  const [loadingSR, setLoadingSR]   = useState(false);
  const [srError, setSrError]       = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<ClickTarget | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<"occidental" | "bazi">("occidental");
  const [baziData, setBaziData] = useState<BaZiResponse | null>(null);
  const [loadingBazi, setLoadingBazi] = useState(false);
  const [baziError, setBaziError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) { router.push("/"); return; }
    const data = loadChart(id);
    if (!data) { router.push("/"); return; }
    setChart(data.chart);
    setBirthData(data.birthData);
  }, [id, router]);

  async function handleCalcTransits() {
    if (!chart || !birthData) return;
    setLoadingTransits(true);
    setTransitError(null);

    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);

    const req = {
      natal_planets: chart.planets,
      start_date: today.toISOString().slice(0, 10),
      end_date: nextYear.toISOString().slice(0, 10),
      latitude: birthData.latitude,
      longitude: birthData.longitude,
    };

    try {
      const res = await fetch("/api/transits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error al calcular tránsitos" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      saveTransits(id, data);
      router.push(`/transitos/${id}`);
    } catch (e) {
      setTransitError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoadingTransits(false);
    }
  }

  async function handleSolarReturn() {
    if (!chart || !birthData) return;
    setLoadingSR(true);
    setSrError(null);
    const sunPlanet = chart.planets.find((p) => p.name === "Sol");
    if (!sunPlanet) { setLoadingSR(false); return; }
    try {
      const year = new Date().getFullYear();
      const res = await fetch("/api/solar-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          natal_sun_longitude: sunPlanet.longitude,
          year,
          latitude: birthData.latitude,
          longitude: birthData.longitude,
          timezone_offset: birthData.timezone_offset,
          name: `Retorno Solar ${year} — ${chart.name}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      const srChart = await res.json();
      saveSolarReturn(id, srChart);
      router.push(`/retorno/${id}`);
    } catch (e) {
      setSrError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoadingSR(false);
    }
  }

  async function handleCalcBazi() {
    if (!birthData) return;
    setLoadingBazi(true);
    setBaziError(null);
    try {
      const res = await fetch("/api/bazi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          birth_date: birthData.birth_date,
          birth_time: birthData.birth_time,
          latitude: birthData.latitude,
          longitude: birthData.longitude,
          timezone_offset: birthData.timezone_offset,
          gender: birthData.gender ?? "male",
        }),
      });
      if (!res.ok) throw new Error("Error en cálculo");
      const data: BaZiResponse = await res.json();
      setBaziData(data);
      setActiveMainTab("bazi");
    } catch (e) {
      setBaziError("No se pudo calcular BaZi.");
    } finally {
      setLoadingBazi(false);
    }
  }

  if (!chart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-mono text-sm">Cargando carta natal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">{chart.name}</h1>
          <p className="text-slate-400 font-mono text-sm mt-1">
            {chart.birth_date} · {chart.birth_time} ·{" "}
            <span className="text-blue-600 font-semibold">{chart.ascendant.sign}</span> Ascendente ·{" "}
            <span className="text-sky-500">MC {chart.midheaven.sign}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/")}
            className="border border-border text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600 transition-colors font-mono"
          >
            ← Nueva carta
          </button>
          <button
            onClick={() => router.push("/mundial")}
            className="border border-border text-slate-500 px-4 py-2 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600 transition-colors font-mono"
          >
            🌍 Mundial
          </button>
          <button
            onClick={() => setShowSummary(true)}
            className="border border-blue-200 text-blue-600 px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors font-mono flex items-center gap-1.5"
          >
            ✦ Resumen ejecutivo
          </button>
          <button
            onClick={handleSolarReturn}
            disabled={loadingSR}
            className="border border-amber-300 text-amber-600 px-4 py-2 rounded-lg text-sm hover:bg-amber-50 transition-colors font-mono flex items-center gap-1.5 disabled:opacity-50"
          >
            {loadingSR ? (
              <span className="inline-block w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            ) : "☉"}
            Retorno Solar {new Date().getFullYear()}
          </button>
          <button
            onClick={handleCalcTransits}
            disabled={loadingTransits}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 font-mono flex items-center gap-2"
          >
            {loadingTransits ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Calculando tránsitos…
              </>
            ) : (
              "Ver Tránsitos 12 meses →"
            )}
          </button>
        </div>
      </div>

      {transitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600 font-mono">
          Error: {transitError}
        </div>
      )}

      {srError && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700 font-mono">
          Error retorno solar: {srError}
        </div>
      )}

      {loadingTransits && (
        <div className="mb-6 bg-white border border-border rounded-xl p-5 text-center shadow-card">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-700 text-sm font-mono mb-1">Calculando tránsitos para los próximos 12 meses…</p>
          <p className="text-slate-400 text-xs">Este proceso tarda 15-30 segundos. No cierres la ventana.</p>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1 overflow-hidden">
            <div className="h-1 bg-blue-600 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveMainTab("occidental")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeMainTab === "occidental"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Carta Natal Occidental
        </button>
        <button
          onClick={() => {
            if (!baziData) handleCalcBazi();
            else setActiveMainTab("bazi");
          }}
          disabled={loadingBazi}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeMainTab === "bazi"
              ? "bg-[#C9A84C] text-[#0A0E1A]"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          } disabled:opacity-50`}
        >
          {loadingBazi ? "Calculando..." : "四柱 Cuatro Pilares del Destino"}
        </button>
      </div>
      {baziError && <p className="text-red-500 text-sm mb-4">{baziError}</p>}

      {activeMainTab === "occidental" && (
        <>
          {/* Layout principal */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Rueda zodiacal */}
            <div className="space-y-4">
              <h2 className="font-semibold text-lg text-slate-700">Rueda Natal</h2>
              <div className="bg-white border border-border rounded-2xl p-4 shadow-card">
                <ChartWheel
                  planets={chart.planets}
                  houses={chart.houses}
                  ascendant={chart.ascendant}
                  midheaven={chart.midheaven}
                  aspects={chart.aspects}
                  highlightedPlanet={highlighted}
                  onPlanetClick={(name) => setHighlighted((prev) => (prev === name ? undefined : name))}
                  onElementClick={(target) => setModalTarget(target)}
                />
              </div>
              {highlighted ? (
                <p className="text-xs text-center text-blue-600 font-mono">
                  {highlighted} — click de nuevo para deseleccionar
                </p>
              ) : (
                <p className="text-xs text-slate-400 text-center font-mono">
                  Click en planeta, aspecto, casa o ángulo para ver interpretación
                </p>
              )}
            </div>

            {/* Tablas */}
            <div className="space-y-6">
              {/* Ángulos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-border rounded-xl p-4 shadow-card">
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1">Ascendente</div>
                  <div className="text-blue-600 font-mono text-lg font-semibold">{chart.ascendant.sign}</div>
                  <div className="text-slate-500 font-mono text-sm">{chart.ascendant.degree_display}</div>
                </div>
                <div className="bg-white border border-border rounded-xl p-4 shadow-card">
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1">Medio Cielo</div>
                  <div className="text-sky-500 font-mono text-lg font-semibold">{chart.midheaven.sign}</div>
                  <div className="text-slate-500 font-mono text-sm">{chart.midheaven.degree_display}</div>
                </div>
              </div>

              <PlanetPositions
                planets={chart.planets}
                highlightedPlanet={highlighted}
                onPlanetClick={(name) => setHighlighted((prev) => (prev === name ? undefined : name))}
              />

              <AspectTable aspects={chart.aspects} highlightedPlanet={highlighted} />
            </div>
          </div>
        </>
      )}

      {activeMainTab === "bazi" && baziData && (
        <BaZiPanel data={baziData} />
      )}

      <InterpretationModal
        target={modalTarget}
        allAspects={chart.aspects}
        onClose={() => setModalTarget(null)}
      />

      {showSummary && (
        <ChartSummaryModal
          summary={generateChartSummary(chart)}
          name={chart.name}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}
