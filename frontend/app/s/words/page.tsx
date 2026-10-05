import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import ShareLanding from "@/components/ShareLanding";
import { sanitizeShareWord } from "@/lib/share";

type Props = { searchParams: Promise<{ w1?: string; w2?: string; w3?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = await searchParams;
  const og = new URL(`${siteUrl()}/s/og/words`);
  const w1 = sanitizeShareWord(q.w1) || "Amor";
  const w2 = sanitizeShareWord(q.w2) || "Trabajo";
  const w3 = sanitizeShareWord(q.w3) || "Casa";
  og.searchParams.set("w1", w1);
  og.searchParams.set("w2", w2);
  og.searchParams.set("w3", w3);
  return {
    title: "Mi 2027 en 3 palabras",
    description: `${w1} · ${w2} · ${w3}`,
    openGraph: {
      title: "Mi 2027 en 3 palabras · AstroEngine",
      images: [{ url: og.toString(), width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [og.toString()] },
  };
}

export default function WordsSharePage() {
  return <ShareLanding kind="words" />;
}
