#!/usr/bin/env node
/**
 * Smoke check: genera un preview con una carta mínima y falla si hay jerga.
 * Se ejecuta con: node --import tsx scripts/check-tier-minus1.mjs
 * (o vía npx tsx).
 */
import { generateTierMinus1Content, findJargon } from "../lib/tier-minus1.ts";

function planet(name, sign, house) {
  return {
    name,
    symbol: "",
    longitude: 0,
    sign,
    sign_symbol: "",
    degree_in_sign: 0,
    degree_display: "0°",
    house,
    retrograde: false,
    speed: 1,
  };
}

const chart = {
  name: "Camila Soto",
  birth_date: "1992-04-18",
  birth_time: "14:30",
  latitude: -33.45,
  longitude: -70.66,
  timezone_offset: -4,
  planets: [
    planet("Sol", "Aries", 10),
    planet("Luna", "Cáncer", 4),
    planet("Venus", "Tauro", 7),
    planet("Marte", "Leo", 6),
    planet("Júpiter", "Sagitario", 2),
    planet("Saturno", "Capricornio", 10),
    planet("Urano", "Acuario", 11),
    planet("Neptuno", "Piscis", 12),
    planet("Plutón", "Escorpio", 8),
    planet("Nodo Norte", "Virgo", 9),
  ],
  houses: [],
  ascendant: { longitude: 0, sign: "Cáncer", degree_display: "0°" },
  midheaven: { longitude: 0, sign: "Aries", degree_display: "0°" },
  aspects: [
    {
      planet1: "Venus",
      planet2: "Marte",
      aspect_name: "Trígono",
      aspect_symbol: "△",
      exact_angle: 120,
      actual_angle: 120.4,
      orb: 0.4,
      applying: true,
      nature: "armonioso",
    },
  ],
};

let failed = 0;
for (const lang of ["es", "en"]) {
  const content = generateTierMinus1Content(chart, chart.name, lang, "Santiago, Chile");
  if (content.sections.length !== 6) {
    console.error(`FAIL ${lang}: expected 6 sections, got ${content.sections.length}`);
    failed += 1;
  }
  const blobs = [
    content.coverTitle,
    content.coverLead,
    content.ctaHeadline,
    content.ctaBody,
    ...content.sections.flatMap((s) => [s.title, s.headline, s.badgeLabel, ...s.paragraphs, ...s.tips]),
  ];
  for (const text of blobs) {
    const hits = findJargon(text);
    if (hits.length) {
      console.error(`FAIL ${lang} jerga: ${hits.join(", ")} → ${text}`);
      failed += 1;
    }
  }
  for (const s of content.sections) {
    if (s.paragraphs.length < 2 || s.paragraphs.length > 3) {
      console.error(`FAIL ${lang} ${s.id}: paragraphs ${s.paragraphs.length}`);
      failed += 1;
    }
    if (s.tips.length < 1 || s.tips.length > 2) {
      console.error(`FAIL ${lang} ${s.id}: tips ${s.tips.length}`);
      failed += 1;
    }
  }
}

if (failed) {
  console.error(`FAIL: ${failed} issue(s)`);
  process.exit(1);
}
console.log("OK: Tier -1 copy is clean (ES/EN, 6 sections, no jargon).");
