import { describe, expect, it } from "vitest";
import { stripLocalePrefix, withLocalePrefix } from "./locale-path";
import { pairRetroPeriods, extractLunations } from "./seo/calendar-guides";
import type { CalendarMonth } from "./types";

describe("locale paths", () => {
  it("strips /en and rebuilds prefixes", () => {
    expect(stripLocalePrefix("/en")).toEqual({ locale: "en", pathname: "/" });
    expect(stripLocalePrefix("/en/pro")).toEqual({ locale: "en", pathname: "/pro" });
    expect(stripLocalePrefix("/pro")).toEqual({ locale: "es", pathname: "/pro" });
    expect(withLocalePrefix("/pro", "en")).toBe("/en/pro");
    expect(withLocalePrefix("/", "en")).toBe("/en");
    expect(withLocalePrefix("/pro", "es")).toBe("/pro");
  });
});

describe("calendar SEO extractors", () => {
  const month: CalendarMonth = {
    year: 2027,
    month: 2,
    days: [
      {
        date: "2027-02-13",
        moon: { sign: "Piscis", degree_in_sign: 1 },
        sun: { sign: "Acuario", degree_in_sign: 24 },
        events: [{ type: "station", body: "Mercurio", station: "retrograde", sign: "Piscis" }],
        fast: [],
      },
      {
        date: "2027-03-07",
        moon: { sign: "Aries", degree_in_sign: 1 },
        sun: { sign: "Piscis", degree_in_sign: 16 },
        events: [{ type: "station", body: "Mercurio", station: "direct", sign: "Acuario" }],
        fast: [],
      },
      {
        date: "2027-02-17",
        moon: { sign: "Acuario", degree_in_sign: 0 },
        sun: { sign: "Acuario", degree_in_sign: 28 },
        events: [{ type: "moon_phase", phase: "nueva", sign: "Acuario" }],
        fast: [],
      },
    ],
    slow: [],
  };

  it("pairs mercury retrograde windows from stations", () => {
    const periods = pairRetroPeriods([
      { date: "2027-02-13", station: "retrograde", sign: "Piscis" },
      { date: "2027-03-07", station: "direct", sign: "Acuario" },
    ]);
    expect(periods).toEqual([{ start: "2027-02-13", end: "2027-03-07", sign: "Piscis" }]);
  });

  it("extracts new and full moons only", () => {
    expect(extractLunations([month]).map((h) => h.phase)).toEqual(["nueva"]);
  });
});
