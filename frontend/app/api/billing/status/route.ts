import { NextRequest, NextResponse } from "next/server";
import { currencyFromCountry, priceOf, publicCatalog } from "@/lib/billing/catalog";
import { billingProviderId, checkoutOpen, proMode } from "@/lib/pro/mode";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const country = req.headers.get("x-vercel-ip-country");
  const currency = currencyFromCountry(country);
  const core = priceOf("year_map", currency);
  return NextResponse.json({
    mode: proMode(),
    provider: billingProviderId(),
    checkoutOpen: checkoutOpen(),
    currency: core.currency,
    price: core.label,
    amountMinor: core.amountMinor,
    catalog: publicCatalog(core.currency),
  });
}
