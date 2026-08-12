# AstroEngine Pro — Deploy & Ops (2026-08)

Guía corta y **actual**. Los documentos `GAP_ANALYSIS_DEPLOY.md` y `AUDIT_DEPLOY.md` son históricos; ver su sección superior “Estado 2026-08”.

## Producción

| Capa | URL | Plataforma |
|------|-----|------------|
| Frontend | https://astro-engineering.vercel.app | Vercel (root dir: `frontend`) |
| **Backend API (real)** | **https://astroengine-backend.onrender.com** | Render Docker (`render.yaml`, service name) |
| Host corto (⚠️ stub) | https://astroengine.onrender.com | Responde `/health` `{"status":"ok"}` pero **404 en `/api/*`** (2026-08-03) |

> **Verificación 2026-08:** el FE en Vercel proxya correctamente carta/calendario (200). El host API real es `astroengine-backend.onrender.com` (`{"status":"ok","service":"astroengine-backend"}` + `/api/calendar` 200). Si se desea el host corto como canónico, hay que apuntarlo al mismo servicio Render o deprecarlo.

## Variables de entorno

### Render (backend) — obligatorias

| Variable | Valor | Notas |
|----------|-------|-------|
| `ENV` | `production` | En `render.yaml` |
| `EPHE_PATH` | `/usr/share/swisseph/ephe` | En `render.yaml` |
| `FRONTEND_URL` | `https://astro-engineering.vercel.app` | **Manual** (sync: false). Sin trailing slash. |

### Render — opcionales

| Variable | Valor | Notas |
|----------|-------|-------|
| `ALLOWED_ORIGINS` | origen extra exacto | Solo si hace falta un preview/admin adicional |
| `SENTRY_DSN` | DSN del proyecto Sentry | Fail-soft: sin DSN la app arranca |
| `SENTRY_ENVIRONMENT` | `production` | Default = valor de `ENV` |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.05` | Opcional |

### Vercel (frontend) — obligatorias

| Variable | Valor | Notas |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://astroengine-backend.onrender.com` | **Sin trailing slash. No localhost en prod.** Root dir: `frontend`. Debe ser el host que sirve `/api/*` (no el stub corto). |

### Vercel — opcionales

| Variable | Valor | Notas |
|----------|-------|-------|
| `BACKEND_URL` | misma URL del BE | Server-only en proxies; si falta, usa `NEXT_PUBLIC_API_URL` |
| `NEXT_PUBLIC_SENTRY_DSN` | DSN frontend | Fail-soft |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `production` | Opcional |
| `STRIPE_SECRET_KEY` | `sk_live_…` o `sk_test_…` | Activa Checkout real de Pro ($2.99). Sin ella, el CTA sigue en modo investigación (“¿pagarías?”). |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` | Opcional. Endpoint: `https://astro-engineering.vercel.app/api/checkout/webhook` (evento `checkout.session.completed`) |
| `STRIPE_PRICE_ID` | `price_…` | Opcional. Si falta, se crea un price de $2.99 USD en la sesión |
| `NEXT_PUBLIC_SITE_URL` | `https://astro-engineering.vercel.app` | Fallback de origin; en Vercel se usa el `Origin` de la request |

> **Hueco humano:** este repo no puede leer los dashboards de Vercel/Render. Verificar en UI que los valores de prod coinciden con la tabla. No inventar secrets.

## Auditoría live 2026-08-12

Verificado contra producción (no contra dashboards):

| Check | Resultado |
|-------|-----------|
| `GET /` Vercel | 200 |
| `GET https://astroengine-backend.onrender.com/health` | 200 `{"status":"ok","service":"astroengine-backend"}` (~22s en cold start) |
| `GET https://astroengine.onrender.com/health` | 200 stub `{"status":"ok"}` — **no usar como API** |
| `POST /api/chart` vía proxy (Santiago 1990-05-15 14:30) | 200; Sol Tauro, ASC Virgo |
| `GET /api/calendar?year=2026&month=8` | 200 |
| `GET /api/mundane/countries` | 200 |
| Headers FE | CSP, nosniff, DENY, Referrer-Policy, Permissions-Policy |
| `/geopolitica` `/calendario` | `noindex,nofollow` + `robots.txt` Disallow |
| Pro paywall | Hasta este deploy: soft unlock + pregunta “¿pagarías $2.99?”. Checkout Stripe queda listo; se enciende con `STRIPE_SECRET_KEY`. |

Cold start: keepalive cada 10 min + ping `/api/health` al abrir el sitio (una vez por pestaña).

## Keepalive anti cold-start

- Workflow: `.github/workflows/keepalive.yml`
- Cron: cada 10 min → `GET https://astroengine-backend.onrender.com/health`
- Best-effort (`|| true`): no alarma si falla

## Checklist pre-deploy

1. [ ] `main` o branch de release con CI verde (pytest + verify_corpus + check:i18n + build)
2. [ ] Render: `FRONTEND_URL` exacto del FE de prod
3. [ ] Vercel: `NEXT_PUBLIC_API_URL` del BE de prod (sin `/` final)
4. [ ] (Opcional) Sentry DSN BE + FE configurados
5. [ ] No hay secrets en el código ni en commits

## Checklist post-deploy

```bash
# Infra
curl -sI https://astro-engineering.vercel.app | head -n 20
curl -s https://astroengine-backend.onrender.com/health
# Esperado: {"status":"ok","service":"astroengine-backend"}

# Headers de seguridad (FE)
curl -sI https://astro-engineering.vercel.app | grep -iE "content-security-policy|x-content-type|x-frame|referrer-policy|permissions-policy"

# Smoke vía FE proxy (camino real del usuario)
curl -s -X POST "https://astro-engineering.vercel.app/api/chart" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke","birth_date":"1990-05-15","birth_time":"14:30","latitude":-33.4489,"longitude":-70.6693,"timezone_offset":-4}'

curl -s "https://astro-engineering.vercel.app/api/calendar?year=2026&month=8"

# Smoke API directa (backend real)
curl -s -X POST "https://astroengine-backend.onrender.com/api/chart" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke","birth_date":"1990-05-15","birth_time":"14:30","latitude":-33.4489,"longitude":-70.6693,"timezone_offset":-4}'
```

### UI manual

- Portada → `/nueva` → calcular carta
- Tránsitos de una carta guardada
- `/calendario` (rápidos + lentos)
- `/geopolitica` (modo mundial)
- ES/EN sin claves rotas
- Consola: cero errores propios de la app

## Rollback

| Capa | Cómo |
|------|------|
| **Vercel** | Deployments → deployment anterior → **Promote to Production** |
| **Render** | Service → Events / Manual Deploy → redeploy del commit anterior, o rollback del deploy en el dashboard |
| **Git** | `git revert` del merge del PR de hardening y push a `main` (dispara redeploy) |

## Rate limits (prod)

| Ruta | Límite |
|------|--------|
| `GET /health` | 10/min |
| `POST /api/chart` | 20/min |
| `POST /api/transits` | 5/min |
| `POST /api/solar-return` | 10/min |
| `POST /api/mundane` | 5/min |
| `GET /api/mundane/countries` | 10/min |
| `GET /api/calendar` | 10/min |

**No martillar producción** para probar 429.

## Módulos sagrados (no romper)

- Carta natal, tránsitos, retorno solar, geopolítica, calendario
- i18n ES/EN (paridad de claves)
- Swiss Ephemeris / precisión ±0.05° y `verify_corpus`
