"use client";

/**
 * Freemium section: 6 topic cards (free) + Pro panel
 * (TIER1 aspects, intensity chart, technical summary access).
 */

import { useState } from "react";
import type {
  Aspect,
  ChartResponse,
  IntensityPoint,
  StrengthLevel,
  TierMinus1Content,
  TierMinus1Section,
} from "@/lib/types";
import ActionButton from "@/components/ActionButton";
import PersonalIntensityChart from "@/components/PersonalIntensityChart";
import DownloadPreviewPdfButton from "@/components/DownloadPreviewPdfButton";
import { useT } from "@/lib/i18n";
import { trackLearning } from "@/lib/learning";
import { downloadProYearPdf } from "@/lib/download-preview-pdf";
import type { YearMapContent } from "@/lib/year-map";
import Disclaimer from "@/components/Disclaimer";
import ProOffer, { type TeaserMonth } from "@/components/ProOffer";
import type { BirthData } from "@/lib/types";
import type { YearMapContentV2 } from "@/lib/pro/build-year-map";

export interface TopicSummarySectionProps {
  preview: TierMinus1Content;
  isPro: boolean;
  onUnlock?: () => void;
  tier1Aspects: Aspect[];
  intensityData: IntensityPoint[];
  onOpenTechnicalSummary?: () => void;
  onCalcYear?: () => void;
  yearLoading?: boolean;
  yearError?: string | null;
  chart?: ChartResponse;
  chartId?: string;
  onSolar?: () => void;
  solarLoading?: boolean;
  yearMap?: YearMapContent | null;
  yearMapV2?: YearMapContentV2 | null;
  birth?: BirthData | null;
  teaserMonths?: TeaserMonth[];
  keyDateCount?: number;
  currentHeadline?: string;
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

function TopicCard({
  topic,
  onOpened,
}: {
  topic: TierMinus1Section;
  onOpened?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const level = BADGE_TO_STRENGTH[topic.badge] ?? "media";
  const style = STRENGTH_STYLE[level] ?? STRENGTH_STYLE.media;
  const accent = TOPIC_ACCENT[topic.id] ?? "#6366F1";
  const { t } = useT();

  return (
    <article
      className="bg-card border border-slate-200 rounded-xl overflow-hidden shadow-card flex flex-col min-h-[44px] hover:border-slate-300 transition-colors"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <button
        type="button"
        onClick={() =>
          setOpen((v) => {
            const next = !v;
            if (next) onOpened?.();
            return next;
          })
        }
        className="text-left px-4 py-4 sm:px-5 w-full min-h-[48px] hover:bg-elev/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-ink text-base leading-snug">
              {topic.title}
            </h3>
            <p className="text-sm text-ink-2 mt-1.5 leading-snug">
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
              className="text-[10px] sm:text-xs bg-elev text-ink-2 px-2 py-0.5 rounded-full border border-slate-100"
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
            <p key={i} className="text-sm text-ink-2 leading-relaxed">
              {p}
            </p>
          ))}
          {topic.tips.length > 0 && (
            <div className="bg-elev border border-slate-100 rounded-lg px-3 py-3 space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-ink-3 font-mono">
                {t("chart.topics.tips")}
              </p>
              <ul className="space-y-1.5">
                {topic.tips.map((tip) => (
                  <li key={tip} className="text-sm text-ink-2 leading-snug">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {topic.id === "salud" && (
            <p className="text-xs text-ink-3">{t("topic.disclaimer.health")}</p>
          )}
          {topic.id === "dinero" && (
            <p className="text-xs text-ink-3">{t("topic.disclaimer.money")}</p>
          )}
        </div>
      )}
    </article>
  );
}

export default function TopicSummarySection({
  preview,
  isPro,
  intensityData,
  yearLoading = false,
  chartId,
  yearMap = null,
  yearMapV2 = null,
  birth = null,
  teaserMonths = [],
  keyDateCount = 0,
  currentHeadline,
}: TopicSummarySectionProps) {
  const { t } = useT();
  const [topicsOpened, setTopicsOpened] = useState(0);
  const [pdfTaken, setPdfTaken] = useState(false);
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [yearPdfBusy, setYearPdfBusy] = useState(false);

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
              className="font-semibold text-2xl sm:text-3xl text-ink tracking-tight"
            >
              {t("chart.topics.title")}
            </h2>
            <p className="text-sm sm:text-base text-ink-2 mt-2 leading-relaxed">
              {t("chart.topics.subtitle")}
            </p>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2">
            <span className="self-start sm:self-end text-[10px] sm:text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {t("chart.topics.free_badge")}
            </span>
            {isPro && yearMap ? (
              <ActionButton
                variant="secondary"
                accent="indigo"
                className="min-h-[48px]"
                disabled={yearPdfBusy}
                onClick={async () => {
                  setYearPdfBusy(true);
                  try {
                    await downloadProYearPdf(yearMap);
                  } finally {
                    setYearPdfBusy(false);
                  }
                }}
              >
                {yearPdfBusy ? t("chart.pro.year.downloading") : t("chart.pro.year.pdf")}
              </ActionButton>
            ) : (
              <DownloadPreviewPdfButton
                content={preview}
                onDownloaded={() => setPdfTaken(true)}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {preview.sections.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onOpened={() => {
                setTopicsOpened((n) => n + 1);
                trackLearning("topics_opened");
              }}
            />
          ))}
        </div>
        {!isPro && (topicsOpened >= 2 || pdfTaken) && (
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-ink-2">{t("chart.pro.soft_chip")}</p>
            <button
              type="button"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 min-h-[44px] text-left"
              onClick={() =>
                document
                  .getElementById("pro-unlock-panel")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              {t("chart.pro.soft_chip_cta")}
            </button>
          </div>
        )}
      </div>

      {/* PRO block — engineering upgrade */}
      <div
        id="pro-unlock-panel"
        className="rounded-2xl border border-indigo-100 bg-elev overflow-hidden shadow-card"
      >
        <div className="border-l-4 border-indigo-500 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-xl">
              <p className="text-xs font-mono uppercase tracking-widest text-accent mb-1.5">
                {t("chart.pro.badge")}
              </p>
              <h3 className="font-semibold text-lg sm:text-xl text-ink">
                {isPro ? t("chart.pro.title_unlocked") : t("chart.pro.teaser.title")}
              </h3>
              <p className="text-sm text-ink-2 mt-1.5 leading-relaxed">
                {isPro
                  ? t("chart.pro.unlocked_subtitle_paid")
                  : t("chart.pro.teaser.body")}
              </p>
              <Disclaimer className="mt-2" />
            </div>
            {isPro ? (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-600 text-white">
                {t("chart.pro.unlocked_badge")}
              </span>
            ) : (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-card text-ink-2 border border-slate-200">
                {t("chart.pro.locked_badge")}
              </span>
            )}
          </div>

          {!isPro && (
            <ProOffer
              birth={birth ?? null}
              chartId={chartId}
              months={teaserMonths}
              keyDateCount={keyDateCount}
              currentHeadline={currentHeadline}
            />
          )}



          {isPro && yearMapV2 && (
            <div className="space-y-6 pt-2 border-t border-slate-200/80">
              {yearLoading && (
                <p className="text-sm text-ink-2">{t("chart.pro.year.loading")}</p>
              )}
              <p className="text-xs text-ink-3">
                {yearMapV2.window.start} → {yearMapV2.window.end}
              </p>
              <div className="space-y-2">
                {yearMapV2.months.map((month) => {
                  const open = openMonth === month.key;
                  return (
                    <article
                      key={month.key}
                      className="bg-card border border-slate-100 rounded-xl overflow-hidden"
                    >
                      <button
                        type="button"
                        className="w-full text-left px-4 py-3 min-h-[52px]"
                        onClick={() => setOpenMonth(open ? null : month.key)}
                        aria-expanded={open}
                      >
                        <p className="font-semibold text-ink">
                          {month.label} · {t(
                            month.climate === "apretado"
                              ? "pro.climate.apretado"
                              : month.climate === "suave"
                                ? "pro.climate.suave"
                                : month.climate === "parejo"
                                  ? "pro.climate.parejo"
                                  : "pro.climate.abierto",
                          )}
                        </p>
                        <p className="text-sm text-ink-2 mt-1 leading-snug">{month.headline}</p>
                      </button>
                      {open && (
                        <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-3">
                          <p className="text-sm text-ink-2">{month.action}</p>
                          <p className="text-sm text-ink-3">{month.avoid}</p>
                          {Object.entries(month.areas).map(([id, line]) => (
                            <p key={id} className="text-sm text-ink-2">
                              <span className="text-[11px] uppercase tracking-widest text-accent mr-2">
                                {id}
                              </span>
                              {line}
                            </p>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {isPro && yearMap && !yearMapV2 && (
            <div className="space-y-8 pt-2 border-t border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <ActionButton
                  variant="primary"
                  accent="indigo"
                  className="w-full sm:w-auto min-h-[48px]"
                  disabled={yearPdfBusy}
                  onClick={async () => {
                    setYearPdfBusy(true);
                    try {
                      await downloadProYearPdf(yearMap);
                    } finally {
                      setYearPdfBusy(false);
                    }
                  }}
                >
                  {yearPdfBusy ? t("chart.pro.year.downloading") : t("chart.pro.year.pdf")}
                </ActionButton>
                {yearLoading && (
                  <p className="text-sm text-ink-2">{t("chart.pro.year.loading")}</p>
                )}
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-ink-3 mb-3">
                  {t("chart.pro.section.summary")}
                </h4>
                <div className="bg-card border border-slate-100 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-indigo-700 leading-snug">
                    {yearMap.natal.headline}
                  </p>
                  <p className="text-sm text-ink-2 leading-relaxed">{yearMap.natal.purpose}</p>
                  <p className="text-sm text-ink-2 leading-relaxed">{yearMap.natal.advice}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-ink-3 mb-3">
                  {t("chart.pro.solar.title")}
                </h4>
                <div className="bg-card border border-slate-100 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-ink">{yearMap.solar.headline}</p>
                  <p className="text-sm text-ink-2 leading-relaxed">{yearMap.solar.body}</p>
                  <p className="text-sm text-ink-2 leading-relaxed">{yearMap.solar.publicMark}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-ink-3 mb-3">
                  {t("chart.pro.forecast.title")}
                </h4>
                <div className="bg-card border border-slate-100 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-ink">{yearMap.forecast.headline}</p>
                  <p className="text-sm text-ink-2 leading-relaxed">{yearMap.forecast.body}</p>
                  <p className="text-sm text-ink-2 leading-relaxed">{yearMap.yearPulse.body}</p>
                </div>
                {intensityData.length > 0 && (
                  <div className="bg-card border border-slate-100 rounded-xl p-3 sm:p-4 mt-3">
                    <PersonalIntensityChart data={intensityData} />
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-ink-3 mb-3">
                  {t("chart.pro.months.title")}
                </h4>
                <div className="space-y-2">
                  {yearMap.months.map((month) => {
                    const open = openMonth === month.key;
                    return (
                      <article
                        key={month.key}
                        className="bg-card border border-slate-100 rounded-xl overflow-hidden"
                      >
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 min-h-[52px]"
                          onClick={() => setOpenMonth(open ? null : month.key)}
                          aria-expanded={open}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-ink">{month.label}</p>
                              <p className="text-sm text-ink-2 mt-1 leading-snug">
                                {month.executive}
                              </p>
                            </div>
                            <span className="text-xs text-accent shrink-0 mt-1">
                              {open ? t("chart.pro.month.close") : t("chart.pro.month.open")}
                            </span>
                          </div>
                        </button>
                        {open && (
                          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                            {month.topics.map((topic) => (
                              <div key={topic.id}>
                                <p className="text-[11px] uppercase tracking-widest text-accent mb-1">
                                  {topic.title}
                                </p>
                                <p className="text-sm text-ink-2 leading-snug">{topic.line}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
