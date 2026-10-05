/** Catálogo único de precios. Ningún precio vive en es.ts/en.ts ni en la UI. */

export type Sku =
  | "year_map"
  | "year_map_next"
  | "year_map_gift"
  | "extra_map"
  | "plus_monthly"
  | "plus_yearly";

export type Currency = "USD" | "CLP";

export interface Product {
  sku: Sku;
  kind: "one_time" | "subscription";
  window: "rolling12" | "next_calendar_year" | "none";
  prices: Partial<Record<Currency, number>>;
  enabled: boolean;
  activeFrom?: string;
  activeTo?: string;
}

export const CATALOG: Record<Sku, Product> = {
  year_map: {
    sku: "year_map",
    kind: "one_time",
    window: "rolling12",
    prices: { USD: 999, CLP: 8990 },
    enabled: true,
  },
  year_map_next: {
    sku: "year_map_next",
    kind: "one_time",
    window: "next_calendar_year",
    prices: { USD: 999, CLP: 8990 },
    enabled: true,
    activeFrom: "11-01",
    activeTo: "01-31",
  },
  year_map_gift: {
    sku: "year_map_gift",
    kind: "one_time",
    window: "rolling12",
    prices: { USD: 999, CLP: 8990 },
    enabled: true,
  },
  extra_map: {
    sku: "extra_map",
    kind: "one_time",
    window: "rolling12",
    prices: { USD: 599, CLP: 5490 },
    enabled: true,
  },
  plus_monthly: {
    sku: "plus_monthly",
    kind: "subscription",
    window: "none",
    prices: { USD: 499, CLP: 4490 },
    enabled: false,
  },
  plus_yearly: {
    sku: "plus_yearly",
    kind: "subscription",
    window: "none",
    prices: { USD: 2999, CLP: 26990 },
    enabled: false,
  },
};

export function isSkuActive(sku: Sku, at: Date = new Date()): boolean {
  const p = CATALOG[sku];
  if (!p?.enabled) return false;
  if (!p.activeFrom || !p.activeTo) return true;
  const md = `${String(at.getUTCMonth() + 1).padStart(2, "0")}-${String(at.getUTCDate()).padStart(2, "0")}`;
  const from = p.activeFrom;
  const to = p.activeTo;
  if (from <= to) return md >= from && md <= to;
  return md >= from || md <= to;
}

export function publicCatalog(currency: Currency, at: Date = new Date()) {
  return (Object.keys(CATALOG) as Sku[])
    .filter((sku) => isSkuActive(sku, at))
    .map((sku) => {
      const p = CATALOG[sku];
      return {
        sku,
        kind: p.kind,
        window: p.window,
        amountMinor: p.prices[currency] ?? p.prices.USD ?? 0,
        currency: p.prices[currency] ? currency : "USD",
      };
    });
}

export function formatPrice(amountMinor: number, currency: Currency): string {
  if (currency === "CLP") {
    return `CLP ${amountMinor.toLocaleString("es-CL")}`;
  }
  const major = amountMinor / 100;
  return `US$${major.toFixed(2)}`;
}

export function priceOf(sku: Sku, currency: Currency): { amountMinor: number; currency: Currency; label: string } {
  const p = CATALOG[sku];
  const cur: Currency = p.prices[currency] != null ? currency : "USD";
  const amountMinor = p.prices[cur] ?? 0;
  return { amountMinor, currency: cur, label: formatPrice(amountMinor, cur) };
}

export function currencyFromCountry(country: string | null | undefined): Currency {
  return (country || "").toUpperCase() === "CL" ? "CLP" : "USD";
}
