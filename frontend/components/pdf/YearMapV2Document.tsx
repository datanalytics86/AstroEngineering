import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { YearMapContentV2 } from "@/lib/pro/build-year-map";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, color: "#1a1a1a" },
  kicker: { fontSize: 9, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b4e3d", marginBottom: 8 },
  h1: { fontSize: 22, fontFamily: "Times-Roman", marginBottom: 12 },
  h2: { fontSize: 14, fontFamily: "Times-Roman", marginBottom: 6, marginTop: 10 },
  p: { lineHeight: 1.4, marginBottom: 6 },
  muted: { color: "#555", fontSize: 10, marginBottom: 8 },
  box: { border: "1 solid #ddd", padding: 10, marginBottom: 8 },
  label: { fontSize: 9, color: "#6b4e3d", marginBottom: 2 },
});

export default function YearMapV2Document({
  map,
  lang,
}: {
  map: YearMapContentV2;
  lang: "es" | "en";
}) {
  const en = lang === "en";
  return (
    <Document
      title={en ? `Year map ${map.window.start}–${map.window.end}` : `Mapa del año ${map.window.start}–${map.window.end}`}
      author="AstroEngine"
      language={en ? "en" : "es"}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.kicker}>AstroEngine</Text>
        <Text style={styles.h1}>{en ? "Year Map" : "Mapa del Año"}</Text>
        <Text style={styles.muted}>
          {map.window.start} → {map.window.end} · {map.window.kind}
        </Text>
        <Text style={styles.p}>
          {en
            ? "Orientation and entertainment. This is not medical, psychological, financial or legal advice."
            : "Orientación y entretenimiento. No reemplaza consejo médico, psicológico, financiero ni legal."}
        </Text>
        {map.months.map((m) => (
          <View key={m.key} style={styles.box} wrap={false}>
            <Text style={styles.label}>
              {m.label} · {m.climate} · {m.relativeIntensity}
            </Text>
            <Text style={styles.h2}>{m.headline}</Text>
            <Text style={styles.p}>{m.action}</Text>
            <Text style={styles.muted}>{m.avoid}</Text>
          </View>
        ))}
      </Page>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{en ? "Key dates" : "Fechas clave"}</Text>
        {map.keyDates.length === 0 ? (
          <Text style={styles.p}>{en ? "No dated events in this window." : "No hay fechas datadas en esta ventana."}</Text>
        ) : (
          map.keyDates.map((d, i) => (
            <View key={`${d.date}-${i}`} style={styles.box} wrap={false}>
              <Text style={styles.label}>{d.date}{d.endDate ? ` – ${d.endDate}` : ""}</Text>
              <Text style={styles.p}>{d.title}</Text>
            </View>
          ))
        )}
      </Page>
    </Document>
  );
}
