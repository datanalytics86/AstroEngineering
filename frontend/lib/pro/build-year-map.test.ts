import { describe, expect, it } from "vitest";
import type { MonthlyForecast, TransitResponse } from "@/lib/types";
import { buildYearMapV2, noRepeatedHeadlines } from "./build-year-map";
import { rollingWindow } from "./window";

function fakeTransits(months: string[]): TransitResponse {
  const timeline: MonthlyForecast[] = months.map((month, i) => ({
    month,
    transits_active: [
      {
        transit_planet: "Saturno",
        transit_longitude: 0,
        transit_sign: "Piscis",
        natal_planet: "Sol",
        natal_longitude: 0,
        aspect_name: "cuadratura",
        orb: 1,
        applying: true,
        exact_date: `${month}-${String(10 + (i % 10)).padStart(2, "0")}`,
        enters_orb: `${month}-03`,
        leaves_orb: `${month}-18`,
        nature: i % 3 === 0 ? "tenso" : "armonioso",
        importance: "alta",
        score: 5 + i,
      },
    ],
    intensity_score: 3 + i,
    dominant_theme: "trabajo",
    theme_summary: "",
    life_areas_affected: ["trabajo"],
  }));
  return {
    current_transits: timeline.flatMap((m) => m.transits_active),
    timeline,
    exact_aspects_calendar: [],
    raw_intensity: timeline.map((m) => 4 + Number(m.month.slice(5)) * 0.8),
    key_events: [],
  };
}

describe("YearMapContent v2", () => {
  it("builds 12 months with relative climate and unique headlines", () => {
    const w = rollingWindow(new Date(Date.UTC(2026, 9, 5)));
    const map = buildYearMapV2({
      transits: fakeTransits(w.months),
      months: w.months,
      kind: "rolling12",
      lang: "es",
      currentMonthKey: w.start,
    });
    expect(map.months).toHaveLength(12);
    expect(map.window.start).toBe("2026-10");
    expect(noRepeatedHeadlines(map)).toBe(true);
    expect(map.climateMode).toBe("relative");
    expect(map.months.some((m) => m.climate === "apretado")).toBe(true);
  });
});
