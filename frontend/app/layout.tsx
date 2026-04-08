import type { Metadata } from "next";
import "./globals.css";

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
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-space-bg text-gray-100 font-sans antialiased min-h-screen">
        <header className="border-b border-space-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gold text-2xl">✦</span>
            <span className="font-serif text-xl text-gold tracking-wide">AstroEngine Pro</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm text-gray-400">
            <a href="/" className="hover:text-gold transition-colors">Carta Natal</a>
            <a href="#" className="hover:text-gold transition-colors">Tránsitos</a>
            <a href="#" className="hover:text-gold transition-colors">Documentación</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t border-space-border mt-16 px-6 py-6 text-center text-xs text-gray-600">
          AstroEngine Pro — Swiss Ephemeris · Precisión ±0.05° · Cálculos validados contra astro.com
        </footer>
      </body>
    </html>
  );
}
