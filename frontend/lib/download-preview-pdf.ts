import { createElement, type ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import type { TierMinus1Content } from "./types";
import { trackLearning } from "./learning";
import { getProSampleContent } from "./pro-sample";

export function slugifyPdfName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || "mapa";
}

export async function downloadTierMinus1Pdf(content: TierMinus1Content): Promise<void> {
  const [{ pdf }, { default: TierMinus1Document }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/TierMinus1Document"),
  ]);

  const doc = createElement(TierMinus1Document, { content }) as unknown as ReactElement<DocumentProps>;
  const blob = await pdf(doc).toBlob();
  const prefix = content.lang === "en" ? "life-map" : "mapa-de-vida";
  const filename = `${prefix}-${slugifyPdfName(content.name)}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  trackLearning("pdf_downloaded", { lang: content.lang });
}

export async function downloadProSamplePdf(lang: "es" | "en" = "es"): Promise<void> {
  const content = getProSampleContent(lang);
  const [{ pdf }, { default: ProSampleDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/ProSampleDocument"),
  ]);
  const doc = createElement(ProSampleDocument, { content }) as unknown as ReactElement<DocumentProps>;
  const blob = await pdf(doc).toBlob();
  const filename = lang === "en" ? "astroengine-pro-sample.pdf" : "astroengine-pro-ejemplo.pdf";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  trackLearning("pro_sample_pdf", { lang });
}
