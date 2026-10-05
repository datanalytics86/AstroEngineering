# Riesgos abiertos

Fecha: 2026-10-05. Oleada 1 cerrada en código. Severidad: bloquea lanzamiento / bloquea cobro / degrada producto / deuda.

| ID | Sev | Riesgo | Evidencia | Mitigación | Dueño |
|----|-----|--------|-----------|------------|-------|
| R-01 | Bloquea cobro | Lemon Squeezy puede rechazar astrología. Su lista no la nombra, pero prohíbe “services of any kind” y lo que restrinjan Stripe/partners. | https://www.lemonsqueezy.com/docs/help/getting-started/prohibited-products | Mensaje D1. Sin sí escrito: `mock` + waitlist. Mercado Pago como plan B. | Dueño + A4 |
| R-02 | Bloquea cobro | Paddle prohíbe horóscopos. | https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle ítem 14 | Ya descartado. No reabrir. | A0 |
| R-03 | Bloquea cobro | Stripe no lista Chile. | https://stripe.com/global | Solo con entidad extranjera. Fuera de alcance. | Dueño |
| R-04 | Mitigado Oleada 1 | AGPL sin LICENSE. | `LICENSE` + `NOTICE` + footer | Hecho A2-6. Repo público AGPL. | A2 |
| R-05 | Bloquea lanzamiento | Ley 21.719 Chile (2026-12-01). Páginas legales con placeholders D11. | `app/(legal)/` | 🛑 dueño + abogado rellenan D11. | A2 + dueño |
| R-06 | Mitigado Oleada 1 | Next 14.2.3 RCE. | `package.json` next 16.3.8; audit 0 high/critical | Quedan 2 moderate (qs, baseline-browser-mapping). | A1 |
| R-07 | Mitigado Oleada 1 | FastAPI/Starlette 15 avisos. | pins 0.142.2 / 1.7.0; pip-audit 0 | TestClient depreca httpx a favor de httpx2 (warning). | A1 |
| R-08 | Mitigado código | natal_planets sin tope; event loop; health 10/min. | 1..20; threadpool+semáforo; `/health` unlimited | p95 bajo carga no medido (D8 free). | A1, A2 |
| R-09 | Crítica comercial | Pro se regala y la UI dice “Pago confirmado”. Checkout prod `{"enabled":false}`. | `carta/[id]/page.tsx:166-168`; `TopicSummarySection.tsx:415-417,566-571`; curl 2026-10-05 | Oleada 2: `PRO_MODE=waitlist`, entitlements servidor. | A4, A5 |
| R-10 | Crítica comercial | Lo pagado vive en `localStorage`; webhook = `console.info`. Contracargos y pérdida al cambiar de teléfono. | `storage.ts:220-279`; `webhook/route.ts:21-31` | A4-1..A4-7 | A4 |
| R-11 | Crítica producto | Mapa del año no distingue meses (umbral 6.5 + clip 10). Se vende el año calendario (en octubre, 9/12 meses ya pasaron). Teaser Marzo/Julio fijo. Concordancia rota. | `year-map.ts:246-247`; `carta/[id]/page.tsx:146,155,195,234,263`; `es.ts:193-194`; `pro-human.ts:126` | Oleada 2 A6 + A5 | A6, A5 |
| R-12 | Mitigado código | Quirón ausente; TZ de lista. | Dockerfile `.se1` SHA-256; `tz_name`+zoneinfo; `chart_warning` | Golden/corpus solo en CI Ubuntu. | A1, A3 |
| R-13 | Mitigado Oleada 1 | Nominatim autocomplete. | `/api/places` GeoNames + BirthDataForm debounce 250 ms | A5-8 (a11y teclado) residual Oleada 2. | A3 |
| R-14 | Mitigado Oleada 1 | `*.vercel.app` en checkout. | `lib/site.ts` allowlist SITE_URL | Preview usa `VERCEL_URL` exacto. | A2 |
| R-15 | Alta negocio | El dueño no ve ni un evento ni un email. Investigación “¿pagarías?” perdida. | `learning.ts:41-94` | PostHog + opt-in servidor (Oleada 2). Cuenta = runbook humano. | A7 + dueño |
| R-16 | Media infra | Render `plan: free` se duerme. Health prod **22550 ms**. Keepalive caduca ~60 días. | `render.yaml` sigue `plan: free` a propósito | 🛑 dueño paga D8; entonces `plan: starter` y se apaga keepalive. | Dueño + A1 |
| R-17 | Media | Migración Next 16 + `@react-pdf` + Turbopack. Alias webpack `next.config.mjs:45-48`. | código | `--webpack` o `turbopack.resolveAlias`; E2E de 3 PDFs es el gate | A1, A8 |
| R-18 | Media | pyswisseph sin rueda CPython 3.12 Windows (MSVC). | pytest local solo timezone/places | `tzdata==2026.1` pineado. CI Ubuntu 3.11 es la fuente de verdad. | A1 |
| R-19 | Media | `/transitos/[id]` entrega 5 años gratis, URL adivinable. Gating solo en UI no basta. | `transitos/[id]/page.tsx:434` | A5-6 + derecho en servidor | A5, A4 |
| R-20 | Baja | Share URL = PII en Base64. | `share.ts:22-32` | Declarar en privacidad (A2-7). Tokens cortos = P2. | A2, A7 |
| R-21 | Mitigado Oleada 1 | CI no corría en `release/v1-*`. | `ci.yml` `main`, `release/v1-*`, `v1/**` | Primer verde al pushear. gitleaks-action en repo público. | A1 |
| R-22 | Calendario | Ventana “Tu 2027” es nov–ene. Oleadas 1+2 deberían estar en prod **antes del 15-nov-2026**. | SPEC §4.7 | Prioridad: no abrir Oleada 3 antes de vender. | Dueño + A0 |

## Lo que A0 no va a hacer

- Inventar testimonios, “precio antes”, escasez, RUT o razón social.
- Encender Lemon Squeezy / Mercado Pago / Stripe live sin D1 escrito.
- Push o force-push a `main`.
- Debilitar tests para pasar.
- Declarar S1–S10 en verde sin pegar salida real.

## Riesgo nuevo post-Oleada 1

| ID | Sev | Riesgo | Mitigación |
|----|-----|--------|------------|
| R-23 | Crítica deploy | Promover backend `ENV=production` sin `BACKEND_PROXY_KEY` idéntico en Vercel+Render → 403 en `/api/*`. | Checklist `DEPLOY.md`. Setear **antes** del promote. `/health` no exige key. |
| R-24 | Deuda | Rate limit de borde in-memory por instancia (middleware Next). | Suficiente en Hobby; Upstash en Oleada 2 si hay abuso. |
| R-25 | Deuda | ESLint React 19: reglas nuevas apagadas (`set-state-in-effect`, etc.) para no reescribir efectos en Oleada 1. 5 warnings exhaustive-deps. | A5 Oleada 2. |
