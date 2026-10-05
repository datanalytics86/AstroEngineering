import { describe, expect, it } from "vitest";
import { classifyClimate, climateCounts, isFlatSeries } from "./climate";

function rand(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe("relative climate", () => {
  it("marks a flat series as parejo", () => {
    const raw = Array(12).fill(7.2);
    const r = classifyClimate(raw);
    expect(r.flat).toBe(true);
    expect(r.climate.every((c) => c === "parejo")).toBe(true);
    expect(isFlatSeries(raw)).toBe(true);
  });

  it("gives top-3 apretado and bottom-3 suave on a spread series", () => {
    const raw = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const r = classifyClimate(raw, raw.map(() => 0.6));
    const c = climateCounts(r.climate);
    expect(c.apretado).toBeGreaterThanOrEqual(3);
    expect(c.suave).toBeGreaterThanOrEqual(3);
    expect(c.abierto).toBeGreaterThanOrEqual(2);
    expect(r.flat).toBe(false);
  });

  it("on 50 synthetic charts, ≥90% have ≥2 of each climate (when not flat)", () => {
    const rng = rand(42);
    let ok = 0;
    let varied = 0;
    for (let n = 0; n < 50; n++) {
      const raw = Array.from({ length: 12 }, () => 2 + rng() * 14);
      const tense = raw.map(() => rng());
      const r = classifyClimate(raw, tense);
      if (r.flat) continue;
      varied += 1;
      const c = climateCounts(r.climate);
      if (c.apretado >= 2 && c.suave >= 2 && c.abierto >= 2) ok += 1;
    }
    expect(varied).toBeGreaterThan(40);
    expect(ok / varied).toBeGreaterThanOrEqual(0.9);
  });
});
