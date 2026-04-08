# AstroEngine Pro

Aplicación web de ingeniería astrológica profesional. Calcula cartas natales con precisión astronómica real (Swiss Ephemeris), detecta aspectos entre planetas, y genera pronósticos de tránsitos planetarios a futuro (1–12 meses).

## Stack

| Capa      | Tecnología                                      |
|-----------|-------------------------------------------------|
| Backend   | Python 3.11 · FastAPI · pyswisseph              |
| Frontend  | Next.js 14 · TypeScript · Tailwind · D3.js      |
| Deploy    | Docker Compose (local) · Vercel + Railway (prod)|

## Inicio rápido

```bash
# Requiere Docker y Docker Compose
docker-compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Sin Docker

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (otra terminal)
cd frontend && npm install && npm run dev
```

## Endpoints

| Método | Ruta          | Descripción                        |
|--------|---------------|------------------------------------|
| GET    | /health       | Health check                       |
| POST   | /api/chart    | Calcula carta natal completa       |
| POST   | /api/transits | Calcula tránsitos futuros (1-12 m) |

Ver `CLAUDE.md` para documentación completa del proyecto.

## Validación de precisión

Las posiciones planetarias se validan contra [astro.com](https://astro.com) con tolerancia ±0.05° (3 arcominutos).

Cartas de prueba:
- 15 May 1990 · 14:30 · Santiago, Chile
- 01 Ene 2000 · 00:00 · Londres
- 21 Jun 1985 · 08:15 · Ciudad de México
