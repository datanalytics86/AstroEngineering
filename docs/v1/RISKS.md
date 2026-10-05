# Riesgos abiertos — Oleada 0

Fecha: 2026-10-05. Severidad: bloquea lanzamiento / bloquea cobro / degrada producto / deuda.

| ID | Sev | Riesgo | Evidencia | Mitigación | Dueño |
|----|-----|--------|-----------|------------|-------|
| R-01 | Bloquea cobro | Lemon Squeezy puede rechazar astrología. Su lista no la nombra, pero prohíbe “services of any kind” y lo que restrinjan Stripe/partners. | https://www.lemonsqueezy.com/docs/help/getting-started/prohibited-products | Mensaje D1. Sin sí escrito: `mock` + waitlist. Mercado Pago como plan B. | Dueño + A4 |
| R-02 | Bloquea cobro | Paddle prohíbe horóscopos. | https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle ítem 14 | Ya descartado. No reabrir. | A0 |
| R-03 | Bloquea cobro | Stripe no lista Chile. | https://stripe.com/global | Solo con entidad extranjera. Fuera de alcance. | Dueño |
| R-04 | Bloquea lanzamiento | AGPL (pyswisseph / Swiss Ephemeris) y repo público sin LICENSE. | `backend/requirements.txt:3`; no hay `LICENSE` | D2 = AGPL: LICENSE + “Código fuente” en Oleada 1. | A2-6 |
| R-05 | Bloquea lanzamiento | Ley 21.719 Chile (2026-12-01) y 4 párrafos de privacidad. | `frontend/app/privacidad/page.tsx:12-18` | A2-7 con placeholders D11. 🛑 abogado. | A2 + dueño |
| R-06 | Crítica prod | Next 14.2.3: RCE Image Optimization AVIF y RCE en hosts Windows. `npm audit --omit=dev` = 1 critical + 2 high + 1 moderate. `npm audit fix` ofrece 14.2.35, **insuficiente**. | salida real Anexo B; `frontend/package.json:19` | Next 16.3.x (AD-01). No parchear 14.x “un poco”. | A1-1 |
| R-07 | Crítica prod | FastAPI 0.109.0 / Starlette 0.35.1: **15** avisos `pip-audit`. | salida real Anexo B | Pins H-02. | A1-2 |
| R-08 | Crítica prod | `/api/transits` sin tope de `natal_planets`; cómputo síncrono en `async def`; `/health` 10/min. Una petición congela a todos; Render puede 429 el health y reiniciar. | `models.py:41`; `main.py:175-277,162-163` | A2-2 + A1-2 + A2-1 (unlimit `/health` primero). | A1, A2 |
| R-09 | Crítica comercial | Pro se regala y la UI dice “Pago confirmado”. Checkout prod `{"enabled":false}`. | `carta/[id]/page.tsx:166-168`; `TopicSummarySection.tsx:415-417,566-571`; curl 2026-10-05 | Oleada 2: `PRO_MODE=waitlist`, entitlements servidor. | A4, A5 |
| R-10 | Crítica comercial | Lo pagado vive en `localStorage`; webhook = `console.info`. Contracargos y pérdida al cambiar de teléfono. | `storage.ts:220-279`; `webhook/route.ts:21-31` | A4-1..A4-7 | A4 |
| R-11 | Crítica producto | Mapa del año no distingue meses (umbral 6.5 + clip 10). Se vende el año calendario (en octubre, 9/12 meses ya pasaron). Teaser Marzo/Julio fijo. Concordancia rota. | `year-map.ts:246-247`; `carta/[id]/page.tsx:146,155,195,234,263`; `es.ts:193-194`; `pro-human.ts:126` | Oleada 2 A6 + A5 | A6, A5 |
| R-12 | Alta precisión | Quirón ausente en la imagen (sin `.se1`); TZ de lista + `round(lon/15)` + offset al mediodía del browser. 1 h ≈ 15° de Ascendente. | `Dockerfile:12-13`; `.gitignore:18`; `chart.py:101-104`; `BirthDataForm.tsx:94-121,123-126,536` | A1-3 + A3-1/A3-2 | A1, A3 |
| R-13 | Alta embudo | Nominatim como autocomplete (política OSMF). Si bloquean, cae `/nueva`. | `BirthDataForm.tsx:463-484`; https://operations.osmfoundation.org/policies/nominatim/ | A3-1 + A5-8 | A3, A5 |
| R-14 | Alta dinero | `requestOrigin` acepta cualquier `*.vercel.app`. | `stripe-server.ts:19-24` | A2-5; A4 no usa origin de la request | A2, A4 |
| R-15 | Alta negocio | El dueño no ve ni un evento ni un email. Investigación “¿pagarías?” perdida. | `learning.ts:41-94` | PostHog + opt-in servidor (Oleada 2). Cuenta = runbook humano. | A7 + dueño |
| R-16 | Media infra | Hobby de Vercel no es comercial; Render `plan: free` se duerme. Health vía FE medido **22550 ms**. Keepalive de repo público caduca a 60 días. | `render.yaml:13`; curl `/api/health` | D8: pagar Vercel Pro + Render Starter. Código en A1-4. | Dueño + A1 |
| R-17 | Media | Migración Next 16 + `@react-pdf` + Turbopack. Alias webpack `next.config.mjs:45-48`. | código | `--webpack` o `turbopack.resolveAlias`; E2E de 3 PDFs es el gate | A1, A8 |
| R-18 | Media | `tzdata` no está en `requirements.txt`. A3-2 falla en Windows/Alpine. Esta máquina **no pudo** instalar `pyswisseph` (MSVC). | pip log Oleada 0 | A1-2 pinnea `tzdata`. CI Ubuntu 3.11 sigue siendo la fuente de verdad de pytest. | A1 |
| R-19 | Media | `/transitos/[id]` entrega 5 años gratis, URL adivinable. Gating solo en UI no basta. | `transitos/[id]/page.tsx:434` | A5-6 + derecho en servidor | A5, A4 |
| R-20 | Baja | Share URL = PII en Base64. | `share.ts:22-32` | Declarar en privacidad (A2-7). Tokens cortos = P2. | A2, A7 |
| R-21 | Proceso | Push a `release/v1-comercial` no dispara CI (`ci.yml:3-6` solo `main`). | YAML | AD-09 | A1-5 |
| R-22 | Calendario | Ventana “Tu 2027” es nov–ene. Oleadas 1+2 deberían estar en prod **antes del 15-nov-2026**. | SPEC §4.7 | Prioridad: no abrir Oleada 3 antes de vender. | Dueño + A0 |

## Lo que A0 no va a hacer

- Inventar testimonios, “precio antes”, escasez, RUT o razón social.
- Encender Lemon Squeezy / Mercado Pago / Stripe live sin D1 escrito.
- Push o force-push a `main`.
- Debilitar tests para pasar.
- Declarar S1–S10 en verde sin pegar salida real.
