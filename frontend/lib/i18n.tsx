"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { es } from "./locales/es";
import { en } from "./locales/en";
import type { TranslationKeys } from "./locales/es";

export type Lang = "es" | "en";

const DICTIONARIES: Record<Lang, Record<string, string>> = {
  es: es as unknown as Record<string, string>,
  en: en as unknown as Record<string, string>,
};

const STORAGE_KEY = "lang";

type TVars = Record<string, string | number>;

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKeys, vars?: TVars) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "es",
  setLang: () => {},
  t: (key) => String(key),
});

function langFromDocument(): Lang | null {
  if (typeof document === "undefined") return null;
  const html = document.documentElement.getAttribute("lang");
  if (html === "en" || html === "es") return html;
  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => langFromDocument() ?? "es");

  useEffect(() => {
    const fromHtml = langFromDocument();
    if (fromHtml) {
      setLangState(fromHtml);
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored === "es" || stored === "en") {
        setLangState(stored);
      }
    } catch {
      // localStorage not available (SSR or blocked)
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.cookie = `ae_lang=${l}; path=/; max-age=${60 * 24 * 60 * 60}; samesite=lax`;
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: TranslationKeys, vars?: TVars): string => {
      const raw = DICTIONARIES[lang][key] ?? DICTIONARIES["es"][key] ?? String(key);
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, k: string) =>
        vars[k] === undefined ? `{${k}}` : String(vars[k]),
      );
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  return useContext(I18nContext);
}
