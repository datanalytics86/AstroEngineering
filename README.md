# AstroEngine

Aplicación web de ingeniería astrológica profesional. Calcula cartas natales con precisión astronómica real (Swiss Ephemeris), detecta aspectos entre planetas, genera pronósticos de tránsitos planetarios y retornos solares. Incluye página de bienvenida, interfaz bilingüe ES/EN y glosario interactivo.

## Stack

| Capa      | Tecnología                                        |
|-----------|---------------------------------------------------|
| Backend   | Python 3.11 · FastAPI · pyswisseph · slowapi      |
| Frontend  | Next.js 14 · TypeScript · Tailwind · SVG puro     |
| Deploy    | Docker (local) · Vercel (frontend) · Render (backend) |

## Inicio rápido (Docker)

```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API docs: http://localhost:8000/docs (solo en desarrollo)
```

### Sin Docker

```bash
# Terminal 1
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2
cd frontend && npm install && npm run dev
```

## Endpoints

| Método | Ruta                     | Rate limit | Descripción                          |
|--------|--------------------------|------------|--------------------------------------|
| GET    | /health                  | 10/min     | Health check                         |
| POST   | /api/chart               | 20/min     | Carta natal                          |
| POST   | /api/transits            | 5/min      | Tránsitos (año actual + 4 años)      |
| POST   | /api/solar-return        | 10/min     | Retorno solar                        |
| POST   | /api/mundane             | 5/min      | Geopolítica / astrología mundial     |
| GET    | /api/mundane/countries   | 10/min     | Países (cartas nacionales)           |
| GET    | /api/calendar            | 10/min     | Calendario diario (mes + 2 siguientes) |

## Deployment a producción

**Guía actual:** [`DEPLOY.md`](./DEPLOY.md) (env vars, smoke tests, rollback).

| Capa | Prod |
|------|------|
| Frontend | https://astro-engineering.vercel.app |
| Backend API (real) | https://astroengine-backend.onrender.com |
| Backend host corto | https://astroengine.onrender.com (⚠️ stub `/health` only; no usar como API) |

### Backend en Render (gratuito)

1. Conectar el repo a Render → autoselecciona `render.yaml`
2. Configurar manualmente `FRONTEND_URL=https://astro-engineering.vercel.app`
3. (Opcional) `SENTRY_DSN` — fail-soft si falta

### Frontend en Vercel (gratuito)

1. New Project → Root Dir: `frontend`
2. Env var: `NEXT_PUBLIC_API_URL=https://astroengine-backend.onrender.com` (**sin** trailing slash; host que sirve `/api/*`)
3. (Opcional) `NEXT_PUBLIC_SENTRY_DSN` — fail-soft si falta

`GAP_ANALYSIS_DEPLOY.md` y `AUDIT_DEPLOY.md` son históricos; ver su sección **Estado 2026-08**. Documentación de producto: `CLAUDE.md`.

**TIER 1 learning:** [`docs/MVP_METRICS.md`](./docs/MVP_METRICS.md) · test de 5 usuarios: [`docs/FIVE_USER_TEST.md`](./docs/FIVE_USER_TEST.md).

## Validación de precisión

Posiciones planetarias validadas contra [astro.com](https://astro.com) con tolerancia ±0.05° (3 arcominutos):

- 15 May 1990 · 14:30 · Santiago, Chile
- 01 Ene 2000 · 00:00 · Londres
- 21 Jun 1985 · 08:15 · Ciudad de México
