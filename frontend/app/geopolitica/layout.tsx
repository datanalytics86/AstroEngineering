import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Análisis geopolítico — archivo",
  description: "Función archivada. El producto activo es la carta natal y los temas de vida.",
  robots: { index: false, follow: false },
};

export default function GeopoliticaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
