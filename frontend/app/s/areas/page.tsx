import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import ShareLanding from "@/components/ShareLanding";

export async function generateMetadata(): Promise<Metadata> {
  const og = `${siteUrl()}/s/og/areas`;
  return {
    title: "Mis 6 áreas",
    description: "Cómo te va el amor, el dinero y el trabajo — en claro.",
    openGraph: { title: "Mis 6 áreas · AstroEngine", images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [og] },
  };
}

export default function AreasSharePage() {
  return <ShareLanding kind="areas" />;
}
