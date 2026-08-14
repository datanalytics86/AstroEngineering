import React from "react";
import { Circle, G, Path, Svg, Text, View } from "@react-pdf/renderer";
import type { YearMapWheel } from "@/lib/year-map";
import { describeSector, makeToAngle, polarXY } from "@/lib/wheel-geometry";
import { Fonts, Lab, Layout } from "../lab-theme";
import { s } from "./styles";

const SIZE = Layout.wheel;
const CX = SIZE / 2;
const CY = SIZE / 2;

/**
 * Dial, not a decoration. Numbers on the ring; names live in the key below.
 */
export function LifeWheel({
  wheel,
  caption,
  zonesLabel,
  compact = false,
}: {
  wheel: YearMapWheel;
  caption?: string;
  zonesLabel?: string;
  compact?: boolean;
}) {
  const toAngle = makeToAngle(wheel.ascLongitude);
  const zones = [...wheel.zones].sort((a, b) => a.house - b.house);
  const left = zones.filter((z) => z.house <= 6);
  const right = zones.filter((z) => z.house > 6);
  const bodies = uniqueRoles(wheel);

  return (
    <View style={{ width: SIZE }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle cx={CX} cy={CY} r={91} fill={Lab.wash} stroke={Lab.navy} strokeWidth={0.7} />
        {zones.map((z, i) => {
          const next = zones[(i + 1) % zones.length];
          const start = toAngle(z.cuspLongitude);
          let end = toAngle(next.cuspLongitude);
          if (end <= start) end += 360;
          const mid = start + (end - start) / 2;
          const labelPt = polarXY(CX, CY, 78, mid);
          const tickIn = polarXY(CX, CY, 70, start);
          const tickOut = polarXY(CX, CY, 91, start);
          return (
            <G key={z.house}>
              <Path
                d={describeSector(CX, CY, 48, 70, start, end)}
                fill={z.color}
                fillOpacity={0.22}
                stroke={Lab.copper}
                strokeWidth={0.35}
              />
              <Path
                d={`M ${tickIn.x} ${tickIn.y} L ${tickOut.x} ${tickOut.y}`}
                stroke={Lab.navy}
                strokeWidth={0.4}
              />
              <Text
                x={labelPt.x}
                y={labelPt.y + 2}
                style={{
                  fontSize: 6.5,
                  fill: Lab.navy,
                  textAnchor: "middle",
                  fontFamily: Fonts.mono,
                }}
              >
                {String(z.house).padStart(2, "0")}
              </Text>
            </G>
          );
        })}
        <Circle cx={CX} cy={CY} r={48} fill={Lab.paper} stroke={Lab.hair} strokeWidth={0.6} />
        {wheel.dots.map((d, i) => {
          const pt = polarXY(CX, CY, 36, toAngle(d.longitude));
          return <Circle key={`${d.role}-${i}`} cx={pt.x} cy={pt.y} r={2.6} fill={d.color} />;
        })}
        <Circle cx={CX} cy={CY} r={2.6} fill={Lab.copper} />
      </Svg>
      {caption ? (
        <Text style={[s.micro, { textAlign: "center", marginTop: 4, marginBottom: compact ? 0 : 4 }]}>
          {caption}
        </Text>
      ) : compact ? null : (
        <View style={{ height: 6 }} />
      )}
      {compact ? null : (
        <View>
          {zonesLabel ? <Text style={[s.label, { marginBottom: 3 }]}>{zonesLabel}</Text> : null}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ width: 86 }}>
              {left.map((z) => (
                <View key={z.house} style={s.zoneRow}>
                  <Text style={s.zoneN}>{String(z.house).padStart(2, "0")}</Text>
                  <Text style={s.zoneL}>{z.label}</Text>
                </View>
              ))}
            </View>
            <View style={{ width: 86 }}>
              {right.map((z) => (
                <View key={z.house} style={s.zoneRow}>
                  <Text style={s.zoneN}>{String(z.house).padStart(2, "0")}</Text>
                  <Text style={s.zoneL}>{z.label}</Text>
                </View>
              ))}
            </View>
          </View>
          {bodies.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6, width: Layout.wheel }}>
              {bodies.map((b) => (
                <View
                  key={b.role}
                  style={{ width: 94, flexDirection: "row", alignItems: "center", marginBottom: 2 }}
                >
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: b.color, marginRight: 3 }} />
                  <Text style={s.micro}>{b.role}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function uniqueRoles(wheel: YearMapWheel): { role: string; color: string }[] {
  const seen = new Set<string>();
  const out: { role: string; color: string }[] = [];
  for (const d of wheel.dots) {
    if (seen.has(d.role)) continue;
    seen.add(d.role);
    out.push({ role: d.role, color: d.color });
  }
  return out.slice(0, 10);
}
