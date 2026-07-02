import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Glosario astrológico — AstroEngine Pro",
  description:
    "Referencia completa de planetas, aspectos, dignidades esenciales, ángulos, orbes y retrogradación en astrología.",
};

export default function GlosarioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
