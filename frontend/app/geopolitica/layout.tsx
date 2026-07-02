import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Análisis Geopolítico — AstroEngine Pro",
  description:
    "Astrología mundial: ciclos de planetas lentos 2026-2027, análogos históricos verificados, timeline interactivo e índice cíclico de Barbault. Interpretación analógica, no predicción factual.",
};

export default function GeopoliticaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
