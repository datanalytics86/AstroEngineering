/**
 * TIER 1 Pro year-map PDF — natal wheel + reading, solar wheel + year tone,
 * remaining-year forecast, 12 executive months × 6 life areas.
 * No planets, signs, houses, orbs in the copy.
 */

import type { ReactNode } from "react";
import { Circle, Document, Line, Page, Svg, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { YearMapContent, YearMonthBlock } from "@/lib/year-map";

const INK = "#1E293B";
const SLATE = "#475569";
const MUTED = "#94A3B8";
const RULE = "#E2E8F0";
const WASH = "#F8FAFC";
const PAPER = "#FFFEFB";
const ACCENT = "#4F46E5";
const ACCENT_SOFT = "#C7D2FE";

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
  topicName: {
    fontSize: 8,
    letterSpacing: 1,
    color: ACCENT,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  topicLine: { fontSize: 9, lineHeight: 1.4, color: SLATE },
  wheelWrap: { alignItems: "center", marginVertical: 10 },
  wheelCaption: { fontSize: 8, color: MUTED, marginTop: 6, textAlign: "center" },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  barLabel: { width: 56, fontSize: 8, color: MUTED },
  barTrack: { width: 280, height: 6, backgroundColor: "#EEF2FF", borderRadius: 3 },
  barFill: { height: 6, backgroundColor: ACCENT, borderRadius: 3 },
});

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((180 - deg) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function PdfWheel({ points, stroke }: { points: number[]; stroke: string }) {
  const size = 200;
  const cx = 100;
  const cy = 100;
  const outer = 92;
  const inner = 34;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = i * 30;
    const a0 = polar(cx, cy, outer - 2, a);
    const a1 = polar(cx, cy, outer - 10, a);
    return { x1: a0.x, y1: a0.y, x2: a1.x, y2: a1.y, key: a };
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={cx} cy={cy} r={outer} stroke={stroke} strokeWidth={1.4} fill="#F8FAFC" />
      <Circle cx={cx} cy={cy} r={inner} stroke={ACCENT_SOFT} strokeWidth={1} fill="#FFFFFF" />
      {ticks.map((tk) => (
        <Line
          key={tk.key}
          x1={tk.x1}
          y1={tk.y1}
          x2={tk.x2}
          y2={tk.y2}
          stroke={ACCENT_SOFT}
          strokeWidth={1}
        />
      ))}
      {points.map((lon, i) => {
        const p = polar(cx, cy, 62, lon);
        return <Circle key={`${lon}-${i}`} cx={p.x} cy={p.y} r={3.2} fill={stroke} />;
      })}
      <Circle cx={cx} cy={cy} r={3} fill={stroke} />
    </Svg>
  );
}

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
  const sample = Boolean(content.sample);
  return (
    <Page size="A4" style={s.page}>
      <Text style={s.brand}>
        {sample
          ? `AstroEngine Pro · ${content.year} · ${content.lang === "en" ? "sample" : "ejemplo"}`
          : `AstroEngine Pro · ${content.year}`}
      </Text>
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
  const en = content.lang === "en";

  return (
    <Document
      title={en ? `${content.name} · year map ${content.year}` : `${content.name} · mapa del año ${content.year}`}
      author="AstroEngine"
      subject={en ? "Personal year map" : "Mapa personal del año"}
      language={en ? "en" : "es"}
    >
      <Chrome content={content} page={1} total={total}>
        <View style={{ marginTop: 28 }}>
          <Text style={s.kicker}>{en ? "Your year map" : "Tu mapa del año"}</Text>
          <Text style={s.name}>{content.name}</Text>
          <Text style={s.title}>{content.year}</Text>
          <View style={s.rule} />
          <Text style={s.headline}>{content.natal.headline}</Text>
          <Text style={s.p}>
            {en
              ? "Your chart. Who you are. How this year wants to feel. Twelve months, six life areas. Written so you can use it — not decode it."
              : "Tu carta. Quién eres. Cómo quiere sentirse este año. Doce meses, seis áreas. Escrito para usarlo — no para descifrarlo."}
          </Text>
          {content.sample && (
            <Text style={s.p}>
              {en
                ? "This is a sample. Your Pro uses your sky."
                : "Esto es un ejemplo. Tu Pro usa tu cielo."}
            </Text>
          )}
        </View>
      </Chrome>

      <Chrome content={content} page={2} total={total}>
        <View style={{ marginTop: 12 }}>
          <Text style={s.kicker}>{en ? "Your chart · who you are" : "Tu carta · quién eres"}</Text>
          <View style={s.wheelWrap}>
            <PdfWheel points={content.natalPoints} stroke={ACCENT} />
            <Text style={s.wheelCaption}>
              {en ? "Your natal chart" : "Tu carta natal"}
            </Text>
          </View>
          <Text style={s.headline}>{content.natal.headline}</Text>
          <Text style={s.p}>{content.natal.identity}</Text>
          <Text style={s.p}>{content.natal.emotion}</Text>
          <Text style={s.p}>{content.natal.purpose}</Text>
          <View style={s.rule} />
          <Text style={s.h}>{en ? "To lean on" : "En qué apoyarte"}</Text>
          {content.natal.strengths.map((line) => (
            <Text key={line} style={s.p}>
              · {line}
            </Text>
          ))}
          <Text style={s.h}>{en ? "To practice" : "Dónde practicar"}</Text>
          {content.natal.challenges.map((line) => (
            <Text key={line} style={s.p}>
              · {line}
            </Text>
          ))}
          <Text style={s.p}>{content.natal.advice}</Text>
        </View>
      </Chrome>

      <Chrome content={content} page={3} total={total}>
        <View style={{ marginTop: 12 }}>
          <Text style={s.kicker}>{en ? "The tone of this year" : "El tono de este año"}</Text>
          <View style={s.wheelWrap}>
            <PdfWheel points={content.solarPoints} stroke="#0F766E" />
            <Text style={s.wheelCaption}>
              {en ? "This year's chart" : "La carta de este año"}
            </Text>
          </View>
          <Text style={s.headline}>{content.solar.headline}</Text>
          <Text style={s.p}>{content.solar.body}</Text>
          <Text style={s.p}>{content.solar.publicMark}</Text>
          <View style={s.rule} />
          <Text style={s.h}>{content.yearPulse.headline}</Text>
          <Text style={s.p}>{content.yearPulse.body}</Text>
          <View style={{ marginTop: 8 }}>
            {content.months.map((m) => (
              <View key={m.key} style={s.barRow}>
                <Text style={s.barLabel}>{m.label}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: Math.round((m.intensity / 10) * 280) }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </Chrome>

      <Chrome content={content} page={4} total={total}>
        <View style={{ marginTop: 12 }}>
          <Text style={s.kicker}>{en ? "From here to December" : "De aquí a diciembre"}</Text>
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
          <View style={{ marginTop: 12 }}>
            <Text style={s.kicker}>
              {en ? "Month by month · six areas" : "Mes a mes · seis áreas"}
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
