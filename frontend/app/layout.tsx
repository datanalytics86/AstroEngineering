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
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-base text-slate-900 font-sans antialiased min-h-screen">
        <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-900 tracking-tight text-lg">AstroEngine</span>
            <span className="text-xs font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">Pro</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm text-slate-500">
            <a href="/" className="hover:text-blue-600 transition-colors">Carta Natal</a>
            <a href="https://astro.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors">Validar en astro.com</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t border-border mt-16 px-6 py-6 text-center text-xs text-slate-400 font-mono">
          AstroEngine Pro — Swiss Ephemeris · Precisión ±0.05° · Cálculos validados contra astro.com
        </footer>
      </body>
    </html>
  );
}
