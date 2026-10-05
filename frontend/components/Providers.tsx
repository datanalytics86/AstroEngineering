"use client";

import { useEffect, type ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { captureException, initClientSentry } from "@/lib/observability";
import BackendWarmup from "@/components/BackendWarmup";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref && /^[a-zA-Z0-9_-]{2,32}$/.test(ref)) {
        sessionStorage.setItem("ae_ref", ref);
      }
    } catch {
      /* ignore */
    }
    initClientSentry();

    const onError = (event: ErrorEvent) => {
      captureException(event.error ?? event.message, { source: "window.onerror" });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      captureException(event.reason, { source: "unhandledrejection" });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <LanguageProvider>
      <BackendWarmup />
      {children}
    </LanguageProvider>
  );
}
