/**
 * TIER 1 Pro year-map PDF.
 * Cover (how-to + key months) → natal life-zone wheel → year climate →
 * forecast → 12 usable month cards → close.
 * No planets, signs, houses, orbs in the copy.
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

/** Celestial Laboratory on paper. Contrast vs ivory (measured): navy 14.3 · mute 7.9 · copper 7.4 */
const INK = "#142033";
const SLATE = "#3D4A5C";
const MUTED = "#3D4A5C";
const RULE = "#D4CBB8";
const WASH = "#EFE8D8";
const PAPER = "#F4EFE4";
const ACCENT = "#6B4423";
const NAVY = "#142033";

const CLIMATE_INK: Record<YearClimate, string> = {
  apretado: "#9A3412",
  abierto: "#065F46",
  suave: "#1E3A5F",
};
const CLIMATE_BG: Record<YearClimate, string> = {
  apretado: "#FFF7ED",
  abierto: "#ECFDF5",
  suave: "#EEF4F8",
};
const CLIMATE_BAR: Record<YearClimate, string> = {
  apretado: "#C2410C",
  abierto: "#0F766E",
  suave: "#1E3A5F",
};

const TOPIC_COLOR: Record<string, string> = {
  amor: "#9A3412",
  dinero: "#065F46",
  trabajo: "#1E3A5F",
  salud: "#6B4423",
  familia: "#3D4A5C",
  crecimiento: "#142033",
};

const s = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    paddingTop: 44,
    paddingBottom: 40,
    paddingHorizontal: 38,
    fontFamily: "Helvetica",
    color: INK,
  },
  brand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 22,
    backgroundColor: NAVY,
    color: "#F4EFE4",
    fontSize: 8,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    paddingTop: 6,
    paddingHorizontal: 38,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 8, color: SLATE },
  kicker: {
    fontSize: 9,
    letterSpacing: 2.2,
    textTransform: "uppercase",
    color: ACCENT,
    marginBottom: 8,
  },
  name: { fontFamily: "Times-Roman", fontSize: 28, marginBottom: 4, lineHeight: 1.08 },
  title: { fontFamily: "Times-Italic", fontSize: 16, color: SLATE, marginBottom: 8 },
  rule: { height: 1.5, backgroundColor: ACCENT, marginVertical: 11 },
  h: { fontSize: 11, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 6 },
  p: { fontSize: 10.5, lineHeight: 1.45, color: SLATE, marginBottom: 6 },
  small: { fontSize: 9, lineHeight: 1.4, color: SLATE },
  headline: { fontFamily: "Times-Italic", fontSize: 14, lineHeight: 1.32, marginBottom: 8 },
  row: { flexDirection: "row", gap: 14 },
  col: { flexGrow: 1, flexShrink: 1 },
  step: { flexDirection: "row", gap: 8, marginBottom: 6, alignItems: "flex-start" },
  stepN: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ACCENT,
    color: "#fff",
    fontSize: 8,
    textAlign: "center",
    paddingTop: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  chipName: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  chipWhy: { fontSize: 8, lineHeight: 1.35 },
  badge: {
    fontSize: 7.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  monthCard: {
    borderWidth: 1,
    borderColor: RULE,
    borderRadius: 7,
    padding: 10,
    marginBottom: 8,
    backgroundColor: WASH,
  },
  monthHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  monthName: { fontFamily: "Times-Roman", fontSize: 14 },
  ask: { fontSize: 11, lineHeight: 1.4, color: INK, marginBottom: 6 },
  feat: { flexDirection: "row", gap: 6, marginBottom: 4, alignItems: "flex-start" },
  featBar: { width: 3, height: 20, borderRadius: 1, marginTop: 1 },
  featTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 1 },
  featLine: { fontSize: 9.5, color: SLATE, lineHeight: 1.35 },
  pills: { marginTop: 4, flexDirection: "row", flexWrap: "wrap" },
  pill: {
    width: "50%",
    fontSize: 8.5,
    color: SLATE,
    lineHeight: 1.35,
    marginBottom: 3,
    paddingRight: 6,
  },
  brandText: {
    color: "#F4EFE4",
    fontSize: 8,
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  barTrack: { height: 5, backgroundColor: RULE, borderRadius: 3 },
  barFill: { height: 5, borderRadius: 3 },
  legendRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  legendItem: { flexGrow: 1, borderWidth: 1, borderRadius: 5, padding: 7 },
  legendTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  move: { flexDirection: "row", gap: 8, marginBottom: 5, alignItems: "flex-start" },
  moveN: {
    width: 12,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    marginTop: 1,
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
      <View style={s.brand}>
        <Text style={s.brandText}>
          {sample
            ? `ASTROENGINE  ·  ${content.year}  ·  ${en ? "SAMPLE" : "EJEMPLO"}`
            : `ASTROENGINE  ·  LABORATORY  ·  ${content.year}`}
        </Text>
      </View>
      {children}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>
          {en ? "A personal year map. Not a lab report." : "Un mapa del año. No un informe de laboratorio."}
        </Text>
        <Text style={s.footerText}>
          {page}/{total}
        </Text>
      </View>
    </Page>
  );
}

function ClimateBadge({ climate, label }: { climate: YearClimate; label: string }) {
  return (
    <Text
      style={[
        s.badge,
        { color: CLIMATE_INK[climate], backgroundColor: CLIMATE_BG[climate] },
      ]}
    >
      {label}
    </Text>
  );
}

function IntensityBar({
  value,
  climate,
  width,
}: {
  value: number;
  climate: YearClimate;
  width: number;
}) {
  const fill = Math.max(5, Math.min(width, (value / 10) * width));
  return (
    <View style={[s.barTrack, { width }]}>
      <View style={[s.barFill, { width: fill, backgroundColor: CLIMATE_BAR[climate] }]} />
    </View>
  );
}

function LifeWheel({ wheel }: { wheel: YearMapWheel }) {
  const cx = 118;
  const cy = 118;
  const toAngle = makeToAngle(wheel.ascLongitude);
  const zones = [...wheel.zones].sort((a, b) => a.house - b.house);
  return (
    <Svg width={236} height={236} viewBox="0 0 236 236">
      <Circle cx={cx} cy={cy} r={114} fill="#F8FAFC" />
      {zones.map((z, i) => {
        const next = zones[(i + 1) % zones.length];
        const start = toAngle(z.cuspLongitude);
        let end = toAngle(next.cuspLongitude);
        if (end <= start) end += 360;
        const mid = start + (end - start) / 2;
        const labelPt = polarXY(cx, cy, 100, mid);
        return (
          <G key={z.house}>
            <Path
              d={describeSector(cx, cy, 62, 92, start, end)}
              fill={z.color}
              fillOpacity={0.22}
              stroke={z.color}
              strokeWidth={0.7}
            />
            <Text
              x={labelPt.x}
              y={labelPt.y + 2}
              style={{
                fontSize: 5.4,
                fill: "#334155",
                textAnchor: "middle",
                fontFamily: "Helvetica",
              }}
            >
              {z.label}
            </Text>
          </G>
        );
      })}
      <Circle cx={cx} cy={cy} r={62} fill="#FFFEFB" stroke="#E2E8F0" strokeWidth={0.8} />
      {wheel.dots.map((d, i) => {
        const pt = polarXY(cx, cy, 48, toAngle(d.longitude));
        return (
          <Circle key={`${d.role}-${i}`} cx={pt.x} cy={pt.y} r={3} fill={d.color} />
        );
      })}
      <Circle cx={cx} cy={cy} r={10} fill="#4F46E5" fillOpacity={0.12} />
      <Circle cx={cx} cy={cy} r={3.2} fill={ACCENT} />
    </Svg>
  );
}

function YearClimateWheel({
  months,
  year,
  size = 236,
}: {
  months: YearMonthBlock[];
  year: number;
  size?: number;
}) {
  const cx = 118;
  const cy = 118;
  return (
    <Svg width={size} height={size} viewBox="0 0 236 236">
      <Circle cx={cx} cy={cy} r={114} fill="#F8FAFC" />
      {months.map((m, i) => {
        const start = i * 30;
        const end = start + 30;
        const inner = 50;
        const outer = 70 + (m.intensity / 10) * 26;
        const labelPt = polarXY(cx, cy, 108, start + 15);
        return (
          <G key={m.key}>
            <Path
              d={describeSector(cx, cy, inner, outer, start, end)}
              fill={CLIMATE_BAR[m.climate]}
              fillOpacity={0.88}
              stroke="#FFFEFB"
              strokeWidth={1}
            />
            <Text
              x={labelPt.x}
              y={labelPt.y + 2}
              style={{
                fontSize: 6.2,
                fill: "#475569",
                textAnchor: "middle",
                fontFamily: "Helvetica-Bold",
              }}
            >
              {m.shortLabel}
            </Text>
          </G>
        );
      })}
      <Circle cx={cx} cy={cy} r={46} fill="#FFFEFB" />
      <Text
        x={cx}
        y={cy + 3}
        style={{
          fontSize: 9,
          fill: ACCENT,
          textAnchor: "middle",
          fontFamily: "Helvetica-Bold",
        }}
      >
        {String(year)}
      </Text>
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <IntensityBar value={month.intensity} climate={month.climate} width={72} />
          <ClimateBadge climate={month.climate} label={month.climateLabel} />
        </View>
      </View>
      <Text style={s.ask}>{month.executive}</Text>
      {featured.map((f) => (
        <View key={f.id} style={s.feat}>
          <View style={[s.featBar, { backgroundColor: TOPIC_COLOR[f.id] ?? ACCENT }]} />
          <View style={{ flexGrow: 1 }}>
            <Text style={s.featTitle}>{f.title}</Text>
            <Text style={s.featLine}>{f.line}</Text>
          </View>
        </View>
      ))}
      <View style={s.pills}>
        {rest.map((r) => (
          <Text key={r.id} style={s.pill}>
            {r.title} — {r.line}
          </Text>
        ))}
      </View>
    </View>
  );
}

const TOTAL = 9;

export default function ProYearDocument({ content }: { content: YearMapContent }) {
  const en = content.lang === "en";
  const chunks = [
    content.months.slice(0, 3),
    content.months.slice(3, 6),
    content.months.slice(6, 9),
    content.months.slice(9, 12),
  ];
  const roles = content.natalWheel.dots.filter(
    (d, i, arr) => arr.findIndex((x) => x.role === d.role) === i
  );
  const howTo = content.howTo ?? [];
  const keyMonths = content.keyMonths ?? [];
  const legend = content.climateLegend ?? [];
  const moves = content.forecast.moves ?? [];

  return (
    <Document
      title={en ? `${content.name} · year map ${content.year}` : `${content.name} · mapa del año ${content.year}`}
      author="AstroEngine"
      subject={en ? "Personal year map" : "Mapa personal del año"}
      language={en ? "en" : "es"}
    >
      <Chrome content={content} page={1} total={TOTAL}>
        <View style={{ marginTop: 40 }}>
          <Text style={s.kicker}>{en ? "YEAR MAP · PRO" : "MAPA DEL AÑO · PRO"}</Text>
          <Text style={s.name}>{content.name}</Text>
          <Text style={s.title}>
            {en ? `Your map of ${content.year}` : `Tu mapa de ${content.year}`}
          </Text>
          <Text style={s.p}>
            {en
              ? "This is not a report. It is a year operating system: climate, key months, and what each area asks — in language you can use."
              : "Esto no es un informe. Es un sistema operativo del año: clima, meses clave y lo que pide cada área — en lenguaje que se puede usar."}
          </Text>
          {content.sample && (
            <Text style={s.small}>
              {en ? "This is a sample. Your Pro uses your sky." : "Esto es un ejemplo. Tu Pro usa tu cielo."}
            </Text>
          )}
        </View>
        <View style={s.rule} />
        <Text style={s.h}>{en ? "How to use this map" : "Cómo usar este mapa"}</Text>
        {howTo.map((step, i) => (
          <View key={step} style={s.step}>
            <Text style={s.stepN}>{i + 1}</Text>
            <Text style={[s.p, { marginBottom: 0, flexGrow: 1 }]}>{step}</Text>
          </View>
        ))}
        <View style={{ marginTop: 12 }}>
          <Text style={s.h}>{en ? "Key months" : "Meses clave"}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {keyMonths.map((k) => (
              <View
                key={k.key}
                style={[
                  s.chip,
                  { borderColor: CLIMATE_BAR[k.climate], backgroundColor: CLIMATE_BG[k.climate] },
                ]}
              >
                <Text style={[s.chipName, { color: CLIMATE_INK[k.climate] }]}>{k.label}</Text>
                <Text style={[s.chipWhy, { color: CLIMATE_INK[k.climate] }]}>
                  {k.climateLabel} · {k.executive}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={s.legendRow}>
          {legend.map((c) => (
            <View
              key={c.climate}
              style={[
                s.legendItem,
                { borderColor: CLIMATE_BAR[c.climate], backgroundColor: CLIMATE_BG[c.climate] },
              ]}
            >
              <Text style={[s.legendTitle, { color: CLIMATE_INK[c.climate] }]}>{c.label}</Text>
              <Text style={[s.small, { color: CLIMATE_INK[c.climate] }]}>{c.hint}</Text>
            </View>
          ))}
        </View>
      </Chrome>

      <Chrome content={content} page={2} total={TOTAL}>
        <Text style={s.kicker}>{en ? "Who you are" : "Quién eres"}</Text>
        <View style={s.row}>
          <View style={{ width: 236 }}>
            <LifeWheel wheel={content.natalWheel} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {roles.slice(0, 8).map((d) => (
                <View key={d.role} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: d.color }} />
                  <Text style={{ fontSize: 7, color: SLATE }}>{d.role}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={s.col}>
            <Text style={s.headline}>{content.natal.headline}</Text>
            <Text style={s.p}>{content.natal.identity}</Text>
            <Text style={s.p}>{content.natal.emotion}</Text>
            <Text style={s.p}>{content.natal.purpose}</Text>
            <Text style={s.small}>{content.natal.emphasis}</Text>
          </View>
        </View>
        <View style={s.rule} />
        <View style={s.row}>
          <View style={s.col}>
            <Text style={s.h}>{en ? "What you already have" : "Lo que ya tienes"}</Text>
            {content.natal.strengths.map((line) => (
              <Text key={line} style={s.p}>
                ·  {line}
              </Text>
            ))}
          </View>
          <View style={s.col}>
            <Text style={s.h}>{en ? "Where to practice" : "Dónde practicar"}</Text>
            {content.natal.challenges.map((line) => (
              <Text key={line} style={s.p}>
                ·  {line}
              </Text>
            ))}
            <Text style={s.small}>{content.natal.advice}</Text>
          </View>
        </View>
      </Chrome>

      <Chrome content={content} page={3} total={TOTAL}>
        <Text style={s.kicker}>{en ? "The tone of this year" : "El tono de este año"}</Text>
        <View style={s.row}>
          <View style={{ width: 236 }}>
            <LifeWheel wheel={content.solarWheel} />
            <Text style={{ fontSize: 7.5, color: MUTED, textAlign: "center", marginTop: 4 }}>
              {content.solarIsOwn
                ? en
                  ? "This year's opening — life zones, not a lab chart"
                  : "La apertura de este año — zonas de vida, no una carta de laboratorio"
                : en
                  ? "Year map from your natal sky (calculate solar return for a distinct wheel)"
                  : "Mapa del año desde tu cielo natal (calcula el retorno solar para una rueda distinta)"}
            </Text>
          </View>
          <View style={s.col}>
            <Text style={s.headline}>{content.solar.headline}</Text>
            <Text style={s.p}>{content.solar.body}</Text>
            <Text style={s.p}>{content.solar.publicMark}</Text>
            <Text style={[s.p, { fontFamily: "Helvetica-Bold", color: INK }]}>
              {content.solar.practice}
            </Text>
            <Text style={[s.h, { marginTop: 8 }]}>{content.yearPulse.headline}</Text>
            <Text style={s.p}>{content.yearPulse.body}</Text>
          </View>
        </View>
        <View style={{ marginTop: 8, flexDirection: "row", gap: 12, alignItems: "center" }}>
          <YearClimateWheel months={content.months} year={content.year} size={168} />
          <View style={{ flexGrow: 1 }}>
            {content.months.map((m) => (
              <View key={m.key} style={{ flexDirection: "row", alignItems: "center", marginBottom: 2.5 }}>
                <Text style={{ width: 26, fontSize: 7, color: MUTED }}>{m.shortLabel}</Text>
                <IntensityBar value={m.intensity} climate={m.climate} width={168} />
                <Text style={{ width: 52, fontSize: 7, color: CLIMATE_INK[m.climate], marginLeft: 6 }}>
                  {m.climateLabel}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Chrome>

      <Chrome content={content} page={4} total={TOTAL}>
        <Text style={s.kicker}>{en ? "From now to December" : "De ahora a diciembre"}</Text>
        <Text style={[s.headline, { fontSize: 16 }]}>{content.forecast.headline}</Text>
        <Text style={[s.p, { fontSize: 11, lineHeight: 1.5 }]}>{content.forecast.body}</Text>
        <View style={s.rule} />
        <Text style={s.h}>{en ? "Three moves" : "Tres movimientos"}</Text>
        {moves.map((mv, i) => (
          <View key={mv} style={s.move}>
            <Text style={s.moveN}>{i + 1}.</Text>
            <Text style={[s.p, { marginBottom: 0, flexGrow: 1 }]}>{mv}</Text>
          </View>
        ))}
        <View style={{ marginTop: 12 }}>
          <Text style={s.h}>{en ? "Remaining months" : "Meses que quedan"}</Text>
          {content.forecast.remaining.map((m) => (
            <View
              key={`rem-${m.key}`}
              style={{
                flexDirection: "row",
                borderBottomWidth: 0.6,
                borderBottomColor: RULE,
                paddingVertical: 4,
                alignItems: "flex-start",
              }}
            >
              <Text style={{ width: 72, fontSize: 9, fontFamily: "Helvetica-Bold", color: INK }}>
                {m.label}
              </Text>
              <Text style={{ width: 62, fontSize: 8, color: CLIMATE_INK[m.climate] }}>
                {m.climateLabel}
              </Text>
              <Text style={{ flexGrow: 1, fontSize: 9, color: SLATE, lineHeight: 1.35 }}>
                {m.executive}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 14 }}>
          <Text style={s.h}>{en ? "Hold these months" : "Quédate con estos meses"}</Text>
          {keyMonths.map((k) => (
            <View
              key={k.key}
              style={[
                s.monthCard,
                { backgroundColor: CLIMATE_BG[k.climate], borderColor: CLIMATE_BAR[k.climate] },
              ]}
            >
              <View style={s.monthHead}>
                <Text style={s.monthName}>{k.label}</Text>
                <ClimateBadge climate={k.climate} label={k.climateLabel} />
              </View>
              <Text style={s.ask}>{k.executive}</Text>
            </View>
          ))}
        </View>
      </Chrome>

      {chunks.map((group, gi) => (
        <Chrome key={gi} content={content} page={5 + gi} total={TOTAL}>
          <Text style={s.kicker}>
            {en
              ? `Month cards · ${group[0]?.shortLabel}–${group[group.length - 1]?.shortLabel}`
              : `Fichas del mes · ${group[0]?.shortLabel}–${group[group.length - 1]?.shortLabel}`}
          </Text>
          <Text style={[s.small, { marginBottom: 8 }]}>
            {en
              ? "Read the ask first. Featured areas get a line. The rest is climate, not homework."
              : "Lee primero lo que pide el mes. Las áreas destacadas llevan una línea. El resto es clima, no tarea."}
          </Text>
          {group.map((month) => (
            <MonthCard key={month.key} month={month} />
          ))}
        </Chrome>
      ))}

      <Chrome content={content} page={9} total={TOTAL}>
        <Text style={s.kicker}>{en ? "KEEP THIS MAP" : "QUÉDATE CON ESTE MAPA"}</Text>
        <Text style={{ fontFamily: "Times-Roman", fontSize: 18, lineHeight: 1.2, marginBottom: 8 }}>
          {en
            ? "Print it, or open it on the first of each month."
            : "Imprímelo, o ábrelo el día uno de cada mes."}
        </Text>
        <Text style={s.p}>
          {en
            ? "The value is not reading it once. The value is returning when the month starts and doing one thing the card asks."
            : "El valor no es leerlo una vez. El valor es volver cuando empieza el mes y hacer una cosa que pide la ficha."}
        </Text>
        <View style={s.rule} />
        <Text style={s.h}>{en ? "Year at a glance" : "El año de un vistazo"}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {content.months.map((m) => (
            <View
              key={m.key}
              style={{
                width: "31%",
                borderWidth: 1,
                borderColor: CLIMATE_BAR[m.climate],
                backgroundColor: CLIMATE_BG[m.climate],
                borderRadius: 5,
                padding: 6,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: CLIMATE_INK[m.climate] }}>
                  {m.shortLabel}
                </Text>
                <Text style={{ fontSize: 7, color: CLIMATE_INK[m.climate] }}>{m.climateLabel}</Text>
              </View>
              <Text style={{ fontSize: 7.5, lineHeight: 1.3, color: CLIMATE_INK[m.climate] }}>
                {m.featured[0]?.title ?? ""} · {m.featured[0]?.feel ?? ""}
              </Text>
            </View>
          ))}
        </View>
        <View style={s.legendRow}>
          {legend.map((c) => (
            <View
              key={c.climate}
              style={[
                s.legendItem,
                { borderColor: CLIMATE_BAR[c.climate], backgroundColor: CLIMATE_BG[c.climate] },
              ]}
            >
              <Text style={[s.legendTitle, { color: CLIMATE_INK[c.climate] }]}>{c.label}</Text>
              <Text style={[s.small, { color: CLIMATE_INK[c.climate] }]}>{c.hint}</Text>
            </View>
          ))}
        </View>
        <View style={s.rule} />
        {howTo.map((step, i) => (
          <View key={`end-${step}`} style={s.step}>
            <Text style={s.stepN}>{i + 1}</Text>
            <Text style={[s.p, { marginBottom: 0, flexGrow: 1 }]}>{step}</Text>
          </View>
        ))}
      </Chrome>
    </Document>
  );
}
