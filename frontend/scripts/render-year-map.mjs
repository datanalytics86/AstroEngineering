#!/usr/bin/env node
/**
 * Render the sample Year-Map to a local PDF for visual QA.
 * Usage: npx tsx scripts/render-year-map.mjs
 */
import { createElement } from "react";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import { Font, pdf } from "@react-pdf/renderer";
import { getSampleYearMap } from "../lib/year-map.ts";
import * as DocMod from "../components/pdf/ProYearDocument.tsx";

const fontDir = join(process.cwd(), "public", "fonts");
function font(file) {
  const path = join(fontDir, file);
  if (!existsSync(path)) throw new Error(`missing font ${path}`);
  return path;
}
Font.registerHyphenationCallback((word) => [word]);
Font.register({
  family: "LabSerif",
  fonts: [
    { src: font("LibreBaskerville-Regular.ttf"), fontWeight: 400, fontStyle: "normal" },
    { src: font("LibreBaskerville-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
    { src: font("LibreBaskerville-Bold.ttf"), fontWeight: 700, fontStyle: "normal" },
  ],
});
Font.register({
  family: "LabSans",
  fonts: [
    { src: font("IBMPlexSans-Regular.ttf"), fontWeight: 400 },
    { src: font("IBMPlexSans-SemiBold.ttf"), fontWeight: 600 },
  ],
});
Font.register({
  family: "LabMono",
  fonts: [
    { src: font("IBMPlexMono-Regular.ttf"), fontWeight: 400 },
    { src: font("IBMPlexMono-Medium.ttf"), fontWeight: 500 },
  ],
});

const ProYearDocument =
  typeof DocMod.default === "function"
    ? DocMod.default
    : typeof DocMod.default?.default === "function"
      ? DocMod.default.default
      : DocMod.ProYearDocument;

if (typeof ProYearDocument !== "function") {
  console.error("ProYearDocument keys:", Object.keys(DocMod), "default:", DocMod.default);
  throw new Error(`ProYearDocument is ${typeof ProYearDocument}`);
}

const lang = process.argv.includes("en") ? "en" : "es";
const content = getSampleYearMap(lang);
const doc = createElement(ProYearDocument, { content });
const blob = await pdf(doc).toBlob();
const buf = Buffer.from(await blob.arrayBuffer());
const out = join(process.cwd(), `year-map-preview-${lang}.pdf`);
writeFileSync(out, buf);
console.log(`OK: ${out}  (${buf.length} bytes)`);
