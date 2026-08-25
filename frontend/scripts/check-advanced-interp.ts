import type { ChartResponse } from "../lib/types";
import {
  generateHouseSynthesis,
  generateAngleDeepAnalysis,
  generatePlanetSynthesis,
  generateAspectSynthesis,
} from "../lib/advanced-interpretation";

function p(
  name: string,
  sign: string,
  house: number,
  longitude: number,
  speed = 0.8,
): ChartResponse["planets"][number] {
  return {
    name,
    symbol: name[0],
    longitude,
    sign,
    sign_symbol: "",
    degree_in_sign: longitude % 30,
    degree_display: "00°00'00\"",
    house,
    retrograde: speed < 0,
    speed,
  };
}

const chart: ChartResponse = {
  name: "Smoke",
  birth_date: "1990-05-15",
  birth_time: "14:30",
  latitude: -33.4489,
  longitude: -70.6693,
  timezone_offset: -4,
  planets: [
    p("Sol", "Tauro", 9, 54.6, 0.98),
    p("Luna", "Cáncer", 11, 100.2, 13),
    p("Mercurio", "Tauro", 9, 48.1, 1.2),
    p("Venus", "Géminis", 10, 72.4, 1.1),
    p("Marte", "Acuario", 6, 312.0, 0.5),
    p("Júpiter", "Cáncer", 11, 105.0, 0.1),
    p("Saturno", "Capricornio", 5, 280.0, 0.05),
    p("Urano", "Capricornio", 5, 278.0, 0.01),
    p("Neptuno", "Capricornio", 5, 275.0, 0.005),
    p("Plutón", "Escorpio", 3, 228.0, 0.02),
  ],
  houses: Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    cusp_longitude: (155 + i * 30) % 360,
    sign: ["Virgo", "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis", "Aries", "Tauro", "Géminis", "Cáncer", "Leo"][i],
    degree_display: "05°00'00\"",
  })),
  ascendant: { longitude: 155, sign: "Virgo", degree_display: "05°00'00\"" },
  midheaven: { longitude: 65, sign: "Géminis", degree_display: "05°00'00\"" },
  aspects: [
    {
      planet1: "Sol",
      planet2: "Luna",
      aspect_name: "Sextil",
      aspect_symbol: "⚹",
      exact_angle: 60,
      actual_angle: 45.6,
      orb: 1.2,
      applying: true,
      nature: "armonioso",
    },
    {
      planet1: "Sol",
      planet2: "Saturno",
      aspect_name: "Trígono",
      aspect_symbol: "△",
      exact_angle: 120,
      actual_angle: 134.6,
      orb: 2.4,
      applying: false,
      nature: "armonioso",
    },
  ],
};

function words(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function must(cond: unknown, msg: string) {
  if (!cond) {
    console.error("FAIL", msg);
    process.exit(1);
  }
}

const h9 = generateHouseSynthesis(chart, 9, "es");
must(h9.house === 9, "house number");
must(h9.synthesis.includes("Sol") && h9.synthesis.includes("Mercurio"), "house 9 must name occupants");
must(h9.ruler_condition.length > 20, "ruler_condition");
must(h9.angular_connection.length > 10, "angular_connection");
must(["constructive", "challenging", "transformative", "latent"].includes(h9.overall_tone), "tone");
must(words(h9.synthesis) >= 40, `house synthesis too short (${words(h9.synthesis)})`);

const empty = generateHouseSynthesis(chart, 2, "es");
must(empty.synthesis.toLowerCase().includes("regente") || empty.ruler_condition.length > 10, "empty house uses ruler");
must(!empty.synthesis.includes("planeta en casa 2 significa"), "no magazine house slogan");

const asc = generateAngleDeepAnalysis(chart, "ASC", "es");
must(asc.name === "ASC" && asc.principal.includes("Virgo"), "ASC sign");
must(asc.ruler_condition.length > 10, "ASC ruler");
must(words(asc.principal) >= 50, `ASC principal short (${words(asc.principal)})`);

const mc = generateAngleDeepAnalysis(chart, "MC", "en");
must(mc.solar_relation && mc.solar_relation.toLowerCase().includes("sun"), "MC-Sun relation");

const sun = generatePlanetSynthesis(chart, chart.planets[0], "es");
must(!sun.principal.toLowerCase().includes("te hace"), "no 'te hace'");
must(sun.house_synthesis?.house === 9, "planet carries house unit");
must(sun.principal.includes("aplicante") || sun.principal.includes("Sextil"), "aspects in planet reading");

const asp = generateAspectSynthesis(chart, chart.aspects[0], "es");
must(asp.principal.includes("1.20") || asp.principal.includes("1.2"), "orb mentioned");
must(asp.subtitle?.includes("aplicante"), "applying in subtitle");

console.log("PASS advanced interpretation", {
  house9_words: words(h9.synthesis),
  asc_words: words(asc.principal),
  tone9: h9.overall_tone,
  empty_tone: empty.overall_tone,
});
