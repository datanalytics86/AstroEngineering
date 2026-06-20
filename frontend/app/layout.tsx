import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import NavHeader from "@/components/NavHeader";

export const metadata: Metadata = {
  title: "AstroEngine Pro",
  description: "Cartas natales y tránsitos planetarios con precisión astronómica real",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-base text-slate-900 font-sans antialiased min-h-screen">
        <Providers>
          <NavHeader />
          <main>{children}</main>
          <NavFooter />
        </Providers>
      </body>
    </html>
  );
}

function NavFooter() {
  return (
    <footer className="border-t border-border mt-16 px-6 py-6 text-center text-xs text-slate-400 font-mono">
      AstroEngine Pro — Swiss Ephemeris · Precisión ±0.05° · Cálculos validados contra astro.com
    </footer>
  );
}
