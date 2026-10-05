# STATUS v1

Última actualización: 2026-10-05 (fin Oleada 3)

| Oleada | Estado |
|--------|--------|
| 0 descubrimiento | **HECHO** |
| 1 producción | **HECHO** en `v1/oleada-1` → merge a `release/v1-comercial`. CI es la fuente de verdad de pytest (Windows sin MSVC). |
| 2 Pro que se vende | **HECHO** en `v1/oleada-2` → merge a `release/v1-comercial`. Mock + waitlist. D1 sigue 🛑. |
| 3 crecimiento | **HECHO** en `v1/oleada-3` → merge a `release/v1-comercial`. Share OG + regalos + SEO + `/en` + PDF servidor. Plus y Mercado Pago 🛑. Sinastría diferida. |
| 4 lanzamiento | no empezada |

Rama de integración: `release/v1-comercial`. Nunca push a `main`.

## Oleada 1 — entregado

- A1: Next 16.3.8 + React 19.3; pins FastAPI 0.142.2 / Starlette 1.7.0; `.se1` en Dockerfile + `scripts/fetch_ephe.py`; `lib/site.ts`; CI ampliado; `render.yaml` documenta starter (sigue `plan: free` hasta D8 pagado).
- A2: proxy `X-Astro-Proxy-Key` + IP firmada; `/health` sin límite; natal_planets 1..20; body 64 KB; CSP nonce; LICENSE AGPL + NOTICE; legales con placeholders D11; allowlist SITE_URL (sin `*.vercel.app`).
- A3: `/api/places` (GeoNames cities5000 versionado); `tz_name` + zoneinfo; `raw_intensity` + `key_events`; LRU en proceso; golden ±0,05° (skip sin `.se1`).

🛑 Legales **no** son copy definitivo (D11 vacío). 🛑 D1 Lemon Squeezy sigue pendiente — cobro real apagado (`PRO_MODE=waitlist`, provider mock). Store en memoria: sin `DATABASE_URL` no hay persistencia de órdenes entre deploys.

## Oleada 2 — entregado

- A4: catálogo, `PRO_MODE`, checkout/webhook mock, magic link, entitlements, kill soft-unlock, tests de dinero.
- A5: ProOffer, `/pro`, `/pro/gracias`, `/mis-mapas`, año móvil, gating de `/transitos`, contraste.
- A6: clima relativo, voces invariables, `t(key, vars)`, TONO.md, disclaimers salud/dinero.
- A7: PostHog cookieless, opt-in, SEO `/pro` JSON-LD.
- A8: invariantes mock + grep $2.99.

🛑 **Antes de promover a prod:** el mismo `BACKEND_PROXY_KEY` en Vercel y Render. Sin él, `/api/*` = 403. `/health` sigue abierto. Keepalive no se borra hasta D8 pagado.

## Oleada 3 — entregado

- Share OG (`/s/areas`, `/s/words`, `/s/og/*`) y `?ref=` (cookie + orden). Cupón live del proveedor 🛑 D1; mock etiqueta `REF_*`.
- `year_map_gift` activo: checkout sin carta del comprador, entrega por cron/inmediata, canje `/regalo/canjear`.
- Cron diario `GET /api/cron/jobs` (Vercel): regalos vencidos + recordatorio mensual el día 1 UTC. Requiere `CRON_SECRET` y `RESEND_API_KEY`+`EMAIL_FROM` para salir de no-op.
- SEO `/guia/mercurio-retrogrado-2027` y `/guia/lunas-2027` desde el backend de calendario. `/calendario` y `/geopolitica` siguen archivados (D9).
- `/en` + `hreflang` (rewrite, no se movió el árbol de páginas).
- PDF servidor `GET /api/pro/year-map.pdf` (sesión + derecho). Adjunto de email cuando Resend está configurado; sin key es no-op.
- Plus **apagado** (go/no-go §4.3 no cumplido: no hay ventas reales).
- Mercado Pago **no** (D1).
- Sinastría **diferida**: no hay motor ni corpus en el repo; no se stubbea un cálculo falso.
