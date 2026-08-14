import React, { type ReactNode } from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import type { YearClimate, YearMapContent, YearMonthBlock } from "@/lib/year-map";
import { ClimateBar, ClimateBg, ClimateInk, Fonts, Lab } from "../lab-theme";
import { copy } from "./copy";
import { s } from "./styles";

export const TOTAL_PAGES = 8;

export function Chrome({
  content,
  page,
  children,
}: {
  content: YearMapContent;
  page: number;
  children: ReactNode;
}) {
  const en = content.lang === "en";
  const t = copy(en);
  return (
    <Page size="A4" style={s.page}>
      <View style={s.mast} fixed>
        <Text style={s.mastText}>
          {content.sample ? t.mastSample(content.year) : t.mastLive(content.year)}
        </Text>
        <Text style={s.mastText}>
          {String(page).padStart(2, "0")}  /  {String(TOTAL_PAGES).padStart(2, "0")}
        </Text>
      </View>
      <View style={s.mastCopper} fixed />
      {children}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>{content.name.toUpperCase()}</Text>
        <Text style={s.footerText}>{t.footerMark}</Text>
      </View>
    </Page>
  );
}

export function Kicker({ children }: { children: string }) {
  return <Text style={s.kicker}>{children}</Text>;
}

export function Rule() {
  return <View style={s.rule} />;
}

export function Hair() {
  return <View style={s.hair} />;
}

export function Badge({ climate, label }: { climate: YearClimate; label: string }) {
  return (
    <Text style={[s.badge, { color: ClimateInk[climate], backgroundColor: ClimateBg[climate] }]}>
      {label}
    </Text>
  );
}

export function IntensityBar({
  value,
  climate,
  width,
}: {
  value: number;
  climate: YearClimate;
  width: number;
}) {
  const filled = Math.max(1, Math.min(10, Math.round(value)));
  const gap = 1;
  const unit = (width - gap * 9) / 10;
  return (
    <View style={{ flexDirection: "row", width, height: 4 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <View
          key={i}
          style={{
            width: unit,
            height: 4,
            marginRight: i === 9 ? 0 : gap,
            backgroundColor: i < filled ? ClimateBar[climate] : Lab.hair,
          }}
        />
      ))}
    </View>
  );
}

export function PracticePlate({ kicker, body }: { kicker: string; body: string }) {
  return (
    <View style={s.practice} wrap={false}>
      <View style={s.practiceRail} />
      <Text style={[s.label, { marginBottom: 4 }]}>{kicker}</Text>
      <Text style={[s.ask, { fontWeight: 400 }]}>{body}</Text>
    </View>
  );
}

export function Steps({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((step, i) => (
        <View key={step} style={s.step}>
          <Text style={s.stepN}>{String(i + 1).padStart(2, "0")}</Text>
          <Text style={[s.body, { marginBottom: 0, flexGrow: 1 }]}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

export function KeyMonthPlate({ month }: { month: YearMonthBlock }) {
  return (
    <View
      style={[
        s.plate,
        {
          width: 167,
          height: 112,
          flexGrow: 0,
          borderColor: ClimateBar[month.climate],
          backgroundColor: ClimateBg[month.climate],
        },
      ]}
      wrap={false}
    >
      <Text style={[s.plateName, { color: ClimateInk[month.climate] }]}>{month.label}</Text>
      <Badge climate={month.climate} label={month.climateLabel} />
      <Text style={[s.plateWhy, { color: ClimateInk[month.climate], marginTop: 5, width: 149 }]}>
        {month.executive}
      </Text>
    </View>
  );
}

export function ClimateStrip({
  legend,
}: {
  legend: { climate: YearClimate; label: string; hint: string }[];
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {legend.map((c) => (
        <View key={c.climate} style={{ flexGrow: 1, flexDirection: "row", gap: 5 }}>
          <View style={{ width: 2.4, backgroundColor: ClimateBar[c.climate] }} />
          <View style={{ flexGrow: 1 }}>
            <Text
              style={{
                fontFamily: Fonts.mono,
                fontSize: 7,
                letterSpacing: 1,
                color: ClimateInk[c.climate],
              }}
            >
              {c.label.toUpperCase()}
            </Text>
            <Text style={[s.small, { color: ClimateInk[c.climate], marginTop: 2 }]}>{c.hint}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function YearLog({ months }: { months: YearMonthBlock[] }) {
  return (
    <View>
      {months.map((m) => (
        <View key={m.key} style={s.logRow} wrap={false}>
          <View style={s.logBox} />
          <Text style={s.logMonth}>{m.shortLabel.toUpperCase()}</Text>
          <Text style={[s.logClimate, { color: ClimateInk[m.climate] }]}>{m.climateLabel}</Text>
          <Text style={s.logAction}>{m.action}</Text>
        </View>
      ))}
    </View>
  );
}

export function YearRibbon({
  months,
  keyKeys,
}: {
  months: YearMonthBlock[];
  keyKeys: Set<string>;
}) {
  return (
    <View style={s.ribbon}>
      {months.map((m) => (
        <View
          key={m.key}
          style={[
            s.ribbonCell,
            {
              backgroundColor: ClimateBar[m.climate],
              borderTopWidth: keyKeys.has(m.key) ? 2 : 0,
              borderTopColor: Lab.ivory,
            },
          ]}
        >
          <Text style={{ fontFamily: Fonts.mono, fontSize: 6, letterSpacing: 0.4, color: Lab.ivory }}>
            {m.shortLabel.toUpperCase()}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function GlanceCell({
  month,
  marked,
  mark,
}: {
  month: YearMonthBlock;
  marked: boolean;
  mark: string;
}) {
  const tags = month.featured.map((f) => f.title.toLowerCase()).join("  ·  ");
  return (
    <View
      style={[
        s.glanceCell,
        marked
          ? { backgroundColor: ClimateBg[month.climate], borderColor: ClimateBar[month.climate] }
          : {},
      ]}
      wrap={false}
    >
      <View style={[s.glanceRail, { backgroundColor: ClimateBar[month.climate] }]} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
        <Text
          style={{
            fontFamily: Fonts.mono,
            fontSize: 7.5,
            letterSpacing: 0.6,
            color: marked ? ClimateInk[month.climate] : Lab.ink,
          }}
        >
          {month.shortLabel.toUpperCase()}
        </Text>
        <Text
          style={{
            fontFamily: Fonts.mono,
            fontSize: 6.5,
            color: ClimateInk[month.climate],
          }}
        >
          {marked ? mark : month.climateLabel}
        </Text>
      </View>
      <IntensityBar value={month.intensity} climate={month.climate} width={148} />
      <Text
        style={{
          fontSize: 8,
          lineHeight: 1.32,
          color: marked ? ClimateInk[month.climate] : Lab.slate,
          marginTop: 5,
          fontFamily: Fonts.sans,
          width: 148,
        }}
      >
        {month.executive}
      </Text>
      {tags ? (
        <Text style={[s.micro, { marginTop: 4, color: ClimateInk[month.climate] }]}>{tags}</Text>
      ) : null}
    </View>
  );
}
