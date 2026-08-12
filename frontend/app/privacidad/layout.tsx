import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad — AstroEngine",
  description:
    "Cómo tratamos fecha, hora y lugar de nacimiento: cálculo en tiempo real, sin cuenta, guardado solo en tu navegador.",
};

export default function PrivacidadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
