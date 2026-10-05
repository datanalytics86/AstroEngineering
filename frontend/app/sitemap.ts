import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/nueva`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/glosario`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/reembolsos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/contacto`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
