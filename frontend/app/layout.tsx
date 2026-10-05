import type { Metadata } from "next";
import { headers } from "next/headers";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import NavHeader from "@/components/NavHeader";
import SiteFooter from "@/components/SiteFooter";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600"],
  display: "swap",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AstroEngine",
  description: "Cómo te va el amor, el dinero y el trabajo — en claro. Seis lecturas gratis en 30 segundos.",
  icons: { icon: "/favicon.svg" },
};

const THEME_BOOT = `(function(){try{var t=localStorage.getItem("astro_theme");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="es"
      data-theme="dark"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
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
