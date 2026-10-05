export type SiteLang = "es" | "en";

export function stripLocalePrefix(pathname: string): { locale: SiteLang; pathname: string } {
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const rest = pathname.slice(3) || "/";
    return { locale: "en", pathname: rest.startsWith("/") ? rest : `/${rest}` };
  }
  return { locale: "es", pathname: pathname || "/" };
}

export function withLocalePrefix(pathname: string, locale: SiteLang): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === "en") return path === "/" ? "/en" : `/en${path}`;
  return path;
}

export function isApiOrInternalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/fonts/")
  );
}
