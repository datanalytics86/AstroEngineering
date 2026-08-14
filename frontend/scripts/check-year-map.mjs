#!/usr/bin/env node
import { findJargon } from "../lib/tier-minus1.ts";
import { buildYearMap, getSampleYearMap } from "../lib/year-map.ts";

function planet(name, sign, house, longitude) {
  return {
    name,
    symbol: "",
    longitude,
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
    planet("Sol", "Aries", 10, 28),
    planet("Luna", "Cáncer", 4, 104),
    planet("Venus", "Tauro", 7, 48),
    planet("Marte", "Leo", 6, 140),
    planet("Júpiter", "Sagitario", 2, 250),
    planet("Saturno", "Capricornio", 10, 280),
  ],
  houses: Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    cusp_longitude: i * 30,
    sign: "Aries",
    degree_display: "0°",
  })),
  ascendant: { longitude: 0, sign: "Cáncer", degree_display: "0°" },
  midheaven: { longitude: 270, sign: "Aries", degree_display: "0°" },
  aspects: [],
};

const transits = {
  current_transits: [],
  exact_aspects_calendar: [],
  timeline: Array.from({ length: 12 }, (_, i) => ({
    month: `2026-${String(i + 1).padStart(2, "0")}`,
    transits_active: [],
    intensity_score: i === 2 ? 8.4 : i === 7 ? 2.1 : 5,
    dominant_theme: "",
    theme_summary: "",
    life_areas_affected: [],
  })),
};

let failed = 0;
for (const lang of ["es", "en"]) {
  const sample = getSampleYearMap(lang);
  const live = buildYearMap({ chart, transits, solar: chart, year: 2026, lang });
  for (const [label, content] of [["sample", sample], ["live", live]]) {
    if (content.months.length !== 12) {
      console.error(`FAIL ${lang} ${label}: months`);
      failed += 1;
    }
    if (!content.keyMonths?.length || !content.howTo?.length) {
      console.error(`FAIL ${lang} ${label}: keyMonths/howTo missing`);
      failed += 1;
    }
    if (!content.natalWheel?.zones?.length || !content.forecast.moves?.length) {
      console.error(`FAIL ${lang} ${label}: wheel/moves missing`);
      failed += 1;
    }
    if (!content.solar?.practice) {
      console.error(`FAIL ${lang} ${label}: solar.practice missing`);
      failed += 1;
    }
    const asks = content.months.map((m) => m.executive);
    if (label === "sample" && new Set(asks).size < 10) {
      console.error(`FAIL ${lang} ${label}: executives too repetitive (${new Set(asks).size})`);
      failed += 1;
    }
    if (content.months.some((m) => !m.action)) {
      console.error(`FAIL ${lang} ${label}: action missing`);
      failed += 1;
    }
    if (label === "sample") {
      const featured = content.months.flatMap((m) => m.featured.map((f) => f.line));
      if (new Set(featured).size < 10) {
        console.error(`FAIL ${lang} ${label}: featured lines too repetitive (${new Set(featured).size})`);
        failed += 1;
      }
      const pairs = content.months.map((m) => m.featured.map((f) => f.id).join("+"));
      if (new Set(pairs).size < 5) {
        console.error(`FAIL ${lang} ${label}: featured pairs too repetitive (${new Set(pairs).size})`);
        failed += 1;
      }
      const actions = content.months.map((m) => m.action);
      if (new Set(actions).size < 10) {
        console.error(`FAIL ${lang} ${label}: actions too repetitive (${new Set(actions).size})`);
        failed += 1;
      }
    }
    const blobs = [
      content.natal.headline,
      content.solar.body,
      content.yearPulse.body,
      content.forecast.body,
      ...content.howTo,
      ...content.forecast.moves,
      ...content.months.flatMap((m) => [m.executive, ...m.featured.map((f) => f.line)]),
    ];
    for (const text of blobs) {
      const hits = findJargon(text);
      if (hits.length) {
        console.error(`FAIL ${lang} ${label} jerga: ${hits.join(", ")} → ${text}`);
        failed += 1;
      }
    }
  }
}

if (failed) {
  console.error(`year-map check failed (${failed})`);
  process.exit(1);
}
console.log("OK: year-map TIER 1 — 12 months, key months, how-to, wheels, zero jargon");
