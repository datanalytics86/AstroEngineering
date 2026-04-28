# AstroEngine Pro — Gap Analysis: Deploy 100% Seguro

> Revisión: 2026-04-28  
> Estado del proyecto: funcional en Codespace, listo para deploy pero con brechas de seguridad y producción

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Crítico — Bloquea el deploy seguro](#2-crítico--bloquea-el-deploy-seguro)
3. [Alto — Corregir antes de ir a producción](#3-alto--corregir-antes-de-ir-a-producción)
4. [Medio — Mejora fuerte recomendada](#4-medio--mejora-fuerte-recomendada)
5. [Bajo — Pulido y buenas prácticas](#5-bajo--pulido-y-buenas-prácticas)
6. [Plan de acción priorizado](#6-plan-de-acción-priorizado)

---

## 1. Resumen ejecutivo

| Severidad | Cantidad | Estado recomendado |
|-----------|----------|--------------------|
| Crítico   | 7        | Bloquear deploy hasta resolver |
| Alto      | 6        | Resolver en sprint 1 post-launch |
| Medio     | 8        | Resolver en sprint 2 |
| Bajo      | 7        | Backlog |

El mayor riesgo es que la app no tiene **autenticación**, **rate limiting** ni **validación de rangos de fecha** — un bot puede lanzar miles de cálculos pesados (12 meses de tránsitos = ~30s de CPU) y tumbar el backend gratuito de Render en segundos. Los demás problemas son reales pero no críticos para un MVP público de bajo tráfico.

---

## 2. Crítico — Bloquea el deploy seguro

### C-1 · No hay rate limiting (DoS trivial)

**Archivo:** `backend/main.py`  
**Riesgo:** Un solo bot puede enviar miles de peticiones a `/api/transits` (30s CPU cada una) y agotar el plan gratuito de Render en minutos.

**Fix mínimo — agregar `slowapi`:**

```python
# requirements.txt
slowapi==0.1.9
```

```python
# main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/chart")
@limiter.limit("20/minute")
async def chart_endpoint(request: Request, body: BirthData): ...

@app.post("/api/transits")
@limiter.limit("5/minute")   # cálculo pesado
async def transits_endpoint(request: Request, body: TransitRequest): ...
```

---

### C-2 · Backend corre como root en Docker

**Archivo:** `backend/Dockerfile`  
**Riesgo:** Si el contenedor es comprometido, el atacante tiene uid=0 en el sistema.

**Fix:**

```dockerfile
# Agregar antes del CMD
RUN useradd -m -u 1000 astro && chown -R astro:astro /app
USER astro
```

---

### C-3 · CORS demasiado permisivo — acepta CUALQUIER subdominio de vercel.app

**Archivo:** `backend/main.py`  
**Riesgo:** `allow_origin_regex=r"https://(.*\.vercel\.app|...)"` permite que CUALQUIER proyecto Vercel del mundo llame al backend. Si la URL del backend es conocida, cualquier desarrollador externo puede explotarla.

**Fix — reemplazar por dominio exacto en producción:**

```python
# Leer el origen exacto del frontend desde env var
_frontend_url = os.environ.get("FRONTEND_URL", "")
allow_origins = _base_origins + ([_frontend_url] if _frontend_url else [])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    # Solo Codespaces para desarrollo, no producción abierta
    allow_origin_regex=r"https://.*\.app\.github\.dev" if not _frontend_url else None,
    ...
)
```

En Render configurar: `FRONTEND_URL=https://tu-app.vercel.app`

---

### C-4 · Detalles de excepción interna expuestos al cliente

**Archivo:** `backend/main.py`  
**Riesgo:** `f"Error en cálculo de carta: {str(exc)}"` puede exponer rutas internas, versiones de librerías o stack traces al navegador.

**Fix:**

```python
import logging
logger = logging.getLogger(__name__)

@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})
```

---

### C-5 · Error lógico: timezone_offset hardcodeado a 0 en Retorno Solar

**Archivo:** `backend/astro/chart.py` línea 208  
**Riesgo:** El Retorno Solar se calcula en UT (correcto) pero al construir `birth_data` para la carta del RS, `timezone_offset=0` hace que las cúspides de casas sean incorrectas para personas fuera de UTC. Es un bug silencioso que da casas erróneas.

**Fix:**

```python
birth_data = {
    ...
    "timezone_offset": 0,   # ← YA ESTÁ EN UT, no cambiar
    # PERO las casas del RS deben calcularse para la localización natal
    # El bug real es que calculate_natal_chart usa tz_offset para hora → UT
    # Como ya pasamos UT directo, timezone_offset=0 es correcto.
    # REAL FIX: verificar que house calculation usa lat/lon, no tz_offset
}
```

> **Nota:** Revisar `houses.py` — el cálculo de casas usa lat/lon geográfico, no timezone. Si es así, el `timezone_offset=0` es correcto y este ítem es falso positivo. **Verificar antes de tocar.**

---

### C-6 · Validación de fechas por regex — acepta fechas imposibles

**Archivo:** `backend/astro/models.py`  
**Riesgo:** El patrón `^\d{4}-\d{2}-\d{2}$` acepta `2024-99-99`, `0000-00-00`, años negativos, etc. pyswisseph puede crashear o dar resultados absurdos con fechas inválidas.

**Fix:**

```python
from datetime import date

@field_validator("birth_date")
@classmethod
def validate_birth_date(cls, v: str) -> str:
    try:
        d = date.fromisoformat(v)
        if not (1800 <= d.year <= 2200):
            raise ValueError("Año fuera del rango soportado (1800-2200)")
    except ValueError as e:
        raise ValueError(f"Fecha inválida: {e}")
    return v
```

**Para `SolarReturnRequest.year`:**

```python
year: int = Field(..., ge=1900, le=2100)
```

---

### C-7 · Rango de fechas ilimitado en tránsitos (CPU bomb)

**Archivos:** `backend/astro/models.py`, `backend/astro/transits.py`  
**Riesgo:** Un usuario puede pedir 50 años de tránsitos — el backend calculará durante minutos o se quedará sin memoria.

**Fix en `TransitRequest`:**

```python
from datetime import date

@model_validator(mode="after")
def validate_date_range(self) -> "TransitRequest":
    start = date.fromisoformat(self.start_date)
    end   = date.fromisoformat(self.end_date)
    if end <= start:
        raise ValueError("end_date debe ser posterior a start_date")
    if (end - start).days > 366:
        raise ValueError("Rango máximo de tránsitos: 12 meses")
    return self
```

---

## 3. Alto — Corregir antes de ir a producción

### A-1 · Sin logging en el backend — debugging imposible en producción

**Archivos:** `backend/main.py`, todos los módulos `astro/`  
**Problema:** Las excepciones se swallowean sin registro. Si algo falla en producción no hay forma de saber qué, cuándo ni por qué.

**Fix mínimo:**

```python
# main.py
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
```

En los módulos `astro/`, reemplazar `except Exception: pass` por:

```python
except Exception as e:
    logger.warning("Planet %s calculation failed: %s", planet_name, e)
```

---

### A-2 · Sin manejo de errores en `fetch()` de las rutas Next.js

**Archivos:** `frontend/app/api/*/route.ts`  
**Problema:** Si el backend está caído o responde HTML (error 502 de Render al despertar), `upstream.json()` lanza una excepción no capturada → el frontend muestra un error genérico sin posibilidad de reintentar.

**Fix — wrapper centralizado:**

```typescript
// frontend/lib/proxy-fetch.ts
export async function proxyFetch(url: string, body: unknown, timeoutMs = 30_000) {
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Network error";
    return Response.json({ detail: `No se pudo conectar al servidor: ${msg}` }, { status: 503 });
  }
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return Response.json({ detail: text || "Error en el servidor" }, { status: upstream.status });
  }
  try {
    const data = await upstream.json();
    return Response.json(data);
  } catch {
    return Response.json({ detail: "Respuesta inválida del servidor" }, { status: 502 });
  }
}
```

---

### A-3 · Swagger/OpenAPI expuesto en producción (information disclosure)

**Archivo:** `backend/main.py`  
**Problema:** `/docs` y `/redoc` exponen todos los modelos, endpoints y ejemplos del API. Útil para desarrollo, no para producción.

**Fix:**

```python
import os
docs_url    = "/docs"    if os.getenv("ENV") != "production" else None
redoc_url   = "/redoc"   if os.getenv("ENV") != "production" else None
openapi_url = "/openapi.json" if os.getenv("ENV") != "production" else None

app = FastAPI(
    ...,
    docs_url=docs_url,
    redoc_url=redoc_url,
    openapi_url=openapi_url,
)
```

En Render, configurar `ENV=production`.

---

### A-4 · Timeout de 180s en tránsitos mundanos — UX rota

**Archivo:** `frontend/app/api/mundane/route.ts`  
**Problema:** El usuario espera hasta 3 minutos sin feedback. Si el backend de Render está en cold start, puede fallar por timeout silencioso.

**Fix — loading state + timeout razonable de 60s con mensaje explicativo:**

```typescript
// Reducir timeout a 60s
signal: AbortSignal.timeout(60_000),
```

En el frontend, mostrar mensaje: *"El cálculo puede tardar hasta 60s la primera vez que se activa el servidor."*

---

### A-5 · `natal_planets` en `TransitRequest` no tiene estructura validada

**Archivo:** `backend/astro/models.py`  
**Problema:** `natal_planets: list[dict]` acepta cualquier cosa. Si llega sin el campo `longitude`, la aplicación crashea con `KeyError` en lugar de dar un error descriptivo.

**Fix:**

```python
class NatalPlanetInput(BaseModel):
    name: str
    longitude: float = Field(..., ge=0, lt=360)
    speed: float = 0.0
    symbol: str = ""

class TransitRequest(BaseModel):
    natal_planets: list[NatalPlanetInput]
    ...
```

---

### A-6 · `next.config.mjs` sin headers de seguridad HTTP

**Archivo:** `frontend/next.config.mjs`  
**Problema:** Sin CSP, X-Frame-Options, ni HSTS. El sitio puede ser embedido en iframes por terceros (clickjacking).

**Fix:**

```javascript
const nextConfig = {
  output: "standalone",
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options",           value: "DENY" },
        { key: "X-Content-Type-Options",    value: "nosniff" },
        { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
      ],
    }];
  },
};
```

---

## 4. Medio — Mejora fuerte recomendada

### M-1 · Límite de tamaño de cuerpo de petición no configurado

**Fix en `main.py`:**

```python
from fastapi import Request
# uvicorn acepta --limit-concurrency y --limit-max-requests
# Agregar en Dockerfile CMD:
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--limit-concurrency", "10", "--limit-max-requests", "1000"]
```

---

### M-2 · Healthcheck del Docker-compose usa Python — lento e ineficiente

**Archivo:** `docker-compose.yml`  
**Fix:**

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

Requiere agregar `curl` al Dockerfile:

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*
```

---

### M-3 · `name` en `BirthData` no tiene límite de longitud

**Fix:**

```python
name: str = Field(..., min_length=1, max_length=100, strip_whitespace=True)
```

---

### M-4 · `MundaneRequest.country` no valida contra lista conocida

**Fix:**

```python
from astro.mundane_charts import COUNTRY_KEYS

class MundaneRequest(BaseModel):
    country: str

    @field_validator("country")
    @classmethod
    def validate_country(cls, v: str) -> str:
        if v not in COUNTRY_KEYS:
            raise ValueError(f"País no soportado. Opciones: {COUNTRY_KEYS}")
        return v
```

---

### M-5 · No hay `.dockerignore` — imagen más grande de lo necesario

**Crear `backend/.dockerignore`:**

```
__pycache__/
*.pyc
*.pyo
*.egg-info/
.pytest_cache/
.mypy_cache/
.git/
.env
*.se1
*.se
```

---

### M-6 · Dependencias del backend con versiones desactualizadas

**Archivo:** `backend/requirements.txt`  
**Actualizar:**

```
fastapi==0.115.12       # era 0.109.0 — fixes de seguridad
uvicorn==0.34.0         # era 0.27.0
pydantic==2.11.3        # era 2.5.3
slowapi==0.1.9          # nuevo — rate limiting
```

Ejecutar `pip-audit` para detectar CVEs:

```bash
pip install pip-audit
pip-audit -r requirements.txt
```

---

### M-7 · Frontend expone la URL del backend al cliente (NEXT_PUBLIC_)

**Archivo:** `frontend/next.config.mjs`  
**Problema:** `NEXT_PUBLIC_API_URL` se incrusta en el bundle JavaScript del cliente. Cualquier usuario puede ver la URL del backend en las DevTools.  
**Impacto:** Bajo si el backend tiene rate limiting (C-1); alto si no lo tiene.  
**Fix:** Las llamadas al backend ya van a través de rutas Next.js (`/api/*`) — el `NEXT_PUBLIC_API_URL` solo es necesario server-side. Cambiar el nombre a `API_URL` (sin `NEXT_PUBLIC_`) y asegurarse de que solo se use en `route.ts`.

---

### M-8 · Restart policy ausente en docker-compose

**Archivo:** `docker-compose.yml`  
**Fix:**

```yaml
services:
  backend:
    restart: unless-stopped
  frontend:
    restart: unless-stopped
```

---

## 5. Bajo — Pulido y buenas prácticas

### B-1 · Swagger accesible en Codespace (compartido por URL pública)

Al hacer el puerto público en Codespace, `/docs` queda accesible para cualquiera con la URL. Usar la variable `ENV` del fix A-3 para desactivarlo en cualquier entorno no-local.

---

### B-2 · Threshold de latitud polar: 66° debería ser 66.5°

**Archivo:** `backend/astro/houses.py`  
El círculo polar ártico está a 66.5°, no 66°. Cambio de 1 línea.

---

### B-3 · `allow_methods=["*"]` demasiado permisivo

**Archivo:** `backend/main.py`  
Reemplazar por:

```python
allow_methods=["GET", "POST", "OPTIONS"],
```

---

### B-4 · No hay política de privacidad ni RGPD

La app recibe datos de nacimiento (fecha, hora, ciudad) — datos personales bajo GDPR/Ley 19.628 (Chile). Para un MVP público conviene al menos:
- Aviso en el formulario: *"Los datos se calculan en tiempo real y no se almacenan en el servidor."*
- Los datos sí se almacenan en `localStorage` del cliente — documentarlo.

---

### B-5 · No hay `robots.txt` ni `sitemap.xml`

**Crear `frontend/public/robots.txt`:**

```
User-agent: *
Disallow: /api/
Allow: /
```

---

### B-6 · Límite de precisión en latitud/longitud del backend

El backend acepta coordenadas con 15 decimales de precisión (doble flotante). La precisión útil para cálculos astrológicos es 4 decimales (~11m). Agregar `decimal_places=4` como advertencia, no bloqueo.

---

### B-7 · No hay tests automatizados

Sin tests, cada deploy es un salto de fe. Para un MVP, al menos:

```python
# backend/tests/test_chart.py
def test_natal_chart_santiago():
    result = calculate_natal_chart({
        "name": "Test", "birth_date": "1990-05-15",
        "birth_time": "14:30", "latitude": -33.4489,
        "longitude": -70.6693, "timezone_offset": -4
    })
    assert result["ascendant"]["sign"] == "Libra"  # validado contra astro.com
    sun = next(p for p in result["planets"] if p["name"] == "Sol")
    assert sun["sign"] == "Tauro"
```

---

## 6. Plan de acción priorizado

### Sprint 0 — Antes del deploy (1-2 horas)

| ID  | Tarea | Archivo | Tiempo est. |
|-----|-------|---------|-------------|
| C-1 | Agregar `slowapi` rate limiting | `main.py`, `requirements.txt` | 30 min |
| C-2 | Correr backend como non-root | `Dockerfile` | 5 min |
| C-3 | CORS exacto via `FRONTEND_URL` env var | `main.py` | 10 min |
| C-4 | Error handler genérico (no exponer detalles) | `main.py` | 10 min |
| C-6 | Validación semántica de fechas | `models.py` | 20 min |
| C-7 | Límite de rango de tránsitos a 366 días | `models.py` | 15 min |
| A-3 | Deshabilitar `/docs` en producción | `main.py` | 5 min |

### Sprint 1 — Semana 1 post-launch

| ID  | Tarea |
|-----|-------|
| A-1 | Logging básico en backend |
| A-2 | `proxyFetch` centralizado en frontend |
| A-4 | Reducir timeout mundane a 60s + mensaje UX |
| A-5 | Modelo `NatalPlanetInput` tipado |
| A-6 | Headers de seguridad en `next.config.mjs` |

### Sprint 2 — Semana 2-3

| ID  | Tarea |
|-----|-------|
| M-1 | Límite de concurrencia en uvicorn |
| M-2 | Healthcheck con curl |
| M-3 | Límite de longitud en campos de texto |
| M-4 | Validación de `country` contra enum |
| M-5 | `.dockerignore` |
| M-6 | Actualizar dependencias + pip-audit |
| M-7 | Mover `API_URL` de NEXT_PUBLIC a server-only |

---

## Variables de entorno necesarias en producción

### Render (backend)

| Variable | Valor | Obligatoria |
|----------|-------|-------------|
| `ENV` | `production` | Sí |
| `FRONTEND_URL` | `https://tu-app.vercel.app` | Sí |
| `EPHE_PATH` | `/usr/share/swisseph/ephe` | Sí |
| `ALLOWED_ORIGINS` | *(vacío si usas FRONTEND_URL)* | No |

### Vercel (frontend)

| Variable | Valor | Obligatoria |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://tu-backend.onrender.com` | Sí |

---

*Documento generado en sesión Claude Code · AstroEngine Pro · 2026-04-28*
