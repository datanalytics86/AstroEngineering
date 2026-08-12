"use client";

import { useEffect, type ReactNode } from "react";
import { LanguageProvider } from "@/lib/i18n";
import { captureException, initClientSentry } from "@/lib/observability";
import BackendWarmup from "@/components/BackendWarmup";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
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
