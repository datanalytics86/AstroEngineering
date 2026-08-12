import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://astro-engineering.vercel.app";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/nueva`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/glosario`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
