import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import NavHeader from "@/components/NavHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "AstroEngine",
  description: "Cómo te va el amor, el dinero y el trabajo — en claro. Seis lecturas gratis en 30 segundos.",
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
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
