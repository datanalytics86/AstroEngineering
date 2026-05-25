# AstroEngine Pro — Guía de Sesión para Claude Code

## DESCRIPCIÓN DEL PROYECTO

Aplicación web de ingeniería astrológica profesional que calcula cartas natales con precisión astronómica real (Swiss Ephemeris), detecta aspectos entre planetas, genera pronósticos de tránsitos planetarios a futuro (1-12 meses), calcula retornos solares y ofrece astrología mundial por país.

**Stack:**
- Backend: Python 3.11 + FastAPI + pyswisseph + slowapi
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS (SVG puro, sin D3)
- Deployment: Docker Compose (dev) → Vercel (frontend) + Render (backend)

---

## ESTADO ACTUAL DEL PROYECTO

> Última actualización: 2026-05-25 — Feature AstroTrading (señales LONG/SHORT)

### AstroTrading (actualizado — 2026-05-25 sesión tier-1)
- [x] `backend/astro/market_charts.py` — 8 cartas de inicio (NYSE, S&P500, NASDAQ, Dow, BTC, Oro, WTI, EURUSD)
- [x] `backend/astro/astrotrading.py` — motor consenso normalizado + doble horizonte + fase lunar
- [x] `backend/astro/models.py` — `TradingSignal.consensus`, `LunarInfo`, `signal_trend/short_term`, `exact_aspects_calendar`
- [x] `backend/main.py` — endpoint `POST /api/astrotrading` (rate limit 3/min)
- [x] `frontend/lib/types.ts` — `TradingSignal.consensus`, `LunarInfo`, `signal_trend/short_term`, `exact_aspects_calendar`
- [x] `frontend/lib/trading-interpretations.ts` — 25+ interpretaciones astro-financieras
- [x] `frontend/app/api/astrotrading/route.ts` — proxy Next.js (timeout 180s)
- [x] `frontend/components/SignalGauge.tsx` — input cambiado a `consensus` (−1..+1); ticks graduados; prop `size` sm/lg
- [x] `frontend/components/ForecastRibbon.tsx` — curva SVG área consenso (verde/rojo) 12 meses; hover tooltip (NUEVO)
- [x] `frontend/components/LunarPhase.tsx` — disco lunar SVG con terminador; badge posible giro; Mercurio Rx (NUEVO)
- [x] `frontend/components/CosmicWeatherStrip.tsx` — badges de alertas planetarias y volatilidad
- [x] `frontend/app/astrotrading/page.tsx` — hero doble lectura, lunar widget, ribbon, fechas clave, skeleton loading

**Notas técnicas (motor actualizado):**
- Consenso normalizado: `consensus = net/gross ∈ [-1,+1]`; `activity = 1−exp(−gross/5)`; NEUTRAL alcanzable con umbral ±0.15
- Ponderación por casa natal: casas 2/8 ×1.4 (dinero), 5/11 ×1.25 (especulación); filtro ruido score<2 / nature=="menor"
- Doble horizonte: `signal_trend` (planetas lentos, macro 12m) + `signal_short_term` (planetas rápidos, accionable hoy)
- Planetas rápidos: Sol/Luna/Mercurio/Venus/Marte vs carta de inicio; orbe estricto ≤3° (Luna ≤5°)
- Fase lunar: octantes (nueva/llena = posible giro), iluminación, Mercurio Rx; campo `lunar` en respuesta
- `exact_aspects_calendar` propagado desde transit_result al response final
- Disclaimer visible (banner + footer) en la página; no es asesoría financiera

---

> Sesión anterior: 2026-04-28 — Sesión de seguridad + nuevas features

### Core
- [x] CLAUDE.md creado y actualizado
- [x] Estructura de directorios creada
- [x] `docker-compose.yml`

### Backend
- [x] `main.py` — FastAPI app, CORS, routes, rate limiting, logging
- [x] `requirements.txt` — incluye slowapi 0.1.9
- [x] `Dockerfile` — non-root user (uid=1000), curl para healthcheck
- [x] `astro/models.py` — Pydantic v2 models con validación semántica
- [x] `astro/chart.py` — carta natal + `calculate_solar_return()` (binary search)
- [x] `astro/aspects.py` — detección y scoring de aspectos
- [x] `astro/houses.py` — casas Placidus (fallback: Whole Sign)
- [x] `astro/transits.py` — escaneo diario + refinamiento binario
- [x] `astro/mundane_charts.py` — **17 cartas nacionales** (Campion): USA, Chile, UK, EU, Alemania, Francia, China, Rusia, Argentina, México, Brasil, India, Japón, España, Ucrania, Israel
- [x] `astro/mundane.py` — calculate_mundane_response() + ingresos de signo

### Endpoints del backend
| Endpoint | Rate limit | Descripción |
|----------|-----------|-------------|
| `GET /health` | 10/min | Health check |
| `POST /api/chart` | 20/min | Carta natal |
| `POST /api/transits` | 5/min | Tránsitos 12 meses |
| `POST /api/solar-return` | 10/min | Retorno solar |
| `POST /api/mundane` | 3/min | Astrología mundial |

### Frontend — Páginas
- [x] `app/layout.tsx` — layout principal
- [x] `app/page.tsx` — landing + formulario + **panel de cartas guardadas**
- [x] `app/carta/[id]/page.tsx` — carta natal + botón "☉ Retorno Solar"
- [x] `app/transitos/[id]/page.tsx` — tránsitos + **panel ejecutivo lateral** + calendario de fechas exactas
- [x] `app/retorno/[id]/page.tsx` — **retorno solar** (tema ámbar) + **panel ejecutivo lateral**
- [x] `app/mundial/page.tsx` — astrología mundial + birueda + **panel ejecutivo lateral**
- [x] `app/not-found.tsx`, `app/error.tsx`

### Frontend — API proxies
- [x] `app/api/chart/route.ts`
- [x] `app/api/transits/route.ts`
- [x] `app/api/solar-return/route.ts` — timeout 60s
- [x] `app/api/mundane/route.ts` — timeout 180s

### Frontend — Componentes
- [x] `components/BirthDataForm.tsx` — con geocoding Nominatim + DST
- [x] `components/ChartWheel.tsx` — **reescrito en SVG puro** (sin D3), estilo astro.com
- [x] `components/AspectTable.tsx`
- [x] `components/PlanetPositions.tsx` — con **columna de dignidades** (⌂ ↑ ⊗ ↓)
- [x] `components/ForecastDashboard.tsx` — filtro por temática + vista cronología
- [x] `components/MonthDetailModal.tsx`
- [x] `components/TransitWheel.tsx`
- [x] `components/TransitZodiacWheel.tsx` — birueda zodiacal estilo astro.com
- [x] `components/YearSummaryPanel.tsx` — **panel ejecutivo 12 meses** (tránsitos personales y mundanos)
- [x] `components/SolarReturnSummaryPanel.tsx` — **panel ejecutivo retorno solar**

### Frontend — Librerías
- [x] `lib/types.ts` — interfaces TypeScript (incluye `SolarReturnRequest`)
- [x] `lib/storage.ts` — localStorage: `saveChart`, `loadChart`, `saveTransits`, `loadTransits`, `saveSolarReturn`, `loadSolarReturn`, `listCharts`, `deleteChart`
- [x] `lib/zodiac-utils.ts` — helpers + **`getPlanetDignity()`** + `DIGNITY_SYMBOL/COLOR`
- [x] `lib/interpretation-engine.ts` — ~270 interpretaciones de tránsitos
- [x] `lib/transit-summary.ts` — `generateTransitSummary()` (Sasportas/Forrest/Arroyo)
- [x] `lib/solar-return-summary.ts` — **`generateSolarReturnSummary()`** (Forrest/Tyl/Sasportas/Rodden)
- [x] `lib/mundane-interpretations.ts` — 20+ interpretaciones mundanas (Campion/Tarnas/Barbault)
- [x] `lib/wheel-geometry.ts` — helpers SVG: `polarXY`, `describeSector`, `makeToAngle`

### Documentación
- [x] `GAP_ANALYSIS_DEPLOY.md` — análisis completo de seguridad para deploy a producción

---

## ARQUITECTURA

```
AstroEngineering/
├── CLAUDE.md
├── README.md
├── GAP_ANALYSIS_DEPLOY.md          ← Seguridad + producción
├── docker-compose.yml
├── backend/
│   ├── main.py                     ← FastAPI + CORS + rate limiting + logging
│   ├── requirements.txt            ← incluye slowapi
│   ├── Dockerfile                  ← non-root user astro (uid=1000)
│   └── astro/
│       ├── models.py               ← Pydantic v2 + validación semántica de fechas
│       ├── chart.py                ← natal + solar return (binary search)
│       ├── aspects.py
│       ├── houses.py
│       ├── transits.py
│       ├── mundane_charts.py       ← 17 cartas nacionales (Campion)
│       └── mundane.py
└── frontend/
    ├── app/
    │   ├── page.tsx                ← landing + cartas guardadas
    │   ├── carta/[id]/page.tsx     ← carta natal + botón SR
    │   ├── transitos/[id]/page.tsx ← tránsitos + panel ejecutivo
    │   ├── retorno/[id]/page.tsx   ← retorno solar + panel ejecutivo
    │   ├── mundial/page.tsx        ← astrología mundial + panel ejecutivo
    │   └── api/
    │       ├── chart/route.ts
    │       ├── transits/route.ts
    │       ├── solar-return/route.ts
    │       └── mundane/route.ts
    ├── components/
    │   ├── ChartWheel.tsx          ← SVG puro, estilo astro.com
    │   ├── PlanetPositions.tsx     ← con columna de dignidades
    │   ├── YearSummaryPanel.tsx    ← panel ejecutivo tránsitos/mundano
    │   ├── SolarReturnSummaryPanel.tsx
    │   ├── TransitZodiacWheel.tsx
    │   └── ForecastDashboard.tsx   ← filtro + cronología
    └── lib/
        ├── zodiac-utils.ts         ← + getPlanetDignity()
        ├── storage.ts              ← + SR storage + listCharts/deleteChart
        ├── transit-summary.ts
        ├── solar-return-summary.ts ← nuevo
        └── wheel-geometry.ts
```

---

## CÓMO CORRER LOCALMENTE (GitHub Codespace)

```bash
# 1. Asegurarse de estar en la rama correcta
git checkout claude/document-setup-pB3Mr

# 2. Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000 --host 0.0.0.0
# → Hacer el puerto 8000 PUBLIC en la pestaña PORTS

# 3. Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# → Hacer el puerto 3000 PUBLIC en la pestaña PORTS

# 4. Terminal 3 — Configurar URL del backend
echo "NEXT_PUBLIC_API_URL=https://TU-CODESPACE-8000.app.github.dev" > frontend/.env.local

# 5. Reiniciar Terminal 2 (npm run dev) para cargar la variable
```

### Sin Docker (local puro)

```bash
cd backend && uvicorn main:app --reload --port 8000
cd frontend && npm run dev
# frontend/.env.local → NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## VARIABLES DE ENTORNO

### Desarrollo (frontend/.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Producción — Render (backend)
```bash
ENV=production
FRONTEND_URL=https://tu-app.vercel.app
EPHE_PATH=/usr/share/swisseph/ephe
```

### Producción — Vercel (frontend)
```bash
NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com
```

---

## DEPLOYMENT (gratuito)

| Componente | Plataforma | Costo |
|-----------|-----------|-------|
| Frontend | **Vercel** | Gratis siempre |
| Backend | **Render** | Gratis (cold start ~30s tras inactividad) |

**Pasos:**
1. Mergear `claude/document-setup-pB3Mr` → `main`
2. Render: New Web Service → repo → Root Dir: `backend` → Runtime: Docker → Free plan
3. Render: agregar env vars `ENV=production`, `FRONTEND_URL=https://tu-app.vercel.app`
4. Vercel: New Project → repo → Root Dir: `frontend` → Next.js
5. Vercel: agregar env var `NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com`

> ⚠️ Ver `GAP_ANALYSIS_DEPLOY.md` para lista completa de brechas de seguridad pendientes (Sprint 1 y 2).

---

## ENDPOINTS DEL BACKEND

### POST /api/chart — Carta natal
```json
// Request
{ "name": "Nicolás", "birth_date": "1990-05-15", "birth_time": "14:30",
  "latitude": -33.4489, "longitude": -70.6693, "timezone_offset": -4 }
// Response: planetas(12), casas(12), ascendente, MC, aspectos
```

### POST /api/transits — Tránsitos 12 meses
```json
// Request
{ "natal_planets": [...], "start_date": "2026-04-07", "end_date": "2027-04-07",
  "latitude": -33.4489, "longitude": -70.6693 }
// Límite: max 366 días entre start y end
// Response: current_transits, timeline mensual, exact_aspects_calendar
```

### POST /api/solar-return — Retorno solar
```json
// Request
{ "natal_sun_longitude": 54.62, "year": 2026,
  "latitude": -33.4489, "longitude": -70.6693, "timezone_offset": -4, "name": "Nicolás" }
// Response: ChartResponse + sr_year, sr_local_time, sr_ut_time
```

### POST /api/mundane — Astrología mundial
```json
// Request
{ "country": "chile", "start_date": "2026-04-01", "end_date": "2027-04-01" }
// Países: usa, chile, uk, eu, germany, france, china, russia,
//         argentina, mexico, brazil, india, japan, spain, ukraine, israel
// Límite: max 366 días
```

---

## NOTAS CRÍTICAS (NO OLVIDAR)

1. **Hora local → UT**: Siempre restar `timezone_offset` antes de `swe.julday()`.
2. **Efemérides**: Archivos `.se1` en `/usr/share/swisseph/ephe`. Sin ellos, usa Moshier (~0.1° de error, aceptable para MVP).
3. **Placidus en latitudes altas**: Falla para latitudes > 66°. Fallback a Whole Sign Houses en `houses.py`.
4. **Retrógrados en tránsitos**: Un planeta retrógrado puede formar el mismo aspecto 3 veces. `consolidate_transits()` en `transits.py` agrupa las pasadas.
5. **Orbes de tránsitos**: Más estrictos que natales. Ver `TRANSIT_ORBS` en `aspects.py`.
6. **ChartWheel sin D3**: Reescrito en SVG puro React. `makeToAngle(ascLon)` rotaciona la rueda con el ASC a la izquierda (9 o'clock).
7. **swe.jdut1_to_utc**: Devuelve 6 valores `(year, month, day, hour, minute, second)`, NO 4. Ya corregido en `chart.py`.
8. **Rate limiting**: `slowapi` con límites por IP. En desarrollo local no aplica (localhost).
9. **CORS en producción**: Requiere `FRONTEND_URL` como variable de entorno en Render. Sin ella, solo acepta localhost.
10. **Swagger docs**: Deshabilitados cuando `ENV=production`. En desarrollo siguen en `/docs`.

---

## VALIDACIÓN DE PRECISIÓN

Comparar contra [astro.com](https://astro.com) (tolerancia: ±0.05°):

| Test | Fecha | Hora | Lugar | UTC |
|------|-------|------|-------|-----|
| 1 | 15 May 1990 | 14:30 | Santiago, Chile (-33.45,-70.67) | UTC-4 |
| 2 | 01 Ene 2000 | 00:00 | Londres (51.51, -0.13) | UTC+0 |
| 3 | 21 Jun 1985 | 08:15 | Ciudad de México (19.43,-99.13) | UTC-6 |

---

## DISEÑO / UI

- **Paleta principal:** blanca/slate — fondo blanco, bordes `#E2E8F0`
- **Tipografía datos:** JetBrains Mono
- **Acento tránsitos:** azul (`#2563EB`)
- **Acento retorno solar:** ámbar (`#D97706`)
- **Acento mundial:** violeta/índigo
- **Elementos:** fuego `#DC2626` | tierra `#16A34A` | aire `#D97706` | agua `#2563EB`
- **Aspectos:** conjunción=slate | oposición=rojo | cuadratura=naranja | trígono=azul | sextil=verde
- **Dignidades:** domicilio=esmeralda ⌂ | exaltación=azul ↑ | detrimento=naranja ⊗ | caída=rojo ↓

---

## ChartWheel — Geometría SVG

```
R_ZODIAC_OUT = 268   ← borde exterior anillo zodiacal
R_ZODIAC_IN  = 218   ← borde interior anillo zodiacal
R_PLANET_OUT = 218   ← borde exterior anillo de planetas
R_PLANET_IN  = 168   ← borde interior anillo de planetas (fill #F8FAFC)
R_DOT        = 216   ← punto exacto del planeta en el zodíaco
R_GLYPH      = 196   ← símbolo del planeta
R_DEG_LABEL  = 177   ← etiqueta de grado
R_HOUSE_NUM  = 120   ← números de casas
R_ASPECT     = 88    ← líneas de aspectos
R_CENTER     = 22    ← círculo central
```

Colisiones: `resolveCollisions()` asigna `rOffset ±12` cuando dos planetas están a < 7° entre sí.

---

## Retorno Solar — Algoritmo

```python
# 1. Escaneo de 5 días para encontrar la ventana de cruce
# 2. Búsqueda binaria de 60 iteraciones hasta |diff| < 1e-7
# 3. swe.jdut1_to_utc(sr_jd, 1) → (year, month, day, hour, minute, second)
# 4. calculate_natal_chart(birth_data) con timezone_offset=0 (ya en UT)
```

---

## Panel Ejecutivo — Estructura

### YearSummaryPanel (tránsitos personales y mundanos)
Genera con `generateTransitSummary(transits, chart)` de `lib/transit-summary.ts`.
Secciones: year_theme · year_description · major_cycles (4) · quarters (4) · opportunities · challenges · integrating_advice

### SolarReturnSummaryPanel (retorno solar)
Genera con `generateSolarReturnSummary(srChart)` de `lib/solar-return-summary.ts`.
Secciones: year_theme · asc_interpretation · mc_interpretation · angular_planets · stelliums · key_aspects · element_distribution · opportunities · challenges · advice

---

## SCORING DE TRÁNSITOS

```
score = (peso_planeta_transitante + peso_planeta_natal) × peso_aspecto × factor_orbe / 10
factor_orbe = max(0, 1 - orb / 5)
Importancia: score >= 8 → "crítica" | >= 5 → "alta" | >= 3 → "media" | < 3 → "baja"
```

Pesos planetarios: Plutón=10, Neptuno=9, Urano=8, Saturno=7, Júpiter=6, Sol=5, Marte=4...
Pesos de aspectos: Conjunción=10, Oposición=9, Cuadratura=8, Trígono=7, Sextil=5...

---

## SEGURIDAD (Sprint 0 completado)

Ver `GAP_ANALYSIS_DEPLOY.md` para el análisis completo. Implementado:

| Fix | Descripción |
|-----|-------------|
| Rate limiting | slowapi: 20/min chart, 5/min transits, 10/min SR, 3/min mundane |
| Non-root Docker | Usuario `astro` uid=1000 en contenedor |
| CORS exacto | `FRONTEND_URL` env var reemplaza regex wildcard en producción |
| Error handling | Stack traces no se exponen al cliente; logging centralizado |
| Validación fechas | `date.fromisoformat()` valida semánticamente; rango 1800-2200 |
| Límite de rango | Tránsitos y mundane: máximo 366 días por request |
| Swagger oculto | `/docs` y `/redoc` deshabilitados cuando `ENV=production` |

**Pendiente (Sprint 1 y 2):** ver `GAP_ANALYSIS_DEPLOY.md` secciones Alto y Medio.


---

## ESTADO ACTUAL DEL PROYECTO

> Actualizar esta sección en cada sesión al terminar.

- [x] CLAUDE.md creado
- [x] Estructura de directorios creada
- [x] Backend: `main.py`, `requirements.txt`, `Dockerfile`
- [x] Backend: `astro/models.py` — Pydantic models
- [x] Backend: `astro/chart.py` — Cálculo de carta natal con Swiss Ephemeris
- [x] Backend: `astro/aspects.py` — Detección de aspectos
- [x] Backend: `astro/houses.py` — Sistema de casas Placidus
- [x] Backend: `astro/transits.py` — Tránsitos futuros con refinamiento binario
- [x] Frontend: `package.json` con dependencias
- [x] Frontend: `app/layout.tsx` — Layout principal
- [x] Frontend: `app/page.tsx` — Landing / formulario
- [x] Frontend: `app/carta/[id]/page.tsx` — Vista carta natal (ID dinámico, localStorage)
- [x] Frontend: `app/transitos/[id]/page.tsx` — Vista de tránsitos (ID dinámico, localStorage)
- [x] Frontend: `app/api/chart/route.ts` — Proxy al backend
- [x] Frontend: `app/api/transits/route.ts` — Proxy al backend
- [x] Frontend: `lib/types.ts` — TypeScript interfaces
- [x] Frontend: `lib/api-client.ts` — Fetch helpers
- [x] Frontend: `lib/zodiac-utils.ts` — Helpers de signos y grados
- [x] Frontend: `lib/interpretation-engine.ts` — ~270 interpretaciones
- [x] Frontend: `components/BirthDataForm.tsx`
- [x] Frontend: `components/ChartWheel.tsx` — Rueda zodiacal SVG con D3.js
- [x] Frontend: `components/AspectTable.tsx`
- [x] Frontend: `components/TransitTimeline.tsx` — Gantt de tránsitos
- [x] Frontend: `components/PlanetPositions.tsx`
- [x] Frontend: `components/ForecastDashboard.tsx`
- [x] Frontend: `components/InterpretationCard.tsx`
- [x] `docker-compose.yml`
- [x] Frontend: `lib/storage.ts` — Persistencia con localStorage + UUID (cartas bookmarkeables)
- [x] Frontend: `app/not-found.tsx` y `app/error.tsx`
- [x] Frontend: Geocoding de ciudad con Nominatim (autocompletado + coordenadas automáticas)
- [x] Frontend: Loading indicator durante cálculo de tránsitos
- [x] Frontend: Favicon SVG
- [x] Backend: Paso adaptativo por planeta (10x speedup en tránsitos)
- [x] Gap analysis: fixes C1-C5 (CORS, healthcheck, env var, midnight rollover), H1-H6 (arc, house#, MC/IC labels, applying field, minor aspect fallback, lon normalization), M2 (nav links), M4 (duplicate keys), H7/M1 (dead code removed), L2/L5 (deps limpiadas), M6 (package-lock.json generado)
- [x] QA/bugfix: 4 bugs corregidos (applying logic, DMS truncation, exact-date search range, null crash)
- [x] Rediseño UI: paleta blanca/azul minimalista, formulario mejorado con DatePicker/DST, vista tránsitos narrativa
- [x] Testing de precisión contra astro.com (3 cartas de prueba) — ✓ validado, error máximo ±1' (Moshier)
- [x] Frontend: `components/MonthDetailModal.tsx` — slide-in desde la derecha con detalle mensual
- [x] Frontend: `components/TransitWheel.tsx` — rueda radial SVG de tránsitos (12 meses × 5 planetas lentos)
- [x] Frontend: `components/TransitExecutiveSummaryModal.tsx` — resumen ejecutivo 12 meses
- [x] Frontend: `components/TransitZodiacWheel.tsx` — birueda zodiacal tradicional (tránsitos vs natal)
- [x] Frontend: `lib/wheel-geometry.ts` — helpers SVG compartidos (polarXY, describeSector, makeToAngle)
- [x] Frontend: `lib/transit-summary.ts` — generador de resumen ejecutivo (Sasportas/Forrest/Arroyo)
- [x] Frontend: `lib/mundane-interpretations.ts` — 20+ interpretaciones mundanas (Campion/Tarnas/Barbault)
- [x] Frontend: `app/mundial/page.tsx` — página de astrología mundial con birueda + pronóstico + cielo actual
- [x] Frontend: `app/api/mundane/route.ts` — proxy Next.js para /api/mundane
- [x] Backend: `astro/mundane_charts.py` — 8 cartas nacionales canónicas (Campion)
- [x] Backend: `astro/mundane.py` — calculate_mundane_response() + ingresos de signo
- [x] Backend: `POST /api/mundane` endpoint con modelos Pydantic
- [x] UI: Ciudad granular con addressdetails Nominatim (barrio · ciudad · estado · país)
- [x] UI: Birueda zodiacal en vista de tránsitos personales
- [x] UI: Navegación → /mundial desde página principal y vista de tránsitos
- [x] UI: TransitZodiacWheel rediseñada estilo astro.com — agujas radiales, etiquetas de grado, colisiones resueltas, 360 ticks, labels 10°/20°
- [x] UI: ForecastDashboard con filtro por temática (pills) + vista cronología vertical (cuando hay filtro activo)
- [x] UI: Página principal muestra "Cartas guardadas" (listCharts) con acceso directo, tránsitos y borrado

---

## ARQUITECTURA

```
AstroEngineering/
├── CLAUDE.md                       ← Este archivo
├── README.md
├── docker-compose.yml
├── backend/                        ← Python FastAPI + pyswisseph
│   ├── main.py                     ← FastAPI app, CORS, routes
│   ├── requirements.txt
│   ├── Dockerfile
│   └── astro/
│       ├── __init__.py
│       ├── models.py               ← Pydantic v2 models (input/output)
│       ├── chart.py                ← Carta natal: planetas, ascendente, MC
│       ├── aspects.py              ← Detección y scoring de aspectos
│       ├── houses.py               ← Casas Placidus (fallback: Whole Sign)
│       ├── transits.py             ← Escaneo diario + refinamiento binario
│       ├── mundane_charts.py       ← 8 cartas nacionales (Campion canonical)
│       └── mundane.py              ← Tránsitos sobre cartas nacionales + ingresos
└── frontend/                       ← Next.js 14 App Router + TypeScript
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── next.config.ts
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                ← Landing + BirthDataForm
    │   ├── carta/[id]/page.tsx     ← Carta natal completa
    │   ├── transitos/[id]/page.tsx ← Pronósticos de tránsitos
    │   └── api/
    │       ├── chart/route.ts      ← Proxy → backend /api/chart
    │       └── transits/route.ts   ← Proxy → backend /api/transits
    ├── components/
    │   ├── BirthDataForm.tsx
    │   ├── ChartWheel.tsx          ← SVG con D3.js, doble anillo
    │   ├── AspectTable.tsx
    │   ├── TransitTimeline.tsx     ← Gantt horizontal
    │   ├── PlanetPositions.tsx
    │   ├── ForecastDashboard.tsx
    │   └── InterpretationCard.tsx
    └── lib/
        ├── types.ts
        ├── api-client.ts
        ├── zodiac-utils.ts
        └── interpretation-engine.ts
```

---

## CÓMO CORRER LOCALMENTE

```bash
# Desde la raíz del proyecto
docker-compose up --build

# Backend disponible en: http://localhost:8000
# Frontend disponible en: http://localhost:3000
# Docs API (Swagger): http://localhost:8000/docs
```

### Sin Docker (desarrollo rápido)

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

---

## VARIABLES DE ENTORNO

```bash
# frontend/.env.local (desarrollo)
NEXT_PUBLIC_API_URL=http://localhost:8000

# frontend/.env.production (Vercel)
NEXT_PUBLIC_API_URL=https://tu-backend.railway.app
```

---

## ENDPOINTS DEL BACKEND

### POST /api/chart
Calcula carta natal completa.

**Request:**
```json
{
  "name": "Nicolás",
  "birth_date": "1990-05-15",
  "birth_time": "14:30",
  "latitude": -33.4489,
  "longitude": -70.6693,
  "timezone_offset": -4
}
```

**Response:** Planetas (12), casas (12), ascendente, MC, aspectos.

### POST /api/transits
Calcula tránsitos futuros de planetas lentos contra carta natal.

**Request:**
```json
{
  "natal_planets": [...],
  "start_date": "2026-04-07",
  "end_date": "2027-04-07",
  "latitude": -33.4489,
  "longitude": -70.6693
}
```

**Response:** `current_transits`, `timeline` mensual, `exact_aspects_calendar`.

---

## NOTAS CRÍTICAS (NO OLVIDAR)

1. **Hora local → UT**: Siempre restar el `timezone_offset` antes de llamar a `swe.julday()`.
2. **Efemérides Swiss Ephemeris**: Archivos `.se1` en `/usr/share/swisseph/ephe`. Sin ellos, usa Moshier (~0.1° de error, aceptable para MVP).
3. **Placidus en latitudes altas**: Falla para latitudes > 66°. Hay fallback a Whole Sign Houses en `houses.py`.
4. **Retrógrados en tránsitos**: Un planeta retrógrado puede formar el mismo aspecto 3 veces. La función `consolidate_transits()` en `transits.py` agrupa las pasadas por retrograde loop.
5. **Orbes de tránsitos**: Más estrictos que natales. Ver `TRANSIT_ORBS` en `aspects.py`.
6. **La rueda zodiacal**: El Ascendente siempre queda a la izquierda (posición 9 o'clock). La cúspide de casa 1 se usa como referencia de rotación en D3.js.

---

## VALIDACIÓN DE PRECISIÓN

Comparar estas cartas contra [astro.com](https://astro.com) (tolerancia: ±0.05°):

| Test | Fecha       | Hora  | Lugar                          | UTC   |
|------|-------------|-------|--------------------------------|-------|
| 1    | 15 May 1990 | 14:30 | Santiago, Chile (-33.45,-70.67)| UTC-4 |
| 2    | 01 Ene 2000 | 00:00 | Londres (51.51, -0.13)         | UTC+0 |
| 3    | 21 Jun 1985 | 08:15 | Ciudad de México (19.43,-99.13)| UTC-6 |

---

## DISEÑO / UI

- **Fondo:** `#0A0E1A` (negro azulado oscuro)
- **Tipografía datos:** JetBrains Mono
- **Tipografía títulos:** Playfair Display
- **Acento principal:** `#C9A84C` (dorado)
- **Gradientes cards:** azul-violeta sutil
- **Elementos fuego:** `#DC2626` | **tierra:** `#16A34A` | **aire:** `#EAB308` | **agua:** `#2563EB`
- **Aspectos armoniosos:** verde | **tensos:** rojo | **neutros:** azul

---

## DEPLOYMENT

- **Frontend:** Vercel → conectar repo GitHub, auto-deploy desde `main`
- **Backend:** Railway → conectar repo, seleccionar carpeta `backend/`, usa `Dockerfile`
- **Variable crítica en Vercel:** `NEXT_PUBLIC_API_URL=https://<tu-backend>.railway.app`

---

## SCORING DE TRÁNSITOS

```
score = (peso_planeta_transitante + peso_planeta_natal) × peso_aspecto × factor_orbe / 10
factor_orbe = max(0, 1 - orb / 5)

Importancia: score >= 8 → "crítica" | >= 5 → "alta" | >= 3 → "media" | < 3 → "baja"
```

Pesos planetarios: Plutón=10, Neptuno=9, Urano=8, Saturno=7, Júpiter=6, Sol=5, Marte=4...
Pesos de aspectos: Conjunción=10, Oposición=9, Cuadratura=8, Trígono=7, Sextil=5...

---

## MOTOR DE INTERPRETACIONES

Ubicación: `frontend/lib/interpretation-engine.ts`

~270 combinaciones: 6 planetas transitantes × 9 planetas/puntos natales × 5 aspectos mayores.

Estructura de cada interpretación:
```typescript
{
  key: "saturn_conjunct_sun",
  transit_planet: "Saturno",
  natal_planet: "Sol",
  aspect: "Conjunción",
  title: "Saturno conjunción Sol natal",
  summary: "...",
  detailed: "...",
  life_areas: ["carrera", "identidad"],
  nature: "desafiante",
  advice: "...",
  duration_note: "Efecto gradual, ~2 semanas antes del exacto"
}
```
