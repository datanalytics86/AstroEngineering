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

const THEME_BOOT = `(function(){try{var t=localStorage.getItem("astro_theme");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,560;9..144,640&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-base text-ink font-sans antialiased min-h-screen">
        <div className="lab-grain" aria-hidden />
        <Providers>
          <NavHeader />
          <main>{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
