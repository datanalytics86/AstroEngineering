import React from "react";
import { Text, View } from "@react-pdf/renderer";
import type { YearMapContent, YearMonthBlock } from "@/lib/year-map";
import { ClimateInk, Fonts, Lab, Layout, Space, TopicInk } from "../lab-theme";
import { copy } from "./copy";
import { LifeWheel } from "./LifeWheel";
import {
  Badge,
  Chrome,
  ClimateStrip,
  GlanceCell,
  Hair,
  IntensityBar,
  KeyMonthPlate,
  Kicker,
  PracticePlate,
  Rule,
  Steps,
  YearLog,
  YearRibbon,
} from "./primitives";
import { s } from "./styles";

export function CoverPage({ content }: { content: YearMapContent }) {
  const en = content.lang === "en";
  const t = copy(en);
  const keyMonths = content.keyMonths ?? [];
  const legend = content.climateLegend ?? [];
  const meta = [content.born, content.place].filter(Boolean).join("  ·  ");

  return (
    <Chrome content={content} page={1}>
      <View style={{ marginTop: Space[5] }}>
        <Kicker>{t.kickerCover}</Kicker>
        <Text style={s.display}>{content.name}</Text>
        <Text
          style={{
            fontFamily: Fonts.mono,
            fontSize: 10,
            color: Lab.copper,
            marginTop: 6,
            letterSpacing: 1.8,
          }}
        >
          {content.year}
        </Text>
        {meta ? <Text style={[s.small, { marginTop: 5 }]}>{meta}</Text> : null}
        <Rule />
        <Text style={s.lead}>{t.thesis}</Text>
        {content.sample ? <Text style={[s.small, { marginTop: 6 }]}>{t.sampleNote}</Text> : null}
      </View>

      <View style={{ marginTop: Space[6] }}>
        <Text style={s.label}>{t.holdThese}</Text>
        <View style={{ flexDirection: "row", gap: Layout.gutter }}>
          {keyMonths.map((k) => (
            <KeyMonthPlate key={k.key} month={k} />
          ))}
        </View>
      </View>

      <View style={{ marginTop: Space[5] }}>
        <ClimateStrip legend={legend} />
      </View>

      <View style={{ marginTop: Space[5] }}>
        <Text style={[s.label, { marginBottom: 5 }]}>{t.yearSpine}</Text>
        <YearRibbon months={content.months} keyKeys={new Set(keyMonths.map((m) => m.key))} />
      </View>

      <View style={{ marginTop: Space[4] }}>
        <Text style={[s.label, { marginBottom: 5 }]}>{t.contents}</Text>
        {t.plates.map(([n, label]) => (
          <View key={n} style={{ flexDirection: "row", marginBottom: 3 }}>
            <Text
              style={{
                width: 36,
                fontSize: 7.5,
                fontFamily: Fonts.mono,
                color: Lab.copper,
              }}
            >
              {n}
            </Text>
            <Text style={s.small}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: Space[5] }}>
        <Text style={s.label}>{t.holdHow}</Text>
        <Steps items={t.holdSteps} />
      </View>

      <Text style={[s.micro, { marginTop: Space[5] }]}>{t.serial(content.name, content.year)}</Text>
    </Chrome>
  );
}

export function GlancePage({ content }: { content: YearMapContent }) {
  const en = content.lang === "en";
  const t = copy(en);
  const keyKeys = new Set((content.keyMonths ?? []).map((m) => m.key));
  const moves = content.forecast.moves ?? [];

  return (
    <Chrome content={content} page={2}>
      <Kicker>{t.glance}</Kicker>
      <Text style={s.title}>{content.yearPulse.headline}</Text>
      <Text style={[s.body, { marginTop: 6, marginBottom: Space[4] }]}>{content.yearPulse.body}</Text>
      <YearRibbon months={content.months} keyKeys={keyKeys} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Layout.gutter }}>
        {content.months.map((m) => (
          <GlanceCell key={m.key} month={m} marked={keyKeys.has(m.key)} mark={t.keyMark} />
        ))}
      </View>
      <Hair />
      <Text style={s.label}>{t.moves}</Text>
      <Steps items={moves} />
    </Chrome>
  );
}

export function WhoPage({ content }: { content: YearMapContent }) {
  const en = content.lang === "en";
  const t = copy(en);

  return (
    <Chrome content={content} page={3}>
      <Kicker>{t.who}</Kicker>
      <View style={{ flexDirection: "row", gap: Layout.gutter }}>
        <View style={{ width: Layout.wheel }}>
          <LifeWheel wheel={content.natalWheel} zonesLabel={t.zones} />
        </View>
        <View style={{ width: Layout.text }}>
          <Text style={s.lead}>{content.natal.headline}</Text>
          <Text style={[s.body, { marginTop: Space[3], width: Layout.text }]}>{content.natal.identity}</Text>
          <Text style={[s.body, { width: Layout.text }]}>{content.natal.emotion}</Text>
          <Text style={[s.body, { width: Layout.text }]}>{content.natal.purpose}</Text>
          {content.natal.emphasis ? (
            <View
              style={{
                marginTop: Space[2],
                paddingLeft: Space[3],
                borderLeftWidth: Layout.rail,
                borderLeftColor: Lab.copper,
                width: Layout.text,
              }}
            >
              <Text style={[s.small, { color: Lab.ink, width: Layout.text - Space[3] }]}>
                {content.natal.emphasis}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Rule />
      <View style={{ flexDirection: "row", gap: Layout.gutter }}>
        <View
          style={{
            width: Layout.col2,
            minHeight: 118,
            borderWidth: 0.55,
            borderColor: Lab.hair,
            padding: Space[3],
          }}
        >
          <Text style={s.label}>{t.lean}</Text>
          {content.natal.strengths.map((line) => (
            <Text key={line} style={[s.body, { width: Layout.col2 - Space[5] }]}>
              {line}
            </Text>
          ))}
        </View>
        <View
          style={{
            width: Layout.col2,
            minHeight: 118,
            borderWidth: 0.55,
            borderColor: Lab.hair,
            padding: Space[3],
          }}
        >
          <Text style={s.label}>{t.practice}</Text>
          {content.natal.challenges.map((line) => (
            <Text key={line} style={[s.body, { width: Layout.col2 - Space[5] }]}>
              {line}
            </Text>
          ))}
          {content.natal.advice ? (
            <Text style={[s.small, { marginTop: 4, color: Lab.ink, width: Layout.col2 - Space[5] }]}>
              {content.natal.advice}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ marginTop: Space[5] }}>
        <Text style={s.label}>{t.whoUse}</Text>
        <Steps items={t.whoSteps} />
      </View>
    </Chrome>
  );
}

export function ToneTablePage({ content }: { content: YearMapContent }) {
  const en = content.lang === "en";
  const t = copy(en);
  const remaining = content.forecast.remaining ?? [];

  return (
    <Chrome content={content} page={4}>
      <Kicker>{t.tone}</Kicker>
      <View style={{ flexDirection: "row", gap: Layout.gutter }}>
        <View style={{ width: Layout.wheel }}>
          <LifeWheel
            wheel={content.solarWheel}
            caption={content.solarIsOwn ? t.solarOwn : t.solarNatal}
            compact
          />
        </View>
        <View style={{ width: Layout.text }}>
          <Text style={s.lead}>{content.solar.headline}</Text>
          <Text style={[s.body, { marginTop: Space[3], width: Layout.text }]}>{content.solar.body}</Text>
          <Text style={[s.body, { width: Layout.text }]}>{content.solar.publicMark}</Text>
        </View>
      </View>

      <View style={{ marginTop: Space[4], marginBottom: Space[4] }}>
        <PracticePlate kicker={t.yearPractice} body={content.solar.practice} />
      </View>

      <Text style={s.label}>{t.table}</Text>
      <Text style={[s.body, { marginBottom: Space[3] }]}>{content.forecast.body}</Text>
      <View style={s.tableHead}>
        <Text style={[s.tableHeadText, { width: 86 }]}>{t.colMonth}</Text>
        <Text style={[s.tableHeadText, { width: 70 }]}>{t.colClimate}</Text>
        <Text style={[s.tableHeadText, { width: 52 }]} />
        <Text style={[s.tableHeadText, { width: Layout.content - 86 - 70 - 52 }]}>{t.colAsk}</Text>
      </View>
      {remaining.map((m) => (
        <View key={m.key} style={s.tableRow} wrap={false}>
          <Text style={{ width: 86, fontSize: 9, fontFamily: Fonts.serif, color: Lab.ink }}>
            {m.label}
          </Text>
          <Text style={{ width: 70, fontSize: 7.5, fontFamily: Fonts.mono, color: ClimateInk[m.climate] }}>
            {m.climateLabel}
          </Text>
          <View style={{ width: 52, paddingTop: 3 }}>
            <IntensityBar value={m.intensity} climate={m.climate} width={44} />
          </View>
          <Text style={{ width: Layout.content - 86 - 70 - 52, fontSize: 8, color: Lab.slate, lineHeight: 1.32 }}>
            {m.executive}
          </Text>
        </View>
      ))}
    </Chrome>
  );
}

function MonthCard({ month }: { month: YearMonthBlock }) {
  const featured = month.featured?.length ? month.featured : month.topics.slice(0, 2);
  const rest = month.rest?.length ? month.rest : month.topics.slice(2);
  return (
    <View style={s.monthCard} wrap={false}>
      <View style={[s.monthRail, { backgroundColor: ClimateInk[month.climate] }]} />
      <View style={s.monthBody}>
        <View style={s.monthHead}>
          <Text style={s.monthName}>{month.label}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <IntensityBar value={month.intensity} climate={month.climate} width={52} />
            <Badge climate={month.climate} label={month.climateLabel} />
          </View>
        </View>
        <Text style={[s.ask, { marginBottom: 5, width: Layout.content - Layout.rail - 16 }]}>
          {month.executive}
        </Text>
        {featured.map((f) => (
          <View key={f.id} style={s.feat}>
            <View style={[s.featBar, { backgroundColor: TopicInk[f.id] ?? Lab.copper }]} />
            <View style={{ width: Layout.content - Layout.rail - 24 }}>
              <Text style={[s.featTitle, { color: TopicInk[f.id] ?? Lab.copper }]}>{f.title}</Text>
              <Text style={s.featLine}>{f.line}</Text>
            </View>
          </View>
        ))}
        <View style={s.restRow}>
          {rest.map((r) => (
            <Text key={r.id} style={s.restItem}>
              {r.title.toUpperCase()}  ·  {r.feel ?? r.line}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

export function MonthsPage({
  content,
  group,
  page,
}: {
  content: YearMapContent;
  group: YearMonthBlock[];
  page: number;
}) {
  const en = content.lang === "en";
  const t = copy(en);
  const a = group[0]?.shortLabel ?? "";
  const b = group[group.length - 1]?.shortLabel ?? "";
  return (
    <Chrome content={content} page={page}>
      <Kicker>{t.months(a, b)}</Kicker>
      <Text style={[s.small, { marginBottom: Space[3] }]}>{t.monthHint}</Text>
      {group.map((month) => (
        <MonthCard key={month.key} month={month} />
      ))}
    </Chrome>
  );
}

export function ProtocolPage({ content }: { content: YearMapContent }) {
  const en = content.lang === "en";
  const t = copy(en);
  const howTo = content.howTo ?? [];
  const legend = content.climateLegend ?? [];

  return (
    <Chrome content={content} page={8}>
      <Kicker>{t.protocol}</Kicker>
      <Text style={s.title}>{t.protocolTitle}</Text>
      <Text style={[s.body, { marginTop: 6, marginBottom: Space[4] }]}>{t.protocolLead}</Text>

      <Text style={s.label}>{t.howTo}</Text>
      <View style={{ flexDirection: "row", gap: Layout.gutter, marginBottom: Space[4] }}>
        {howTo.map((step, i) => (
          <View key={step} style={s.keyCard}>
            <Text style={s.stepN}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={[s.small, { width: Layout.inner3 }]}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginBottom: Space[4] }}>
        <PracticePlate kicker={t.yearPractice} body={content.solar.practice} />
      </View>

      <Text style={s.label}>{t.yearLog}</Text>
      <Text style={[s.small, { marginBottom: Space[2] }]}>{t.logHint}</Text>
      <YearLog months={content.months} />

      <View style={{ marginTop: Space[4] }}>
        <Text style={s.label}>{t.climateKey}</Text>
        <ClimateStrip legend={legend} />
      </View>

      <View style={s.colophon} wrap={false}>
        <Text style={s.lead}>{t.closeLine}</Text>
        <Text style={[s.micro, { marginTop: Space[3] }]}>{t.colophon}</Text>
        <Text style={[s.micro, { marginTop: 3 }]}>
          {content.name.toUpperCase()}  ·  {content.year}  ·  ASTROENGINE
        </Text>
      </View>
    </Chrome>
  );
}
