/**
 * Observabilidad fail-soft (Sentry opcional).
 * - Sin NEXT_PUBLIC_SENTRY_DSN: no-op + un warning en cliente.
 * - Nunca lanza: la app sigue funcionando si Sentry falla o no está.
 * - No loggear PII de cartas (fecha/hora/coords completas).
 */

type SentryLike = {
  init: (opts: Record<string, unknown>) => void;
  captureException: (error: unknown, hint?: Record<string, unknown>) => void;
  captureMessage: (message: string, level?: string) => void;
  addBreadcrumb: (breadcrumb: Record<string, unknown>) => void;
};

let sentry: SentryLike | null = null;
let initAttempted = false;
let warnedMissingDsn = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Inicializa Sentry en el cliente si hay DSN. Idempotente y fail-soft. */
export function initClientSentry(): void {
  if (!isBrowser() || initAttempted) return;
  initAttempted = true;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    if (!warnedMissingDsn) {
      console.warn(
        "[observability] NEXT_PUBLIC_SENTRY_DSN no configurado; Sentry desactivado (fail-soft)",
      );
      warnedMissingDsn = true;
    }
    return;
  }

  import("@sentry/browser")
    .then((mod) => {
      const S = mod as unknown as SentryLike;
      S.init({
        dsn,
        environment:
          process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
          process.env.NODE_ENV ||
          "production",
        tracesSampleRate: 0.05,
        // No enviar cookies/IP por defecto del SDK de forma agresiva
        sendDefaultPii: false,
      });
      sentry = S;
    })
    .catch((err) => {
      console.warn("[observability] Sentry init falló (fail-soft)", err);
    });
}

/** Captura un error de UI / window (fail-soft). */
export function captureException(
  error: unknown,
  context?: Record<string, string | number | boolean>,
): void {
  console.error(error);
  try {
    sentry?.captureException(error, context ? { extra: context } : undefined);
  } catch {
    // never throw
  }
}

/** Evento de producto / ops (breadcrumb + message en errores). */
export function trackEvent(
  name: string,
  data?: Record<string, string | number | boolean>,
): void {
  try {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info(`[event] ${name}`, data ?? {});
    }
    sentry?.addBreadcrumb({
      category: "app",
      message: name,
      data: data ?? {},
      level: name.includes("error") ? "error" : "info",
    });
    if (name.includes("error") || name.endsWith(".error")) {
      sentry?.captureMessage(name, "error");
    }
  } catch {
    // never throw
  }
}

/**
 * Log de fallo de proxy Next → backend (server o cliente).
 * No importa Sentry en server para no complicar el bundle de route handlers.
 */
export function logProxyUpstreamError(
  path: string,
  status: number,
  detail?: string,
): void {
  const payload = {
    event: "api.proxy.upstream_error",
    path,
    status,
    detail: detail ?? undefined,
  };
  console.error(JSON.stringify(payload));
  if (isBrowser()) {
    trackEvent("api.proxy.upstream_error", { path, status });
  }
}
