import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal — AstroEngine",
  description: "Términos, privacidad, reembolsos y contacto. Placeholders de identidad legal (D11).",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
