"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { ChartResponse, BirthData, ClickTarget } from "@/lib/types";
import {
  loadChart,
  saveYearTransits,
  saveSolarReturn,
  isProUnlocked,
  unlockPro,
  loadYearTransits,
} from "@/lib/storage";
import { postWithWakingRetry } from "@/lib/api-fetch";
import ChartWheel from "@/components/ChartWheel";
import PlanetPositions from "@/components/PlanetPositions";
import AspectTable from "@/components/AspectTable";
import InterpretationModal from "@/components/InterpretationModal";
import ChartSummaryModal from "@/components/ChartSummary";
import TopicSummarySection from "@/components/TopicSummarySection";
import { generateChartSummary } from "@/lib/chart-summary";
import { generateTopicSummaries } from "@/lib/topic-summary";
import {
  getTier1Aspects,
  buildPersonalIntensitySeries,
} from "@/lib/personal-intensity";
import ActionButton from "@/components/ActionButton";
import { useT } from "@/lib/i18n";

export default function CartaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { t, lang } = useT();
  const locale = lang === "en" ? "en" : "es";

  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [birthData, setBirthData] = useState<BirthData | null>(null);
  const [highlighted, setHighlighted] = useState<string | undefined>(undefined);
  const [loadingTransits, setLoadingTransits] = useState(false);
  const [transitError, setTransitError] = useState<string | null>(null);
  const [loadingSR, setLoadingSR]   = useState(false);
  const [srError, setSrError]       = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<ClickTarget | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [proUnlocked, setProUnlocked] = useState(false);

  useEffect(() => {
    if (!id) { router.push("/nueva"); return; }
    const data = loadChart(id);
    if (!data) { router.push("/nueva"); return; }
    setChart(data.chart);
    setBirthData(data.birthData);
    setProUnlocked(isProUnlocked(id));
  }, [id, router]);

  const topics = useMemo(
    () => (chart ? generateTopicSummaries(chart, locale) : []),
    [chart, locale]
  );
  const tier1Aspects = useMemo(
    () => (chart ? getTier1Aspects(chart.aspects) : []),
    [chart]
  );
  const intensityData = useMemo(() => {
    if (!id) return [];
    const year = new Date().getFullYear();
    return buildPersonalIntensitySeries(loadYearTransits(id, year), year, locale);
  }, [id, locale, proUnlocked]);

  function handleUnlockPro() {
    if (!id) return;
    // TODO(Stripe): replace unlockPro with real checkout session
    unlockPro(id, false);
    setProUnlocked(true);
    try {
      window.dispatchEvent(
        new CustomEvent("astro-pro-unlocked", { detail: { chartId: id } })
      );
    } catch {
      /* ignore */
    }
  }

  function handleOpenSummary() {
    if (id && isProUnlocked(id)) {
      setProUnlocked(true);
      setShowSummary(true);
      return;
    }
    const el = document.getElementById("astro-pro-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleCalcTransits() {
    if (!chart || !birthData) return;
    setLoadingTransits(true);
    setTransitError(null);

    const year = new Date().getFullYear();
    const req = {
      natal_planets: chart.planets,
      start_date: `${year}-01-01`,
      end_date: `${year}-12-31`,
      latitude: birthData.latitude,
      longitude: birthData.longitude,
    };

    try {
      const res = await postWithWakingRetry("/api/transits", req, () =>
        setTransitError(t("common.error.waking")),
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error al calcular tránsitos" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      setTransitError(null);
      const data = await res.json();
      saveYearTransits(id, year, data);
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
      const res = await postWithWakingRetry(
        "/api/solar-return",
        {
          natal_sun_longitude: sunPlanet.longitude,
          year,
          latitude: birthData.latitude,
          longitude: birthData.longitude,
          timezone_offset: birthData.timezone_offset,
          name: `Retorno Solar ${year} — ${chart.name}`,
        },
        () => setSrError(t("common.error.waking")),
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Error" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      setSrError(null);
      const srChart = await res.json();
      saveSolarReturn(id, srChart);
      router.push(`/retorno/${id}`);
    } catch (e) {
      setSrError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoadingSR(false);
    }
  }

  if (!chart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 font-mono text-sm">{t("chart.loading")}</p>
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
            <span className="text-blue-600 font-semibold">{chart.ascendant.sign}</span> {t("chart.ascendant")} ·{" "}
            <span className="text-sky-500">{t("chart.mc")} {chart.midheaven.sign}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton variant="secondary" accent="blue" onClick={handleOpenSummary}>
            {proUnlocked ? t("chart.nav.summary") : t("chart.pro.summary_locked")}
          </ActionButton>
          <ActionButton
            variant="secondary"
            accent="blue"
            onClick={() =>
              document.getElementById("topic-summaries-heading")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          >
            {t("chart.nav.topics")}
          </ActionButton>
          <ActionButton variant="secondary" accent="blue" onClick={handleSolarReturn} disabled={loadingSR}>
            <span className="inline-flex items-center justify-center w-3.5 text-amber-500">
              {loadingSR ? (
                <span className="inline-block w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                "☉"
              )}
            </span>
            <span>{t("chart.nav.solar")} {new Date().getFullYear()}</span>
          </ActionButton>
          <ActionButton variant="primary" accent="blue" onClick={handleCalcTransits} disabled={loadingTransits}>
            {loadingTransits ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("chart.nav.transits_loading")}
              </>
            ) : (
              t("chart.nav.transits")
            )}
          </ActionButton>
        </div>
      </div>

      {transitError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600 font-mono">
          {t("chart.error.transit")}: {transitError}
        </div>
      )}

      {srError && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700 font-mono">
          {t("chart.error.solar")}: {srError}
        </div>
      )}

      {loadingTransits && (
        <div className="mb-6 bg-white border border-border rounded-xl p-5 text-center shadow-card">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-700 text-sm font-mono mb-1">{t("chart.nav.transits_loading")}</p>
          <p className="text-slate-400 text-xs">{t("chart.loading_hint")}</p>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1 overflow-hidden">
            <div className="h-1 bg-blue-600 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      {/* Layout principal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Rueda zodiacal */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg text-slate-700">{t("chart.wheel.title")}</h2>
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
              {highlighted} — {t("chart.wheel.deselect")}
            </p>
          ) : (
            <p className="text-xs text-slate-400 text-center font-mono">
              {t("chart.wheel.hint")}
            </p>
          )}
        </div>

        {/* Tablas */}
        <div className="space-y-6">
          {/* Ángulos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-border rounded-xl p-4 shadow-card">
              <div className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1">{t("chart.ascendant")}</div>
              <div className="text-blue-600 font-mono text-lg font-semibold">{chart.ascendant.sign}</div>
              <div className="text-slate-500 font-mono text-sm">{chart.ascendant.degree_display}</div>
            </div>
            <div className="bg-white border border-border rounded-xl p-4 shadow-card">
              <div className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-1">{t("chart.mc")}</div>
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

      {/* Free topics + soft Pro unlock */}
      <div id="astro-pro-section">
        <TopicSummarySection
          topics={topics}
          isPro={proUnlocked}
          onUnlock={handleUnlockPro}
          tier1Aspects={tier1Aspects}
          intensityData={intensityData}
          onOpenTechnicalSummary={() => {
            setProUnlocked(true);
            setShowSummary(true);
          }}
          onCalcTransits={handleCalcTransits}
          chart={chart}
          chartId={id}
        />
      </div>

      <InterpretationModal
        target={modalTarget}
        allAspects={chart.aspects}
        onClose={() => setModalTarget(null)}
      />

      {showSummary && proUnlocked && (
        <ChartSummaryModal
          summary={generateChartSummary(chart)}
          name={chart.name}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  );
}
