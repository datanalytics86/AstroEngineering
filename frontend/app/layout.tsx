import type { Metadata } from "next";
import { headers } from "next/headers";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import NavHeader from "@/components/NavHeader";
import SiteFooter from "@/components/SiteFooter";
import { siteUrl } from "@/lib/site";
import { withLocalePrefix } from "@/lib/locale-path";

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

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const locale = h.get("x-locale") === "en" ? "en" : "es";
  const pathname = h.get("x-pathname") || "/";
  const base = siteUrl();
  const esUrl = `${base}${pathname === "/" ? "" : pathname}`;
  const enUrl = `${base}${withLocalePrefix(pathname, "en")}`;
  return {
    metadataBase: new URL(base),
    title: { default: "AstroEngine", template: "%s · AstroEngine" },
    description:
      locale === "en"
        ? "How love, money and work go for you — in plain language. Six free readings in 30 seconds."
        : "Cómo te va el amor, el dinero y el trabajo — en claro. Seis lecturas gratis en 30 segundos.",
    alternates: {
      canonical: locale === "en" ? enUrl : esUrl,
      languages: {
        es: esUrl,
        en: enUrl,
        "x-default": esUrl,
      },
    },
    openGraph: {
      title: "AstroEngine",
      description:
        locale === "en"
          ? "How love, money and work go for you — in plain language."
          : "Cómo te va el amor, el dinero y el trabajo — en claro.",
      url: locale === "en" ? enUrl : esUrl,
      siteName: "AstroEngine",
      locale: locale === "en" ? "en_US" : "es_CL",
      type: "website",
    },
    icons: { icon: "/favicon.svg" },
  };
}

const THEME_BOOT = `(function(){try{var t=localStorage.getItem("astro_theme");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark");}catch(e){document.documentElement.setAttribute("data-theme","dark");}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const nonce = h.get("x-nonce") ?? undefined;
  const locale = h.get("x-locale") === "en" ? "en" : "es";
  return (
    <html
      lang={locale}
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
