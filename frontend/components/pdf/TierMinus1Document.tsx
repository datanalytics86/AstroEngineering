/**
 * Documento PDF Tier -1 (react-pdf).
 * A4, 5 páginas: portada + 6 secciones (2 por hoja) + cierre CTA.
 * Tipografía built-in (Helvetica / Times) para no pelear con CSP.
 */

import type { ReactNode } from "react";
import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
import type { HumanBadge, TierMinus1Content, TierMinus1Section, TopicId } from "@/lib/types";

const INK = "#1E293B";
const SLATE = "#475569";
const MUTED = "#94A3B8";
const RULE = "#E2E8F0";
const WASH = "#F8FAFC";
const PAPER = "#FFFEFB";
const ACCENT = "#2563EB";

const TOPIC_COLOR: Record<TopicId, string> = {
  amor: "#DB2777",
  dinero: "#059669",
  trabajo: "#2563EB",
  salud: "#D97706",
  familia: "#7C3AED",
  crecimiento: "#4F46E5",
};

const BADGE_TONE: Record<HumanBadge, { bg: string; fg: string; border: string }> = {
  potencial_fuerte: { bg: "#ECFDF5", fg: "#047857", border: "#A7F3D0" },
  equilibrado: { bg: "#F0F9FF", fg: "#0369A1", border: "#BAE6FD" },
  area_practica: { bg: "#FFFBEB", fg: "#B45309", border: "#FDE68A" },
};

const s = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    paddingTop: 48,
    paddingBottom: 44,
    paddingHorizontal: 52,
    fontFamily: "Helvetica",
    color: INK,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: MUTED,
    letterSpacing: 0.3,
  },
  // ── Cover ──
  coverKicker: {
    fontSize: 9,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: ACCENT,
    marginBottom: 28,
  },
  coverName: {
    fontFamily: "Times-Roman",
    fontSize: 32,
    lineHeight: 1.15,
    color: INK,
    marginBottom: 10,
  },
  coverTitle: {
    fontFamily: "Times-Italic",
    fontSize: 20,
    color: SLATE,
    marginBottom: 18,
  },
  coverMeta: {
    fontSize: 10,
    color: SLATE,
    lineHeight: 1.5,
    marginBottom: 28,
  },
  coverRule: {
    height: 1,
    backgroundColor: RULE,
    marginBottom: 22,
  },
  coverLead: {
    fontSize: 12,
    lineHeight: 1.55,
    color: SLATE,
    maxWidth: 380,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 36,
  },
  pill: {
    fontSize: 8,
    letterSpacing: 0.4,
    color: SLATE,
    borderWidth: 1,
    borderColor: RULE,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  brand: {
    position: "absolute",
    top: 28,
    left: 52,
    fontSize: 8,
    letterSpacing: 2.6,
    color: MUTED,
    textTransform: "uppercase",
  },
  // ── Section ──
  section: {
    marginBottom: 22,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitleBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexGrow: 1,
    paddingRight: 10,
  },
  bar: {
    width: 3,
    height: 16,
    borderRadius: 1,
  },
  sectionIndex: {
    fontSize: 8,
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: INK,
  },
  badge: {
    fontSize: 8,
    letterSpacing: 0.2,
    borderWidth: 1,
    borderRadius: 9,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  headline: {
    fontFamily: "Times-Italic",
    fontSize: 13,
    lineHeight: 1.35,
    color: INK,
    marginBottom: 10,
  },
  para: {
    fontSize: 10,
    lineHeight: 1.5,
    color: SLATE,
    marginBottom: 7,
  },
  tipsBox: {
    backgroundColor: WASH,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  tipsLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: MUTED,
    marginBottom: 5,
  },
  tip: {
    fontSize: 9.5,
    lineHeight: 1.4,
    color: INK,
    marginBottom: 3,
  },
  split: {
    height: 1,
    backgroundColor: RULE,
    marginVertical: 16,
  },
  // ── CTA ──
  ctaKicker: {
    fontSize: 9,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: ACCENT,
    marginTop: 36,
    marginBottom: 14,
  },
  ctaHeadline: {
    fontFamily: "Times-Roman",
    fontSize: 26,
    lineHeight: 1.2,
    color: INK,
    marginBottom: 16,
  },
  ctaBody: {
    fontSize: 11,
    lineHeight: 1.55,
    color: SLATE,
    maxWidth: 420,
    marginBottom: 22,
  },
  ctaBtn: {
    alignSelf: "flex-start",
    backgroundColor: ACCENT,
    color: "#FFFFFF",
    fontSize: 11,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  ctaUrl: {
    fontSize: 9,
    color: MUTED,
    marginTop: 10,
  },
});

function PageChrome({
  content,
  page,
  total,
  children,
}: {
  content: TierMinus1Content;
  page: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.brand}>ASTROENGINE</Text>
      {children}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>{content.footer}</Text>
        <Text style={s.footerText}>
          {content.name}  ·  {page}/{total}
        </Text>
      </View>
    </Page>
  );
}

function Badge({ section }: { section: TierMinus1Section }) {
  const tone = BADGE_TONE[section.badge];
  return (
    <Text
      style={[
        s.badge,
        { backgroundColor: tone.bg, color: tone.fg, borderColor: tone.border },
      ]}
    >
      {section.badgeLabel}
    </Text>
  );
}

function SectionBlock({
  section,
  index,
  tipsLabel,
}: {
  section: TierMinus1Section;
  index: number;
  tipsLabel: string;
}) {
  const color = TOPIC_COLOR[section.id];
  const num = String(index + 1).padStart(2, "0");
  return (
    <View style={s.section} wrap={false}>
      <View style={s.sectionHead}>
        <View style={s.sectionTitleBlock}>
          <View style={[s.bar, { backgroundColor: color }]} />
          <View>
            <Text style={s.sectionIndex}>{num}</Text>
            <Text style={s.sectionTitle}>{section.title}</Text>
          </View>
        </View>
        <Badge section={section} />
      </View>
      <Text style={s.headline}>{section.headline}</Text>
      {section.paragraphs.map((p, i) => (
        <Text key={i} style={s.para}>
          {p}
        </Text>
      ))}
      <View style={s.tipsBox}>
        <Text style={s.tipsLabel}>{tipsLabel}</Text>
        {section.tips.map((tip, i) => (
          <Text key={i} style={s.tip}>
            {i + 1}.  {tip}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function TierMinus1Document({ content }: { content: TierMinus1Content }) {
  const tipsLabel = content.lang === "en" ? "To practice" : "Para practicar";
  const meta = [content.birthDateLabel, content.birthTimeLabel, content.birthPlace]
    .filter(Boolean)
    .join("  ·  ");
  const pairs: [TierMinus1Section, TierMinus1Section][] = [
    [content.sections[0], content.sections[1]],
    [content.sections[2], content.sections[3]],
    [content.sections[4], content.sections[5]],
  ];

  return (
    <Document
      title={`${content.coverTitle} — ${content.name}`}
      author="AstroEngine"
      subject={content.coverLead}
      language={content.lang === "en" ? "en" : "es"}
    >
      <PageChrome content={content} page={1} total={5}>
        <View style={{ marginTop: 72 }}>
          <Text style={s.coverKicker}>{content.coverKicker}</Text>
          <Text style={s.coverName}>{content.name}</Text>
          <Text style={s.coverTitle}>{content.coverTitle}</Text>
          {meta ? <Text style={s.coverMeta}>{meta}</Text> : null}
          <View style={s.coverRule} />
          <Text style={s.coverLead}>{content.coverLead}</Text>
          <View style={s.pillRow}>
            {content.sections.map((sec) => (
              <Text key={sec.id} style={s.pill}>
                {sec.title}
              </Text>
            ))}
          </View>
        </View>
      </PageChrome>

      {pairs.map((pair, pageIdx) => (
        <PageChrome key={pageIdx} content={content} page={pageIdx + 2} total={5}>
          <View style={{ marginTop: 18 }}>
            <SectionBlock section={pair[0]} index={pageIdx * 2} tipsLabel={tipsLabel} />
            <View style={s.split} />
            <SectionBlock section={pair[1]} index={pageIdx * 2 + 1} tipsLabel={tipsLabel} />
          </View>
        </PageChrome>
      ))}

      <PageChrome content={content} page={5} total={5}>
        <View>
          <Text style={s.ctaKicker}>{content.ctaKicker}</Text>
          <Text style={s.ctaHeadline}>{content.ctaHeadline}</Text>
          <Text style={s.ctaBody}>{content.ctaBody}</Text>
          <Link src={content.ctaUrl} style={s.ctaBtn}>
            {content.ctaButton}
          </Link>
          <Text style={s.ctaUrl}>{content.ctaUrl}</Text>
        </View>
      </PageChrome>
    </Document>
  );
}
