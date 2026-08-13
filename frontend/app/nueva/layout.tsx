import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tus 6 áreas — AstroEngine",
  description:
    "Fecha, hora y ciudad. En 30 segundos ves 6 lecturas hechas para ti: amor, dinero, trabajo, salud, familia y crecimiento.",
};

export default function NuevaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
