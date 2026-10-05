# Decisiones efectivas — AstroEngine v1 comercial

Fecha: 2026-10-05  
Rama: `release/v1-comercial` @ `c75f905` (+ este paquete de Oleada 0)  
SPEC: `docs/v1/MEGAPROMPT_GROK_4.7.md` (SPEC-002 Accepted)

Las celdas **PENDIENTE 🛑** bloquean cobro real (D1), lanzamiento (D2) o copy legal publicado (D11). El resto se ejecuta con el valor de esta tabla.

| ID | Decisión | Valor efectivo | Origen | Estado |
|----|----------|----------------|--------|--------|
| D1 | Cómo cobrar | Proveedor principal **Lemon Squeezy**, **solo después** de confirmación escrita de que aceptan “reportes astrológicos personalizados generados por software (web + PDF)”. **Paddle descartado**. Mercado Pago como respaldo local (CLP). Mientras no haya sí escrito: adaptador `mock` + `PRO_MODE=waitlist`. Stripe se porta como adaptador apagado. | Dueño, 2026-10-05 | **PENDIENTE 🛑** (mensaje listo para enviar; ver abajo) |
| D2 | Licencia Swiss Ephemeris | **AGPL-3.0**: `LICENSE` en el repo (al menos `backend/` + raíz) + enlace visible “Código fuente”. | Dueño | **HECHO** Oleada 1 — `LICENSE` AGPL-3.0 + `NOTICE` + footer “Código fuente” |
| D3 | Dominio propio | **todavía no**. Fallback canónico: `https://astro-engineering.vercel.app`. | Dueño (no rellenó el corchete) | **PENDIENTE 🛑** para lanzamiento; no bloquea Oleada 1 |
| D4 | Precios de lanzamiento | Mapa del Año **US$9,99 / CLP 8.990** · Regalo igual · Order bump **US$5,99** · Plus **US$4,99/mes o US$29,99/año (apagado)** | Recomendación §0 | **ACEPTADO** (catálogo único; no hardcodear) |
| D5 | Analítica | **PostHog** sin cookies | Recomendación §0 | **ACEPTADO** — Oleada 2 (A7). Cuenta: runbook humano |
| D6 | Base de datos | **Neon Postgres + Drizzle** | Recomendación §0 | **ACEPTADO** — Oleada 2 (A4-1) |
| D7 | Email transaccional | **Resend** | Recomendación §0 | **ACEPTADO** — Oleada 2 (A4-8) |
| D8 | Infraestructura | **Vercel Pro (US$20/mes) + Render Starter (US$7/mes)** | Recomendación §0 | **ACEPTADO en SPEC**; el **pago de las cuentas** es 🛑 humano. Código de `render.yaml` (`plan: starter`) se prepara en Oleada 1; no se apaga keepalive hasta que el plan esté activo |
| D9 | Módulos archivados | `/geopolitica` y `/calendario` **siguen archivados** en v1 | Recomendación §0 | **ACEPTADO** |
| D10 | Suscripción Plus | **Apagada** (feature flag) | Recomendación §0 | **ACEPTADO** |
| D11 | Identidad legal | Placeholders `{{LEGAL_NAME}}`, `{{RUT}}`, `{{ADDRESS}}`, `{{SUPPORT_EMAIL}}`. **No se inventa nada.** | Dueño | **PENDIENTE 🛑** para publicar legales |

## Decisiones de diseño que A0 cierra ahora (reversibles, cubiertas por el SPEC)

| ID | Tema | Decisión | Quién ejecuta |
|----|------|----------|---------------|
| AD-01 | Stack Next | Next **16.3.x + React 19** (no el parche 14.2.35: no cierra los RCE de ≥15.5.24). | A1-1 |
| AD-02 | `PRO_MODE` en prod hasta D1 | `waitlist`. Cero soft-unlock. Cero copy “Pago confirmado”. | A4-7 + A5-1 (Oleada 2). Oleada 1 no toca el paywall de producto, sí puede cortar el copy falso si A5 entra un PR mínimo — **no**: Oleada 1 es P0 técnico. El corte de H-12 es Oleada 2. |
| AD-03 | Auth | Implementación mínima de magic link (SPEC). A4-5 evalúa Better Auth vs mínimo y deja la elección en este archivo antes de codear. Default: mínimo. | A4-5 |
| AD-04 | Hueco DST | Offset con `zoneinfo` a la hora local exacta; hora inexistente/ambigua → `fold=0` + `tz_warning` legible. `timezone_offset` queda como override manual. | A3-2 |
| AD-05 | Quirón ausente | Respuesta 200 con los cuerpos calculables + `chart_warning`. No silenciar. Tests dejan de aceptar 11 cuerpos cuando haya `.se1` (A1-3). | A3 + A1-3 |
| AD-06 | Places | GeoNames `cities5000` + latin/ascii alternates. Si Punta Arenas no entra, bajar el umbral solo para CL. | A3-1 |
| AD-07 | Caché de tránsitos | LRU **en proceso**. N workers = N caches, documentado. Redis fuera de v1. | A3-4 |
| AD-08 | Tests de dinero | Se mergean **verdes** contra el adaptador `mock`, no rojos. | A4 + A8 |
| AD-09 | CI en la rama de integración | Ampliar `on.push.branches` a `release/v1-comercial` y `v1/**`. | A1-5 |
| AD-10 | `/health` sin rate limit | Adelantar el unlimit en el mismo PR de A2-1, **antes** de subir Render Starter. | A2-1 |

## D1 — mensaje para Lemon Squeezy (pegar tal cual)

Enviar por el formulario de soporte / chat de onboarding **antes** de crear productos. Fuentes: [prohibited products](https://www.lemonsqueezy.com/docs/help/getting-started/prohibited-products) (PDFs y Software & SaaS están en “acceptable”; “Services of any kind” y “products restricted by our payment processing partners” son el riesgo) y [supported countries](https://docs.lemonsqueezy.com/help/getting-started/supported-countries) (Chile figura en bank payouts).

```
Subject: Pre-approval — personalized astrological reports (software-generated web + PDF)

Hello Lemon Squeezy team,

I am a merchant in Chile (bank payouts listed as supported). Before I integrate checkout, I need written confirmation that you accept this product.

Product
- Name: AstroEngine — “Mapa del Año” / Year Map
- What the customer buys: a one-time digital product. Software (Swiss Ephemeris) generates a personalized astrological report from the customer’s birth data. Delivery is (1) a web view of a 12-month map and (2) a downloadable PDF (8 pages). Optional later: .ics calendar file and a gift SKU of the same digital product.
- What it is not: not a live reading, not consulting, not a subscription to human services, not fortune-telling as a service, not a physical good.
- Positioning in the product copy: orientation and self-knowledge / entertainment. Not medical, psychological, financial or legal advice. Not a prediction of events.
- Price (planned): USD 9.99 one-time (local CLP 8.990 if you support it). 14-day refund.

Please confirm in writing:
1) You accept “personalized astrological reports generated by software, delivered as web + PDF”.
2) This is classified as a digital product / software (PDF + SaaS-style web delivery), not as a prohibited “service of any kind”.
3) It is not treated as a product restricted by your payment processing partners (including Stripe’s restricted businesses for psychic / fortune-telling services).
4) Chile is supported for merchant payouts for this account.

I will not enable live checkout until I have your written yes. Thank you.
```

Hasta que respondan **sí por escrito**, A4 implementa `BillingProvider` + adaptadores `mock` y `stripe` (apagado). **No** se escribe el adaptador `lemonsqueezy` activo.

Paddle queda fuera: [AUP ítem 14](https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle) — “Digital services associated with pseudo-science, including but not limited to clairvoyance, horoscopes, fortune-telling” (página verificada 2026-10-05).
