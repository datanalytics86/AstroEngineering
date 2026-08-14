/**
 * AstroEngine Pro — Year Map (Celestial Laboratory).
 * 8 plates: cover → glance → who → tone+table → 4+4+4 months → protocol.
 * Display: Libre Baskerville. Body: IBM Plex Sans. Data: IBM Plex Mono.
 */

import React from "react";
import { Document } from "@react-pdf/renderer";
import type { YearMapContent } from "@/lib/year-map";
import {
  CoverPage,
  GlancePage,
  MonthsPage,
  ProtocolPage,
  ToneTablePage,
  WhoPage,
} from "./year/pages";
import { registerLabFonts } from "./register-lab-fonts";

registerLabFonts();

export default function ProYearDocument({ content }: { content: YearMapContent }) {
  const en = content.lang === "en";
  const chunks = [
    content.months.slice(0, 4),
    content.months.slice(4, 8),
    content.months.slice(8, 12),
  ];

  return (
    <Document
      title={en ? `${content.name} · year map ${content.year}` : `${content.name} · mapa del año ${content.year}`}
      author="AstroEngine"
      subject={en ? "Personal year instrument" : "Instrumento personal del año"}
      language={en ? "en" : "es"}
    >
      <CoverPage content={content} />
      <GlancePage content={content} />
      <WhoPage content={content} />
      <ToneTablePage content={content} />
      {chunks.map((group, gi) => (
        <MonthsPage key={group[0]?.key ?? gi} content={content} group={group} page={5 + gi} />
      ))}
      <ProtocolPage content={content} />
    </Document>
  );
}
