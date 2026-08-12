import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nueva carta natal — AstroEngine",
  description:
    "Calcula tu carta natal con precisión astronómica real (Swiss Ephemeris): 12 planetas, casas Placidus, aspectos y dignidades.",
};

export default function NuevaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
