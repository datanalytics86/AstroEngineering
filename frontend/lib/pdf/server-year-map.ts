import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { YearMapContentV2 } from "@/lib/pro/build-year-map";
import YearMapV2Document from "@/components/pdf/YearMapV2Document";

export function yearMapFilename(lang: "es" | "en", start: string): string {
  const prefix = lang === "en" ? "year-map" : "mapa-del-anio";
  return `${prefix}-${start}.pdf`;
}

export async function renderYearMapPdf(map: YearMapContentV2, lang: "es" | "en"): Promise<Buffer> {
  const doc = createElement(YearMapV2Document, { map, lang });
  return renderToBuffer(doc as never);
}
