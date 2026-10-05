import { describe, expect, it } from "vitest";
import { CATALOG, isSkuActive, priceOf } from "./catalog";

describe("catalog", () => {
  it("year_map is enabled; plus is off; gift is P1 off", () => {
    expect(CATALOG.year_map.enabled).toBe(true);
    expect(CATALOG.plus_monthly.enabled).toBe(false);
    expect(CATALOG.year_map_gift.enabled).toBe(false);
  });

  it("year_map_next is active in November and January, not in June", () => {
    expect(isSkuActive("year_map_next", new Date("2026-11-15T00:00:00Z"))).toBe(true);
    expect(isSkuActive("year_map_next", new Date("2027-01-10T00:00:00Z"))).toBe(true);
    expect(isSkuActive("year_map_next", new Date("2026-06-01T00:00:00Z"))).toBe(false);
  });

  it("USD 9.99 / CLP 8.990 for the core SKU", () => {
    expect(priceOf("year_map", "USD").amountMinor).toBe(999);
    expect(priceOf("year_map", "CLP").amountMinor).toBe(8990);
  });
});
