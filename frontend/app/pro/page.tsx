import type { Metadata } from "next";
import { priceOf } from "@/lib/billing/catalog";
import { siteUrl } from "@/lib/site";
import ProLanding from "./ProLanding";

export const metadata: Metadata = {
  title: "Mapa del Año — AstroEngine",
  description:
    "Doce meses móviles calculados con tu cielo real. Pago único. Orientación y entretenimiento.",
  alternates: { canonical: `${siteUrl()}/pro` },
  openGraph: {
    title: "Mapa del Año — AstroEngine",
    description: "Tu año, en claro. Calculado con tu cielo real.",
    url: `${siteUrl()}/pro`,
  },
};

export default function ProPage() {
  const usd = priceOf("year_map", "USD");
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "AstroEngine",
        url: siteUrl(),
      },
      {
        "@type": "Product",
        name: "Mapa del Año",
        description: "Reporte astrológico personalizado de 12 meses, web + PDF.",
        offers: {
          "@type": "Offer",
          price: (usd.amountMinor / 100).toFixed(2),
          priceCurrency: "USD",
          availability: "https://schema.org/PreOrder",
        },
      },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProLanding />
    </>
  );
}
