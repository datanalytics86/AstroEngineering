"use client";

/**
 * Freemium section: 6 topic cards (free) + Pro panel
 * (TIER1 aspects, intensity chart, technical summary access).
 */

import { useMemo, useState } from "react";
import type {
  Aspect,
  ChartResponse,
  IntensityPoint,
  StrengthLevel,
  TierMinus1Content,
  TierMinus1Section,
  TransitEvent,
} from "@/lib/types";
import { groupTransitsByTopic } from "@/lib/topic-summary";
import { generateChartSummary } from "@/lib/chart-summary";
import { loadYearTransits } from "@/lib/storage";
import ActionButton from "@/components/ActionButton";
import PersonalIntensityChart from "@/components/PersonalIntensityChart";
import DownloadPreviewPdfButton from "@/components/DownloadPreviewPdfButton";
import { useT, type Lang } from "@/lib/i18n";
import { ASPECT_COLORS } from "@/lib/zodiac-utils";

export interface TopicSummarySectionProps {
  preview: TierMinus1Content;
  isPro: boolean;
  onUnlock: () => void;
  tier1Aspects: Aspect[];
  intensityData: IntensityPoint[];
  onOpenTechnicalSummary?: () => void;
  onCalcTransits?: () => void;
  chart?: ChartResponse;
  chartId?: string;
}

const STRENGTH_STYLE: Record<
  StrengthLevel,
  { bg: string; text: string; border: string }
> = {
  alta: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  media: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
  },
  desafio: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
};

const TOPIC_ACCENT: Record<string, string> = {
  amor: "#EC4899",
  dinero: "#10B981",
  trabajo: "#3B82F6",
  salud: "#F59E0B",
  familia: "#8B5CF6",
  crecimiento: "#6366F1",
};

const BADGE_TO_STRENGTH: Record<string, StrengthLevel> = {
  potencial_fuerte: "alta",
  equilibrado: "media",
  area_practica: "desafio",
};

function TopicCard({ topic }: { topic: TierMinus1Section }) {
  const [open, setOpen] = useState(false);
  const level = BADGE_TO_STRENGTH[topic.badge] ?? "media";
  const style = STRENGTH_STYLE[level] ?? STRENGTH_STYLE.media;
  const accent = TOPIC_ACCENT[topic.id] ?? "#6366F1";
  const { t } = useT();

  return (
    <article
      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card flex flex-col min-h-[44px] hover:border-slate-300 transition-colors"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-left px-4 py-4 sm:px-5 w-full min-h-[48px] hover:bg-slate-50/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 text-base leading-snug">
              {topic.title}
            </h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-snug">
              {topic.headline}
            </p>
          </div>
          <span
            className={`shrink-0 text-[10px] sm:text-xs font-mono px-2 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}
          >
            {topic.badgeLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {topic.keywords.slice(0, 3).map((k) => (
            <span
              key={k}
              className="text-[10px] sm:text-xs bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-100"
            >
              {k}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end">
          <span className="text-xs text-blue-600 font-mono" aria-hidden>
            {open ? "▴" : "▾"}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 space-y-3 border-t border-slate-100 pt-3">
          {topic.paragraphs.map((p, i) => (
            <p key={i} className="text-sm text-slate-700 leading-relaxed">
              {p}
            </p>
          ))}
          {topic.tips.length > 0 && (
            <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-3 space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">
                {t("chart.topics.tips")}
              </p>
              <ul className="space-y-1.5">
                {topic.tips.map((tip) => (
                  <li key={tip} className="text-sm text-slate-700 leading-snug">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Tier1List({ aspects, emptyLabel }: { aspects: Aspect[]; emptyLabel: string }) {
  if (aspects.length === 0) {
    return <p className="text-sm text-slate-500 font-mono">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2">
      {aspects.map((a, i) => (
        <li
          key={`${a.planet1}-${a.aspect_name}-${a.planet2}-${i}`}
          className="text-xs sm:text-sm font-mono text-slate-700 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 flex flex-wrap items-center gap-2 min-h-[44px]"
        >
          <span>{a.planet1}</span>
          <span style={{ color: ASPECT_COLORS[a.nature] ?? "#64748B" }}>
            {a.aspect_symbol} {a.aspect_name}
          </span>
          <span>{a.planet2}</span>
          <span className="text-violet-600 ml-auto">
            {a.orb.toFixed(2)}°
            {a.applying ? " ↗" : " ↘"}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function TopicSummarySection({
  preview,
  isPro,
  onUnlock,
  tier1Aspects,
  intensityData,
  onOpenTechnicalSummary,
  onCalcTransits,
  chart,
  chartId,
}: TopicSummarySectionProps) {
  const { t, lang } = useT();
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const locale: Lang = lang === "en" ? "en" : "es";

  const technical = useMemo(
    () => (isPro && chart ? generateChartSummary(chart) : null),
    [isPro, chart]
  );

  const transitPreview = useMemo(() => {
    if (!isPro || !chart || !chartId) return null;
    const year = new Date().getFullYear();
    const data = loadYearTransits(chartId, year);
    if (!data) return null;
    const events: TransitEvent[] = [
      ...data.current_transits,
      ...data.timeline.flatMap((m) => m.transits_active),
    ];
    const seen = new Set<string>();
    const unique = events.filter((e) => {
      const k = `${e.transit_planet}|${e.aspect_name}|${e.natal_planet}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return groupTransitsByTopic(chart.planets, unique, locale);
  }, [isPro, chart, chartId, locale]);

  return (
    <section className="space-y-8" aria-labelledby="topic-summaries-heading">
      {/* FREE: 6 topic cards — dominant value */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-widest text-blue-600 mb-1.5">
              {t("chart.topics.badge")}
            </p>
            <h2
              id="topic-summaries-heading"
              className="font-semibold text-2xl sm:text-3xl text-slate-900 tracking-tight"
            >
              {t("chart.topics.title")}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-2 leading-relaxed">
              {t("chart.topics.subtitle")}
            </p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2">
            <span className="self-start sm:self-end text-[10px] sm:text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {t("chart.topics.free_badge")}
            </span>
            <DownloadPreviewPdfButton content={preview} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {preview.sections.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      </div>

      {/* PRO block — engineering upgrade */}
      <div
        id="pro-unlock-panel"
        className="rounded-2xl border border-indigo-100 bg-slate-50 overflow-hidden shadow-card"
      >
        <div className="border-l-4 border-indigo-500 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl">
              <p className="text-xs font-mono uppercase tracking-widest text-indigo-600 mb-1.5">
                {t("chart.pro.badge")}
              </p>
              <h3 className="font-semibold text-lg sm:text-xl text-slate-900">
                {isPro ? t("chart.pro.title_unlocked") : t("chart.pro.teaser.title")}
              </h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                {isPro ? t("chart.pro.unlocked_subtitle") : t("chart.pro.teaser.body")}
              </p>
            </div>
            {isPro ? (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-600 text-white">
                {t("chart.pro.unlocked_badge")}
              </span>
            ) : (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white text-slate-500 border border-slate-200">
                {t("chart.pro.locked_badge")}
              </span>
            )}
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              t("chart.pro.feature.summary"),
              t("chart.pro.feature.tier1"),
              t("chart.pro.feature.intensity"),
              t("chart.pro.feature.transits"),
            ].map((label) => (
              <li
                key={label}
                className="text-xs sm:text-sm text-slate-600 bg-white border border-slate-100 rounded-lg px-3 py-2.5 flex items-start gap-2 min-h-[44px]"
              >
                <span className="text-indigo-500 mt-0.5 shrink-0 font-mono" aria-hidden>
                  {isPro ? "✓" : "·"}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>

          {!isPro && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
              <ActionButton
                variant="primary"
                accent="indigo"
                onClick={onUnlock}
                className="w-full sm:w-auto min-h-[48px] text-base"
              >
                {t("chart.pro.unlock_cta")}
              </ActionButton>
              <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
                {t("chart.pro.unlock_note")}
              </p>
            </div>
          )}

          {isPro && (
            <div className="space-y-6 pt-2 border-t border-slate-200/80">
              {/* Technical summary */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs uppercase tracking-widest text-slate-400 font-mono">
                    {t("chart.pro.section.summary")}
                  </h4>
                  {onOpenTechnicalSummary && (
                    <ActionButton
                      variant="secondary"
                      accent="blue"
                      onClick={onOpenTechnicalSummary}
                      className="!py-2 !px-3 text-xs min-h-[44px]"
                    >
                      {t("chart.pro.open_summary")}
                    </ActionButton>
                  )}
                </div>
                {technical && (
                  <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-indigo-600">{technical.headline}</p>
                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                      {technical.core_identity}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {technical.life_purpose}
                    </p>
                  </div>
                )}
              </div>

              {/* TIER1 aspects */}
              <div>
                <h4 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-3">
                  {t("chart.pro.tier1.title")}
                </h4>
                <Tier1List aspects={tier1Aspects} emptyLabel={t("chart.pro.tier1_empty")} />
              </div>

              {/* Personal intensity */}
              <div>
                <h4 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-3">
                  {t("chart.pro.intensity.title")}
                </h4>
                <div className="bg-white border border-slate-100 rounded-xl p-3 sm:p-4">
                  <PersonalIntensityChart data={intensityData} />
                  {intensityData.length === 0 && onCalcTransits && (
                    <div className="mt-3 flex justify-center">
                      <ActionButton
                        variant="secondary"
                        accent="indigo"
                        onClick={onCalcTransits}
                        className="min-h-[44px]"
                      >
                        {t("chart.pro.intensity.cta_transits")}
                      </ActionButton>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  {t("chart.pro.intensity.explain")}
                </p>
              </div>

              {/* Transit preview by topic — only with real data */}
              <div>
                <h4 className="text-xs uppercase tracking-widest text-slate-400 font-mono mb-3">
                  {t("chart.pro.section.transits")}
                </h4>
                {transitPreview && transitPreview.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {transitPreview.map((g) => (
                      <div
                        key={g.topicId}
                        className="bg-white border border-slate-100 rounded-xl p-3"
                      >
                        <button
                          type="button"
                          className="w-full text-left flex items-center justify-between gap-2 min-h-[44px]"
                          onClick={() =>
                            setExpandedTopic((prev) =>
                              prev === g.topicId ? null : g.topicId
                            )
                          }
                        >
                          <span className="text-sm font-semibold text-slate-800">{g.title}</span>
                          <span className="text-xs font-mono text-slate-400">{g.items.length}</span>
                        </button>
                        {(expandedTopic === g.topicId || expandedTopic === null) && (
                          <ul className="mt-2 space-y-1">
                            {(expandedTopic === g.topicId
                              ? g.items
                              : g.items.slice(0, 2)
                            ).map((item, i) => (
                              <li
                                key={i}
                                className="text-xs font-mono text-slate-600 leading-snug"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-slate-200 rounded-xl p-4 text-sm text-slate-500 space-y-3">
                    <p>{t("chart.pro.transits_empty")}</p>
                    {onCalcTransits && (
                      <ActionButton
                        variant="secondary"
                        accent="indigo"
                        onClick={onCalcTransits}
                        className="min-h-[44px]"
                      >
                        {t("chart.pro.intensity.cta_transits")}
                      </ActionButton>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
