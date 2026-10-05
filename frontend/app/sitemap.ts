import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/nueva`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pro`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/glosario`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/reembolsos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/contacto`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/guia`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/guia/mercurio-retrogrado-2027`, changeFrequency: "monthly", priority: 0.55 },
    { url: `${base}/guia/lunas-2027`, changeFrequency: "monthly", priority: 0.55 },
    { url: `${base}/regalo`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/en`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/en/pro`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/en/guia/mercurio-retrogrado-2027`, changeFrequency: "monthly", priority: 0.45 },
  ];
}
