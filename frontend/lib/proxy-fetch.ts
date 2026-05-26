export async function proxyFetch(path: string, body: unknown, timeoutMs = 60_000) {
  const BACKEND = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e: unknown) {
    const isTimeout = e instanceof Error && e.name === "TimeoutError";
    const msg = isTimeout
      ? "El servidor tardó demasiado en responder. La primera petición tras un período de inactividad puede tardar hasta 60s — reintenta."
      : "No se pudo conectar con el servidor de cálculo. Reintenta en unos segundos.";
    return Response.json({ detail: msg }, { status: 503 });
  }
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    let detail = text || "Error en el servidor de cálculo";
    try { detail = JSON.parse(text).detail ?? detail; } catch { /* texto plano */ }
    return Response.json({ detail }, { status: upstream.status });
  }
  try {
    return Response.json(await upstream.json());
  } catch {
    return Response.json({ detail: "Respuesta inválida del servidor" }, { status: 502 });
  }
}
