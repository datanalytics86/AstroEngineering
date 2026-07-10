import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendario Astrológico — AstroEngine Pro",
  description:
    "El cielo día a día: posiciones de Luna, Sol, Mercurio, Venus y Marte, con ingresos de signo, fases lunares, estaciones retrógradas y aspectos exactos del mes en curso y los dos siguientes. Lectura analógica, sin predicciones factuales.",
};

export default function CalendarioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
