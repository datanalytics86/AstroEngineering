# AstroEngine Pro

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

| Método | Ruta              | Rate limit | Descripción                     |
|--------|-------------------|------------|---------------------------------|
| GET    | /health           | 10/min     | Health check                    |
| POST   | /api/chart        | 20/min     | Carta natal                     |
| POST   | /api/transits     | 5/min      | Tránsitos (año actual + 4 años) |
| POST   | /api/solar-return | 10/min     | Retorno solar                   |

## Deployment a producción

### Backend en Render (gratuito)

1. Conectar el repo a Render → autoselecciona `render.yaml`
2. Configurar manualmente la env var `FRONTEND_URL` con la URL de Vercel

### Frontend en Vercel (gratuito)

1. New Project → Root Dir: `frontend`
2. Env var: `NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com`

Ver `CLAUDE.md` para documentación completa del proyecto y `GAP_ANALYSIS_DEPLOY.md` para el roadmap de seguridad.

## Validación de precisión

Posiciones planetarias validadas contra [astro.com](https://astro.com) con tolerancia ±0.05° (3 arcominutos):

- 15 May 1990 · 14:30 · Santiago, Chile
- 01 Ene 2000 · 00:00 · Londres
- 21 Jun 1985 · 08:15 · Ciudad de México
