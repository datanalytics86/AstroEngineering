/**
 * POST JSON contra los proxies /api/* con tolerancia al cold start del backend
 * (Render free tier hiberna; la primera petición puede tardar ~50s en despertar).
 *
 * Si la primera pasada falla con 503/502 (proxy reporta backend despertando) o
 * con error de red, notifica vía onWaking(), espera 5s y reintenta UNA vez.
 * Devuelve la Response final; relanza el error de red de la segunda pasada.
 * Mismo patrón que usa la página de Geopolítica.
 */
export async function postWithWakingRetry(
  url: string,
  body: unknown,
  onWaking?: () => void,
): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if ((res.status === 503 || res.status === 502) && attempt === 0) {
        onWaking?.();
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      return res;
    } catch (e) {
      if (attempt === 0) {
        onWaking?.();
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      throw e;
    }
  }
  // Inalcanzable (el bucle siempre retorna o relanza), pero TypeScript no lo sabe.
  throw new Error("unreachable");
}

/** Variante GET del mismo patrón de tolerancia a cold start. */
export async function getWithWakingRetry(
  url: string,
  onWaking?: () => void,
): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url);
      if ((res.status === 503 || res.status === 502) && attempt === 0) {
        onWaking?.();
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      return res;
    } catch (e) {
      if (attempt === 0) {
        onWaking?.();
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      throw e;
    }
  }
  throw new Error("unreachable");
}
