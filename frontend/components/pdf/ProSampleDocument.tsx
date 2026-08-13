/**
 * PDF de muestra Pro — 5 páginas A4, datos ficticios.
 * CTA final: /nueva?from=pro_sample_pdf (nunca la home).
 */

import type { ReactNode } from "react";
import { Document, Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";
import type { ProSampleContent } from "@/lib/pro-sample";

const INK = "#1E293B";
const SLATE = "#475569";
const MUTED = "#94A3B8";
const RULE = "#E2E8F0";
const WASH = "#F8FAFC";
const PAPER = "#FFFEFB";
const ACCENT = "#4F46E5";

const s = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    paddingTop: 48,
    paddingBottom: 44,
    paddingHorizontal: 52,
    fontFamily: "Helvetica",
    color: INK,
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
  footer: {
    position: "absolute",
    bottom: 22,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: MUTED },
  kicker: {
    fontSize: 9,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: ACCENT,
    marginBottom: 12,
  },
  name: { fontFamily: "Times-Roman", fontSize: 28, marginBottom: 8 },
  title: { fontFamily: "Times-Italic", fontSize: 18, color: SLATE, marginBottom: 12 },
  meta: { fontSize: 10, color: SLATE, marginBottom: 20 },
  rule: { height: 1, backgroundColor: RULE, marginBottom: 18 },
  lead: { fontSize: 12, lineHeight: 1.5, color: SLATE, maxWidth: 400 },
  h: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 8, color: INK },
  p: { fontSize: 10, lineHeight: 1.5, color: SLATE, marginBottom: 7 },
  headline: { fontFamily: "Times-Italic", fontSize: 13, lineHeight: 1.35, marginBottom: 10 },
  card: {
    backgroundColor: WASH,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  pair: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  orb: { fontSize: 8, color: "#6D28D9" },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  barLabel: { width: 28, fontSize: 8, color: MUTED },
  barTrack: { width: 280, height: 6, backgroundColor: "#EEF2FF", borderRadius: 3 },
  barFill: { height: 6, backgroundColor: ACCENT, borderRadius: 3 },
  areaTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  ctaBtn: {
    alignSelf: "flex-start",
    backgroundColor: ACCENT,
    color: "#FFFFFF",
    fontSize: 11,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  ctaUrl: { fontSize: 9, color: MUTED, marginTop: 10 },
});

function Chrome({
  content,
  page,
  children,
}: {
  content: ProSampleContent;
  page: number;
  children: ReactNode;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.brand}>ASTROENGINE · SAMPLE</Text>
      {children}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>{content.footer}</Text>
        <Text style={s.footerText}>{page}/5</Text>
      </View>
    </Page>
  );
}

export default function ProSampleDocument({ content }: { content: ProSampleContent }) {
  return (
    <Document
      title={content.coverTitle}
      author="AstroEngine"
      subject={content.coverLead}
      language={content.lang === "en" ? "en" : "es"}
    >
      <Chrome content={content} page={1}>
        <View style={{ marginTop: 70 }}>
          <Text style={s.kicker}>{content.coverKicker}</Text>
          <Text style={s.name}>{content.name}</Text>
          <Text style={s.title}>{content.coverTitle}</Text>
          <Text style={s.meta}>{content.meta}</Text>
          <View style={s.rule} />
          <Text style={s.lead}>{content.coverLead}</Text>
        </View>
      </Chrome>

      <Chrome content={content} page={2}>
        <View style={{ marginTop: 18 }}>
          <Text style={s.h}>{content.whoTitle}</Text>
          <Text style={s.headline}>{content.headline}</Text>
          <Text style={s.p}>{content.identity}</Text>
          <Text style={s.p}>{content.emotion}</Text>
          <Text style={s.p}>{content.purpose}</Text>
        </View>
      </Chrome>

      <Chrome content={content} page={3}>
        <View style={{ marginTop: 18 }}>
          <Text style={s.h}>{content.tier1Title}</Text>
          {content.tier1.map((row) => (
            <View key={`${row.left}-${row.right}`} style={s.card} wrap={false}>
              <Text style={s.p}>{row.impact}</Text>
            </View>
          ))}
        </View>
      </Chrome>

      <Chrome content={content} page={4}>
        <View style={{ marginTop: 18 }}>
          <Text style={s.h}>{content.yearTitle}</Text>
          <Text style={s.p}>{content.yearReading}</Text>
          <View style={{ marginTop: 10, marginBottom: 16 }}>
            {content.months.map((m) => (
              <View key={m.label} style={s.barRow}>
                <Text style={s.barLabel}>{m.label}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: Math.round((m.value / 10) * 280) }]} />
                </View>
              </View>
            ))}
          </View>
          <Text style={s.h}>{content.areasTitle}</Text>
          {content.areas.map((a) => (
            <View key={a.title} style={{ marginBottom: 8 }}>
              <Text style={s.areaTitle}>{a.title}</Text>
              <Text style={s.p}>{a.line}</Text>
            </View>
          ))}
        </View>
      </Chrome>

      <Chrome content={content} page={5}>
        <View style={{ marginTop: 36 }}>
          <Text style={s.kicker}>{content.ctaKicker}</Text>
          <Text style={s.title}>{content.ctaHeadline}</Text>
          <Text style={s.p}>{content.ctaBody}</Text>
          <Text style={s.p}>{content.note}</Text>
          <Link src={content.ctaUrl} style={s.ctaBtn}>
            {content.ctaButton}
          </Link>
          <Text style={s.ctaUrl}>{content.ctaUrl}</Text>
        </View>
      </Chrome>
    </Document>
  );
}
