/**
 * TIER 1 Pro year-map PDF — natal + solar tone + forecast + 12 months × 6 topics.
 * No planets, signs, houses, orbs on the page.
 */

import type { ReactNode } from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { YearMapContent, YearMonthBlock } from "@/lib/year-map";

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
    paddingTop: 46,
    paddingBottom: 42,
    paddingHorizontal: 48,
    fontFamily: "Helvetica",
    color: INK,
  },
  brand: {
    position: "absolute",
    top: 24,
    left: 48,
    fontSize: 8,
    letterSpacing: 2.4,
    color: MUTED,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 8, color: MUTED },
  kicker: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: ACCENT,
    marginBottom: 10,
  },
  name: { fontFamily: "Times-Roman", fontSize: 26, marginBottom: 8 },
  title: { fontFamily: "Times-Italic", fontSize: 16, color: SLATE, marginBottom: 10 },
  rule: { height: 1, backgroundColor: RULE, marginVertical: 12 },
  h: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 7, color: INK },
  p: { fontSize: 10, lineHeight: 1.5, color: SLATE, marginBottom: 7 },
  headline: { fontFamily: "Times-Italic", fontSize: 13, lineHeight: 1.35, marginBottom: 10 },
  card: {
    backgroundColor: WASH,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  monthTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  topicRow: { marginBottom: 3 },
  topicName: { fontSize: 8, letterSpacing: 1, color: ACCENT, textTransform: "uppercase", marginBottom: 1 },
  topicLine: { fontSize: 9, lineHeight: 1.4, color: SLATE },
});

function Chrome({
  content,
  page,
  total,
  children,
}: {
  content: YearMapContent;
  page: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.brand}>AstroEngine Pro · {content.year}</Text>
      {children}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>
          {content.lang === "en"
            ? "A personal year map. Not a lab report."
            : "Un mapa del año. No un informe de laboratorio."}
        </Text>
        <Text style={s.footerText}>
          {page} / {total}
        </Text>
      </View>
    </Page>
  );
}

function MonthCard({ month }: { month: YearMonthBlock }) {
  return (
    <View style={s.card} wrap={false}>
      <Text style={s.monthTitle}>{month.label}</Text>
      <Text style={s.p}>{month.executive}</Text>
      {month.topics.map((topic) => (
        <View key={topic.id} style={s.topicRow}>
          <Text style={s.topicName}>{topic.title}</Text>
          <Text style={s.topicLine}>{topic.line}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ProYearDocument({ content }: { content: YearMapContent }) {
  const pairs: YearMonthBlock[][] = [];
  for (let i = 0; i < content.months.length; i += 2) {
    pairs.push(content.months.slice(i, i + 2));
  }
  const total = 4 + pairs.length;
  const t = content.lang === "en";

  return (
    <Document>
      <Chrome content={content} page={1} total={total}>
        <View style={{ marginTop: 36 }}>
          <Text style={s.kicker}>{t ? "Your year map" : "Tu mapa del año"}</Text>
          <Text style={s.name}>{content.name}</Text>
          <Text style={s.title}>{content.year}</Text>
          <View style={s.rule} />
          <Text style={s.headline}>{content.natal.headline}</Text>
          <Text style={s.p}>
            {t
              ? "Who you are. How this year wants to feel. Twelve months, six life areas. Written so you can use it — not decode it."
              : "Quién eres. Cómo quiere sentirse este año. Doce meses, seis áreas. Escrito para usarlo — no para descifrarlo."}
          </Text>
        </View>
      </Chrome>

      <Chrome content={content} page={2} total={total}>
        <View style={{ marginTop: 18 }}>
          <Text style={s.kicker}>{t ? "Who you are" : "Quién eres"}</Text>
          <Text style={s.headline}>{content.natal.headline}</Text>
          <Text style={s.p}>{content.natal.identity}</Text>
          <Text style={s.p}>{content.natal.emotion}</Text>
          <Text style={s.p}>{content.natal.purpose}</Text>
          <View style={s.rule} />
          <Text style={s.h}>{t ? "To lean on" : "En qué apoyarte"}</Text>
          {content.natal.strengths.map((line) => (
            <Text key={line} style={s.p}>
              · {line}
            </Text>
          ))}
          <Text style={s.h}>{t ? "To practice" : "Dónde practicar"}</Text>
          {content.natal.challenges.map((line) => (
            <Text key={line} style={s.p}>
              · {line}
            </Text>
          ))}
          <Text style={s.p}>{content.natal.advice}</Text>
        </View>
      </Chrome>

      <Chrome content={content} page={3} total={total}>
        <View style={{ marginTop: 18 }}>
          <Text style={s.kicker}>{t ? "The tone of the year" : "El tono del año"}</Text>
          <Text style={s.headline}>{content.solar.headline}</Text>
          <Text style={s.p}>{content.solar.body}</Text>
          <Text style={s.p}>{content.solar.publicMark}</Text>
          <View style={s.rule} />
          <Text style={s.h}>{content.yearPulse.headline}</Text>
          <Text style={s.p}>{content.yearPulse.body}</Text>
        </View>
      </Chrome>

      <Chrome content={content} page={4} total={total}>
        <View style={{ marginTop: 18 }}>
          <Text style={s.kicker}>{t ? "From here to December" : "De aquí a diciembre"}</Text>
          <Text style={s.headline}>{content.forecast.headline}</Text>
          <Text style={s.p}>{content.forecast.body}</Text>
          <View style={s.rule} />
          {content.forecast.remaining.map((m) => (
            <Text key={m.key} style={s.p}>
              {m.label} — {m.executive}
            </Text>
          ))}
        </View>
      </Chrome>

      {pairs.map((pair, idx) => (
        <Chrome key={pair[0].key} content={content} page={5 + idx} total={total}>
          <View style={{ marginTop: 18 }}>
            <Text style={s.kicker}>
              {t ? "Month by month · six areas" : "Mes a mes · seis áreas"}
            </Text>
            {pair.map((month) => (
              <MonthCard key={month.key} month={month} />
            ))}
          </View>
        </Chrome>
      ))}
    </Document>
  );
}
