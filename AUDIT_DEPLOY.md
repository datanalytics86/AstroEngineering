# Audit: ¿Qué falta para deploy 100%?

> Auditoría: 2026-04-28 · Post Sprint 0
> Estado: **Sprint 0 implementado pero con 2 bugs runtime que bloquean producción**

---

## Resumen

| Categoría | Issues | Bloquea deploy |
|-----------|--------|----------------|
| Bugs runtime introducidos en Sprint 0 | 2 | **Sí** |
| Configuración de deploy faltante | 4 | Sí (manual) |
| Documentación desactualizada | 3 | No (cosmético) |
| Features pendientes (Sprint 1) | 5 | No |

---

## 🔴 Bugs runtime introducidos en Sprint 0 (críticos)

### B-1 · Exception handlers devuelven `dict` en lugar de `Response`

**Archivo:** `backend/main.py` líneas 35 y 70

**Código problemático:**
```python
app.add_exception_handler(RateLimitExceeded, lambda r, e: {"detail": "Demasiadas peticiones. Espera un momento."})

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return {"detail": "Error interno del servidor"}
```

**Problema:** FastAPI requiere que los exception handlers devuelvan un `Response` (o subclase). Devolver un `dict` causa `TypeError` en runtime cuando se dispara la excepción. **Esto significa que cuando alguien excede el rate limit, el servidor crashea en lugar de devolver 429.**

**Fix:**
```python
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})
```

---

### B-2 · `MundaneRequest.country` no valida — crashea con 500 en lugar de 400

**Archivo:** `backend/astro/models.py`

**Problema:** Si alguien envía `{"country": "narnia"}`, el backend devuelve 500 Internal Server Error en lugar de 400 con un mensaje claro. El gap analysis lo marcaba como M-4 pero no se implementó.

**Fix:**
```python
from astro.mundane_charts import COUNTRY_KEYS

class MundaneRequest(BaseModel):
    country: str

    @field_validator("country")
    @classmethod
    def validate_country(cls, v: str) -> str:
        if v not in COUNTRY_KEYS:
            raise ValueError(f"País no soportado: {v}")
        return v
    ...
```

---

## 🟡 Configuración de deploy faltante

### D-1 · `next.config.mjs` cae a `localhost` si falta `NEXT_PUBLIC_API_URL`

**Archivo:** `frontend/next.config.mjs`

```javascript
NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
```

Si por error olvidas configurar la env var en Vercel, el bundle de producción saldrá apuntando a `localhost:8000` y la app fallará silenciosamente para los usuarios. Debe **fallar el build** en producción si la variable falta.

**Fix:**
```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (process.env.NODE_ENV === "production" && !API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL es obligatoria en producción");
}
const nextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_API_URL: API_URL ?? "http://localhost:8000",
  },
};
```

---

### D-2 · `docker-compose.yml` rompe con el non-root user

**Archivo:** `docker-compose.yml` líneas 8-9

```yaml
volumes:
  - ./backend:/app
  - swisseph-data:/usr/share/swisseph/ephe
```

El bind mount `./backend:/app` sobrescribe el directorio que `chown astro:astro` configuró en el Dockerfile. Cuando el contenedor arranca como `USER astro`, no tiene permisos en el bind mount → uvicorn falla.

**Fixes posibles:**
1. Quitar el bind mount en producción (solo usar para desarrollo)
2. Usar `user: "1000:1000"` en docker-compose
3. O documentar que docker-compose es solo dev (y no se usa en producción)

```yaml
backend:
  build: ./backend
  user: "1000:1000"
  ports:
    - "8000:8000"
  volumes:
    - ./backend:/app
    - swisseph-data:/usr/share/swisseph/ephe
  environment:
    - EPHE_PATH=/usr/share/swisseph/ephe
    - ENV=development
```

---

### D-3 · Falta `render.yaml` para deploy automatizado

Sin `render.yaml`, hay que configurar todo manualmente en el dashboard de Render. Para que el deploy sea reproducible:

**Crear `render.yaml`:**
```yaml
services:
  - type: web
    name: astroengine-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    plan: free
    healthCheckPath: /health
    envVars:
      - key: ENV
        value: production
      - key: EPHE_PATH
        value: /usr/share/swisseph/ephe
      - key: FRONTEND_URL
        sync: false  # se configura manualmente en dashboard
```

---

### D-4 · `docker-compose.yml` no incluye env vars de producción

El docker-compose actual no tiene `ENV`, `FRONTEND_URL`, ni configuración para que Vercel/Render use los mismos defaults. No es bloqueante para deploy, solo para testing local de configuración de prod.

---

## 🟢 Documentación desactualizada (no bloquea pero confunde)

### Doc-1 · `README.md` apunta a Railway y D3.js

```
| Frontend  | Next.js 14 · TypeScript · Tailwind · D3.js      |   ← D3 fue removido
| Deploy    | Docker Compose (local) · Vercel + Railway (prod)|   ← Cambió a Render
```

Y solo lista 2 endpoints:
```
| GET    | /health       |
| POST   | /api/chart    |
| POST   | /api/transits |
```

Faltan `solar-return` y `mundane`.

---

### Doc-2 · `.env.local` con valor de localhost

`frontend/.env.local` tiene `NEXT_PUBLIC_API_URL=http://localhost:8000`. Está gitignored así que no se pushea, pero conviene documentar en el README cuál es el valor para cada entorno.

---

### Doc-3 · No hay `.env.example` ni `.env.production.example`

Buenas prácticas: incluir archivos de ejemplo gitignored para que cualquiera que clone sepa qué variables configurar.

---

## 🔵 Pendientes del GAP_ANALYSIS_DEPLOY.md (Sprint 1+)

Estos NO bloquean deploy pero deberían hacerse en las primeras 2 semanas post-launch:

- A-2: `proxyFetch` centralizado en frontend (manejo de errores en `fetch()`)
- A-4: Reducir timeout de mundane a 60s con UX feedback
- A-5: Modelo `NatalPlanetInput` tipado (en lugar de `list[dict]`)
- A-6: Headers de seguridad HTTP en `next.config.mjs` (CSP, X-Frame, HSTS)
- M-1: `--limit-concurrency` en uvicorn
- M-2: Healthcheck con `curl` (instalando curl en Dockerfile)
- M-5: `.dockerignore`
- M-6: Actualizar dependencias + `pip-audit`

---

## Plan de acción para llegar al 100%

### Pre-deploy (obligatorio · ~30 min)

| # | Acción | Archivo | Tiempo |
|---|--------|---------|--------|
| 1 | Fix B-1: handlers devuelven `JSONResponse` | `backend/main.py` | 5 min |
| 2 | Fix B-2: validación de `country` | `backend/astro/models.py` | 10 min |
| 3 | Fix D-1: `next.config.mjs` falla si falta env var | `frontend/next.config.mjs` | 5 min |
| 4 | Crear `render.yaml` | raíz | 5 min |
| 5 | Actualizar `README.md` | raíz | 5 min |

### Deploy (manual · ~20 min)

1. Mergear `claude/document-setup-pB3Mr` → `main`
2. Render: New Web Service → conectar repo → autoselect `render.yaml`
3. Render: configurar `FRONTEND_URL` con la URL que dará Vercel después
4. Vercel: New Project → Root Dir `frontend` → Next.js
5. Vercel: env var `NEXT_PUBLIC_API_URL` = URL de Render
6. Test: abrir Vercel URL, calcular carta, verificar que llega al backend

### Post-deploy (Sprint 1 · ~3 horas)

Implementar items A-2 a A-6 del `GAP_ANALYSIS_DEPLOY.md`.

---

## Comando para validar Sprint 0 con prueba real

Cuando los bugs B-1 y B-2 estén arreglados:

```bash
# En Codespace, con backend corriendo:
# Test rate limiting (debe devolver 429 al sexto intento)
for i in {1..6}; do curl -X POST http://localhost:8000/api/transits \
  -H "Content-Type: application/json" \
  -d '{"natal_planets":[],"start_date":"2026-01-01","end_date":"2026-12-31","latitude":0,"longitude":0}' \
  -w "%{http_code}\n" -o /dev/null -s; done

# Test validación de fechas
curl -X POST http://localhost:8000/api/chart \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","birth_date":"2024-99-99","birth_time":"14:30","latitude":0,"longitude":0,"timezone_offset":0}'
# Debe devolver 422 con error claro

# Test país inválido
curl -X POST http://localhost:8000/api/mundane \
  -H "Content-Type: application/json" \
  -d '{"country":"narnia","start_date":"2026-01-01","end_date":"2026-12-31"}'
# Debe devolver 422 con error de país
```
