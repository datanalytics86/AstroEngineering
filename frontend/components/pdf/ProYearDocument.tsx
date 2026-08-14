/**
 * AstroEngine Pro — Year Map (Celestial Laboratory).
 * 8 pages: cover → glance → who → tone → forecast → 4+4+4 months.
 * Display: Libre Baskerville. Body: IBM Plex Sans. Data: IBM Plex Mono.
 */

import type { ReactNode } from "react";
import {
  Circle,
  Document,
  G,
  Page,
  Path,
  Svg,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type {
  YearClimate,
  YearMapContent,
  YearMapWheel,
  YearMonthBlock,
} from "@/lib/year-map";
import { describeSector, makeToAngle, polarXY } from "@/lib/wheel-geometry";
import {
  ClimateBar,
  ClimateBg,
  ClimateInk,
  Fonts,
  Lab,
  TopicInk,
} from "./lab-theme";
import { registerLabFonts } from "./register-lab-fonts";

registerLabFonts();

function clip(text: string, n = 108): string {
  if (text.length <= n) return text;
  return `${text.slice(0, n).replace(/\s+\S*$/, "")}…`;
}

const s = StyleSheet.create({
  page: {
    backgroundColor: Lab.paper,
    paddingTop: 48,
    paddingBottom: 36,
    paddingHorizontal: 36,
    fontFamily: Fonts.sans,
    color: Lab.ink,
  },
  mast: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: Lab.navy,
    paddingHorizontal: 36,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mastText: {
    color: Lab.ivory,
    fontSize: 8,
    fontFamily: Fonts.mono,
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.6,
    borderTopColor: Lab.hair,
    paddingTop: 6,
  },
  footerText: { fontSize: 7.5, color: Lab.slate, fontFamily: Fonts.mono, letterSpacing: 0.4 },
  kicker: {
    fontSize: 8,
    letterSpacing: 2.6,
    textTransform: "uppercase",
    color: Lab.copper,
    fontFamily: Fonts.mono,
    marginBottom: 8,
  },
  display: { fontFamily: Fonts.serif, fontSize: 30, lineHeight: 1.08, color: Lab.ink },
  displaySm: { fontFamily: Fonts.serif, fontSize: 18, lineHeight: 1.15, color: Lab.ink },
  italic: { fontFamily: Fonts.serif, fontStyle: "italic", fontSize: 13, lineHeight: 1.35, color: Lab.ink },
  h: { fontSize: 9, fontFamily: Fonts.mono, letterSpacing: 1.6, textTransform: "uppercase", color: Lab.copper, marginBottom: 6 },
  p: { fontSize: 10, lineHeight: 1.45, color: Lab.slate, marginBottom: 5, fontFamily: Fonts.sans },
  small: { fontSize: 8.5, lineHeight: 1.4, color: Lab.slate, fontFamily: Fonts.sans },
  rule: { height: 0.8, backgroundColor: Lab.copper, marginVertical: 10 },
  hair: { height: 0.5, backgroundColor: Lab.hair, marginVertical: 8 },
  row: { flexDirection: "row", gap: 12 },
  col: { flexGrow: 1, flexShrink: 1 },
  step: { flexDirection: "row", gap: 7, marginBottom: 5, alignItems: "flex-start" },
  stepN: {
    width: 13,
    fontSize: 8,
    fontFamily: Fonts.mono,
    color: Lab.copper,
    marginTop: 1,
  },
  cell: { borderWidth: 0.8, borderRadius: 3, padding: 7, flexGrow: 1 },
  cellName: { fontFamily: Fonts.serif, fontSize: 11, marginBottom: 3 },
  cellWhy: { fontSize: 8, lineHeight: 1.35, fontFamily: Fonts.sans },
  badge: {
    fontSize: 7,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    fontFamily: Fonts.mono,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  monthCard: {
    borderWidth: 0.7,
    borderColor: Lab.hair,
    borderRadius: 3,
    padding: 8,
    marginBottom: 7,
    backgroundColor: Lab.wash,
  },
  monthHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  monthName: { fontFamily: Fonts.serif, fontSize: 13 },
  ask: { fontSize: 10, lineHeight: 1.38, color: Lab.ink, marginBottom: 5, fontFamily: Fonts.sans },
  feat: { flexDirection: "row", gap: 5, marginBottom: 3, alignItems: "flex-start" },
  featBar: { width: 2.2, height: 16, marginTop: 1 },
  featTitle: { fontSize: 8, fontFamily: Fonts.mono, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 1 },
  featLine: { fontSize: 8.5, color: Lab.slate, lineHeight: 1.32 },
  restRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 3 },
  restItem: { width: "50%", fontSize: 8, color: Lab.slate, lineHeight: 1.3, marginBottom: 2, paddingRight: 5 },
  barTrack: { height: 4, backgroundColor: Lab.hair, borderRadius: 2 },
  barFill: { height: 4, borderRadius: 2 },
  glanceCell: {
    width: "32%",
    borderWidth: 0.7,
    borderRadius: 2,
    padding: 7,
    marginBottom: 7,
    marginRight: "1.3%",
  },
  inventory: { fontSize: 8.5, fontFamily: Fonts.mono, color: Lab.slate, lineHeight: 1.55, letterSpacing: 0.3 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: Lab.hair,
    paddingVertical: 5,
    alignItems: "flex-start",
  },
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
  const sample = Boolean(content.sample);
  const en = content.lang === "en";
  return (
    <Page size="A4" style={s.page}>
      <View style={s.mast} fixed>
        <Text style={s.mastText}>
          {sample
            ? `ASTROENGINE  ·  ${content.year}  ·  ${en ? "SAMPLE" : "EJEMPLO"}`
            : `ASTROENGINE  ·  YEAR MAP  ·  ${content.year}`}
        </Text>
        <Text style={s.mastText}>{String(page).padStart(2, "0")}</Text>
      </View>
      {children}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>
          {content.name.toUpperCase()}
        </Text>
        <Text style={s.footerText}>
          {en ? "INSTRUMENT — NOT A HOROSCOPE" : "INSTRUMENTO — NO UN HORÓSCOPO"}
        </Text>
      </View>
    </Page>
  );
}

function Badge({ climate, label }: { climate: YearClimate; label: string }) {
  return (
    <Text style={[s.badge, { color: ClimateInk[climate], backgroundColor: ClimateBg[climate] }]}>
      {label}
    </Text>
  );
}

function IntensityBar({ value, climate, width }: { value: number; climate: YearClimate; width: number }) {
  const fill = Math.max(4, Math.min(width, (value / 10) * width));
  return (
    <View style={[s.barTrack, { width }]}>
      <View style={[s.barFill, { width: fill, backgroundColor: ClimateBar[climate] }]} />
    </View>
  );
}

function LifeWheel({ wheel }: { wheel: YearMapWheel }) {
  const cx = 112;
  const cy = 112;
  const toAngle = makeToAngle(wheel.ascLongitude);
  const zones = [...wheel.zones].sort((a, b) => a.house - b.house);
  return (
    <Svg width={224} height={224} viewBox="0 0 224 224">
      <Circle cx={cx} cy={cy} r={108} fill={Lab.wash} />
      {zones.map((z, i) => {
        const next = zones[(i + 1) % zones.length];
        const start = toAngle(z.cuspLongitude);
        let end = toAngle(next.cuspLongitude);
        if (end <= start) end += 360;
        const mid = start + (end - start) / 2;
        const labelPt = polarXY(cx, cy, 94, mid);
        return (
          <G key={z.house}>
            <Path
              d={describeSector(cx, cy, 58, 86, start, end)}
              fill={z.color}
              fillOpacity={0.28}
              stroke={Lab.copper}
              strokeWidth={0.4}
            />
            <Text
              x={labelPt.x}
              y={labelPt.y + 2}
              style={{ fontSize: 5.2, fill: Lab.slate, textAnchor: "middle", fontFamily: Fonts.mono }}
            >
              {z.label}
            </Text>
          </G>
        );
      })}
      <Circle cx={cx} cy={cy} r={58} fill={Lab.paper} stroke={Lab.hair} strokeWidth={0.7} />
      {wheel.dots.map((d, i) => {
        const pt = polarXY(cx, cy, 45, toAngle(d.longitude));
        return <Circle key={`${d.role}-${i}`} cx={pt.x} cy={pt.y} r={2.8} fill={d.color} />;
      })}
      <Circle cx={cx} cy={cy} r={3} fill={Lab.copper} />
    </Svg>
  );
}

function MonthCard({ month }: { month: YearMonthBlock }) {
  const featured = month.featured?.length ? month.featured : month.topics.slice(0, 2);
  const rest = month.rest?.length ? month.rest : month.topics.slice(2);
  return (
    <View style={s.monthCard} wrap={false}>
      <View style={s.monthHead}>
        <Text style={s.monthName}>{month.label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <IntensityBar value={month.intensity} climate={month.climate} width={56} />
          <Badge climate={month.climate} label={month.climateLabel} />
        </View>
      </View>
      <Text style={s.ask}>{month.executive}</Text>
      {featured.map((f) => (
        <View key={f.id} style={s.feat}>
          <View style={[s.featBar, { backgroundColor: TopicInk[f.id] ?? Lab.copper }]} />
          <View style={{ flexGrow: 1 }}>
            <Text style={[s.featTitle, { color: TopicInk[f.id] ?? Lab.copper }]}>{f.title}</Text>
            <Text style={s.featLine}>{f.line}</Text>
          </View>
        </View>
      ))}
      <View style={s.restRow}>
        {rest.map((r) => (
          <Text key={r.id} style={s.restItem}>
            {r.title}  ·  {r.feel ?? r.line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const TOTAL = 8;

export default function ProYearDocument({ content }: { content: YearMapContent }) {
  const en = content.lang === "en";
  const chunks = [
    content.months.slice(0, 4),
    content.months.slice(4, 8),
    content.months.slice(8, 12),
  ];
  const keyMonths = content.keyMonths ?? [];
  const legend = content.climateLegend ?? [];
  const howTo = content.howTo ?? [];
  const moves = content.forecast.moves ?? [];
  const remaining = content.forecast.remaining ?? [];

  return (
    <Document
      title={en ? `${content.name} · year map ${content.year}` : `${content.name} · mapa del año ${content.year}`}
      author="AstroEngine"
      subject={en ? "Personal year instrument" : "Instrumento personal del año"}
      language={en ? "en" : "es"}
    >
      {/* 1 · COVER */}
      <Chrome content={content} page={1} total={TOTAL}>
        <View style={{ marginTop: 18 }}>
          <Text style={s.kicker}>{en ? "PERSONAL YEAR INSTRUMENT" : "INSTRUMENTO DEL AÑO"}</Text>
          <Text style={s.display}>{content.name}</Text>
          <Text style={{ fontFamily: Fonts.mono, fontSize: 11, color: Lab.copper, marginTop: 6, letterSpacing: 1.4 }}>
            {content.year}
          </Text>
          <Text style={[s.small, { marginTop: 6 }]}>
            {[content.born, content.place].filter(Boolean).join("  ·  ")}
          </Text>
          <View style={s.rule} />
          <Text style={s.italic}>
            {en
              ? "Not a horoscope. A laboratory map: climate, key months, and what each life area asks — written so you can use it."
              : "No es un horóscopo. Un mapa de laboratorio: clima, meses clave y lo que pide cada área — escrito para usarlo."}
          </Text>
          {content.sample ? (
            <Text style={[s.small, { marginTop: 6 }]}>
              {en ? "Sample document. Your Pro uses your sky." : "Documento de muestra. Tu Pro usa tu cielo."}
            </Text>
          ) : null}
          <Text style={[s.inventory, { marginTop: 10 }]}>
            {en
              ? "01  YEAR AT A GLANCE     02  WHO YOU ARE     03  TONE OF THE YEAR\n04  OPERATING TABLE      05–07  TWELVE MONTH INSTRUMENTS"
              : "01  EL AÑO DE UN VISTAZO     02  QUIÉN ERES     03  TONO DEL AÑO\n04  TABLA DE OPERACIÓN        05–07  DOCE FICHAS DEL MES"}
          </Text>
        </View>
        <View style={{ marginTop: 14 }}>
          <Text style={s.h}>{en ? "How to read" : "Cómo se lee"}</Text>
          {howTo.map((step, i) => (
            <View key={step} style={s.step}>
              <Text style={s.stepN}>{String(i + 1).padStart(2, "0")}</Text>
              <Text style={[s.p, { marginBottom: 0, flexGrow: 1 }]}>{step}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 10 }}>
          <Text style={s.h}>{en ? "Hold these months" : "Estos meses pesan"}</Text>
          <View style={{ flexDirection: "row", gap: 7 }}>
            {keyMonths.map((k) => (
              <View
                key={k.key}
                style={[s.cell, { borderColor: ClimateBar[k.climate], backgroundColor: ClimateBg[k.climate] }]}
              >
                <Text style={[s.cellName, { color: ClimateInk[k.climate] }]}>{k.label}</Text>
                <Badge climate={k.climate} label={k.climateLabel} />
                <Text style={[s.cellWhy, { color: ClimateInk[k.climate], marginTop: 4 }]}>{k.executive}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 7, marginTop: 12 }}>
          {legend.map((c) => (
            <View
              key={c.climate}
              style={[s.cell, { borderColor: ClimateBar[c.climate], backgroundColor: ClimateBg[c.climate] }]}
            >
              <Text style={{ fontFamily: Fonts.mono, fontSize: 8, color: ClimateInk[c.climate], letterSpacing: 1 }}>
                {c.label.toUpperCase()}
              </Text>
              <Text style={[s.small, { color: ClimateInk[c.climate], marginTop: 3 }]}>{c.hint}</Text>
            </View>
          ))}
        </View>
      </Chrome>

      {/* 2 · GLANCE — the page they pin */}
      <Chrome content={content} page={2} total={TOTAL}>
        <Text style={s.kicker}>{en ? "YEAR AT A GLANCE" : "EL AÑO DE UN VISTAZO"}</Text>
        <Text style={s.displaySm}>{content.yearPulse.headline}</Text>
        <Text style={[s.p, { marginTop: 6, marginBottom: 10 }]}>{content.yearPulse.body}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {content.months.map((m) => (
            <View
              key={m.key}
              style={[
                s.glanceCell,
                { borderColor: ClimateBar[m.climate], backgroundColor: ClimateBg[m.climate] },
              ]}
              wrap={false}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text style={{ fontFamily: Fonts.mono, fontSize: 8, color: ClimateInk[m.climate] }}>
                  {m.shortLabel.toUpperCase()}
                </Text>
                <Text style={{ fontFamily: Fonts.mono, fontSize: 7, color: ClimateInk[m.climate] }}>
                  {m.climateLabel}
                </Text>
              </View>
              <IntensityBar value={m.intensity} climate={m.climate} width={128} />
              <Text style={{ fontSize: 8.5, lineHeight: 1.32, color: ClimateInk[m.climate], marginTop: 5 }}>
                {clip(m.executive)}
              </Text>
            </View>
          ))}
        </View>
        <View style={s.hair} />
        <Text style={s.h}>{en ? "Three moves" : "Tres movimientos"}</Text>
        {moves.map((mv, i) => (
          <View key={mv} style={s.step}>
            <Text style={s.stepN}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={[s.p, { marginBottom: 0 }]}>{mv}</Text>
          </View>
        ))}
      </Chrome>

      {/* 3 · WHO */}
      <Chrome content={content} page={3} total={TOTAL}>
        <Text style={s.kicker}>{en ? "WHO YOU ARE" : "QUIÉN ERES"}</Text>
        <View style={s.row}>
          <View style={{ width: 224 }}>
            <LifeWheel wheel={content.natalWheel} />
          </View>
          <View style={s.col}>
            <Text style={s.italic}>{content.natal.headline}</Text>
            <Text style={[s.p, { marginTop: 8 }]}>{content.natal.identity}</Text>
            <Text style={s.p}>{content.natal.emotion}</Text>
            <Text style={s.p}>{content.natal.purpose}</Text>
          </View>
        </View>
        <View style={s.rule} />
        <View style={s.row}>
          <View style={s.col}>
            <Text style={s.h}>{en ? "To lean on" : "En qué apoyarte"}</Text>
            {content.natal.strengths.map((line) => (
              <Text key={line} style={s.p}>·  {line}</Text>
            ))}
          </View>
          <View style={s.col}>
            <Text style={s.h}>{en ? "To practice" : "Dónde practicar"}</Text>
            {content.natal.challenges.map((line) => (
              <Text key={line} style={s.p}>·  {line}</Text>
            ))}
            <Text style={[s.small, { marginTop: 4 }]}>{content.natal.advice}</Text>
          </View>
        </View>
      </Chrome>

      {/* 4 · TONE */}
      <Chrome content={content} page={4} total={TOTAL}>
        <Text style={s.kicker}>{en ? "TONE OF THE YEAR" : "TONO DEL AÑO"}</Text>
        <View style={s.row}>
          <View style={{ width: 224 }}>
            <LifeWheel wheel={content.solarWheel} />
            <Text style={[s.small, { textAlign: "center", marginTop: 4 }]}>
              {content.solarIsOwn
                ? en
                  ? "This cycle’s opening — life zones"
                  : "Apertura de este ciclo — zonas de vida"
                : en
                  ? "From your natal sky (solar return not calculated)"
                  : "Desde tu cielo natal (sin retorno solar)"}
            </Text>
          </View>
          <View style={s.col}>
            <Text style={s.italic}>{content.solar.headline}</Text>
            <Text style={[s.p, { marginTop: 8 }]}>{content.solar.body}</Text>
            <Text style={s.p}>{content.solar.publicMark}</Text>
            <Text style={{ fontSize: 10, fontFamily: Fonts.sans, fontWeight: 600, color: Lab.ink, lineHeight: 1.4 }}>
              {content.solar.practice}
            </Text>
          </View>
        </View>
        <View style={{ marginTop: 10 }}>
          {content.months.map((m) => (
            <View key={m.key} style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
              <Text style={{ width: 28, fontSize: 7.5, fontFamily: Fonts.mono, color: Lab.slate }}>
                {m.shortLabel}
              </Text>
              <IntensityBar value={m.intensity} climate={m.climate} width={340} />
              <Text style={{ width: 64, fontSize: 7.5, fontFamily: Fonts.mono, color: ClimateInk[m.climate], marginLeft: 6 }}>
                {m.climateLabel}
              </Text>
            </View>
          ))}
        </View>
      </Chrome>

      {/* 5 · FORECAST */}
      <Chrome content={content} page={5} total={TOTAL}>
        <Text style={s.kicker}>{en ? "FROM HERE TO DECEMBER" : "DE AQUÍ A DICIEMBRE"}</Text>
        <Text style={s.displaySm}>{content.forecast.headline}</Text>
        <Text style={[s.p, { marginTop: 8 }]}>{content.forecast.body}</Text>
        <View style={s.rule} />
        <Text style={s.h}>{en ? "Operating table" : "Tabla de operación"}</Text>
        <View style={[s.tableRow, { borderBottomWidth: 1, borderBottomColor: Lab.copper }]}>
          <Text style={{ width: 78, fontSize: 7.5, fontFamily: Fonts.mono, color: Lab.copper, letterSpacing: 1 }}>
            {en ? "MONTH" : "MES"}
          </Text>
          <Text style={{ width: 70, fontSize: 7.5, fontFamily: Fonts.mono, color: Lab.copper, letterSpacing: 1 }}>
            {en ? "CLIMATE" : "CLIMA"}
          </Text>
          <Text style={{ flexGrow: 1, fontSize: 7.5, fontFamily: Fonts.mono, color: Lab.copper, letterSpacing: 1 }}>
            {en ? "WHAT IT ASKS" : "QUÉ PIDE"}
          </Text>
        </View>
        {remaining.map((m) => (
          <View key={m.key} style={s.tableRow} wrap={false}>
            <Text style={{ width: 78, fontSize: 9, fontFamily: Fonts.serif, color: Lab.ink }}>{m.label}</Text>
            <Text style={{ width: 70, fontSize: 8, fontFamily: Fonts.mono, color: ClimateInk[m.climate] }}>
              {m.climateLabel}
            </Text>
            <Text style={{ flexGrow: 1, fontSize: 9, color: Lab.slate, lineHeight: 1.35 }}>{m.executive}</Text>
          </View>
        ))}
      </Chrome>

      {/* 6–8 · MONTHS */}
      {chunks.map((group, gi) => (
        <Chrome key={gi} content={content} page={6 + gi} total={TOTAL}>
          <Text style={s.kicker}>
            {en
              ? `MONTH INSTRUMENTS  ·  ${group[0]?.shortLabel}–${group[group.length - 1]?.shortLabel}`
              : `FICHAS DEL MES  ·  ${group[0]?.shortLabel}–${group[group.length - 1]?.shortLabel}`}
          </Text>
          <Text style={[s.small, { marginBottom: 8 }]}>
            {en
              ? "Read the ask. Two areas get a full line. The rest is climate — not homework."
              : "Lee lo que pide. Dos áreas llevan línea completa. El resto es clima — no tarea."}
          </Text>
          {group.map((month) => (
            <MonthCard key={month.key} month={month} />
          ))}
          {gi === 2 && (
            <Text style={[s.small, { marginTop: 6 }]}>
              {en
                ? "Return on the first of each month. Do one thing the card asks. That is the whole instrument, used."
                : "Vuelve el día uno de cada mes. Haz una cosa que pide la ficha. Ese es el instrumento, usado."}
            </Text>
          )}
        </Chrome>
      ))}
    </Document>
  );
}
