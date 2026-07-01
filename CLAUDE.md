# AstroEngine Pro — Guía de Sesión para Claude Code

## DESCRIPCIÓN DEL PROYECTO

Aplicación web de ingeniería astrológica profesional que calcula cartas natales con precisión astronómica real (Swiss Ephemeris), detecta aspectos entre planetas, genera pronósticos de tránsitos planetarios (año actual por mes y próximos 4 años) y calcula retornos solares.

**Stack:**
- Backend: Python 3.11 + FastAPI + pyswisseph + slowapi
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS (SVG puro, sin D3)
- Deployment: Docker Compose (dev) → Vercel (frontend) + Render (backend, vía `render.yaml`)

---

## ESTADO ACTUAL DEL PROYECTO

> 2026-07-01 (b) — Panel de lectura narrativa en Geopolítica. Nuevo `lib/mundane-interpretation.ts` (`generateMundaneReading`) genera una interpretación fluida bilingüe (varios párrafos) al estilo de una lectura mundialista: nombra planetas, grados, signo y fecha, el eco histórico (análogos + Cassanya/Barbault/Tarnas) y un hook de placements — en modo natal lista los planetas natales tocados; en modo mundial sugiere grados/signos de la misma cruz de modalidad. Se muestra **a la derecha de la rueda** (`app/geopolitica/page.tsx`, grid wheel+lectura, sticky). Framing analógico con recordatorio de disclaimer (sin afirmar hechos concretos). i18n `geo.reading.title`. `npm run build` pasa.

> 2026-07-01 — Módulo de Análisis Geopolítico (astrología mundial). Nueva ruta standalone `app/geopolitica/page.tsx` con **dos modos** (botones): **Análisis mundial** (independiente) e **Impacto en mi carta natal** (elige carta guardada). Backend: `astro/mundane.py` computa configuraciones reales de planetas lentos 2026-2027 (aspectos + ingresos de signo, con refinamiento binario), un corpus curado de ~16 eventos históricos (Constantinopla 1453, revoluciones, guerras, etc.) cuyo **cielo se computa en vivo** vía Swiss Ephemeris/Moshier, matching analógico por firma, síntesis temática e impactos natales. Endpoint `POST /api/mundane`. Frontend: `components/MundaneWheel.tsx` (rueda SVG de cielo con aspecto definitorio resaltado + anillo natal opcional), `lib/mundane-corpus.ts` (narrativa + bibliografía bilingüe con generador de respaldo). Framing **analógico con disclaimer** — interpretación, no predicción factual. Bibliografía: Cassanya (Crónica Astrológica del Siglo XX), Barbault (índice cíclico), Tarnas (Cosmos and Psyche). Verificado: conjunción Saturno–Neptuno detectada el 2026-02-20; ambos modos del endpoint 200 OK; `npm run build` pasa. i18n ES/EN completo (`geo.*`). NOTA: reintroduce astrología "mundial" (eliminada el 2026-06-17) pero con enfoque histórico-analógico distinto y ruta propia `/geopolitica`.

> 2026-06-23 — Portada + nuevas rutas + glosario. `app/page.tsx` es ahora una portada de bienvenida (intro "¿qué es una carta natal?", tarjetas de planetas, botones "Realizar carta natal" → `/nueva` y "Aprende los significados" → `/glosario`). El formulario BirthDataForm y el panel "Cartas guardadas" se movieron a `app/nueva/page.tsx`. Se añadió `app/glosario/page.tsx` con glosario completo (aspectos, retrogradación, dignidades, planetas, ángulos, orbes). Navegación global con botones "Inicio / Nueva carta" (componentes `PageNav`, `NavHeader`). `storage.ts` usa caché v2 por año. Interpretaciones mensuales enriquecidas. i18n ES/EN completo para interfaz + corpus de tránsitos/retorno solar; interpretaciones natales (click en rueda) pendientes. Ver `GAP_ANALYSIS_DEPLOY.md` y `AUDIT_DEPLOY.md` para seguridad.

> 2026-06-21 — i18n bilingual completado (ES/EN). Corpus de tránsitos/retorno solar 100% bilingüe. `generateMonthBrief` y `generateYearBrief` reciben `lang`. Rueda mes/año chips y fechas clave usan locale dinámico. Mensajes de error usan `t()`. InterpretationModal: UI chrome 100% bilingüe. `transits.corpus_note` vaciado en EN.

> 2026-06-17 — Rediseño de tránsitos + eliminación de astrología mundial. Vista de tránsitos reemplazada por: selector de año (actual + 4), filtro por mes en el año actual con rueda interactiva (planetas como esferas 3D; retrógrados con anillo rojo + ℞ + ↺) y resumen breve; años futuros con análisis anual. Backend: `sky` por mes + `transit_retrograde`. Eliminada toda la feature mundial.

### Core
- [x] CLAUDE.md creado y actualizado
- [x] Estructura de directorios creada
- [x] `docker-compose.yml`
- [x] `render.yaml` (raíz del repo) — configuración Render para deploy del backend

### Backend
- [x] `main.py` — FastAPI app, CORS, routes, rate limiting, logging
- [x] `requirements.txt` — incluye slowapi 0.1.9
- [x] `Dockerfile` — non-root user (uid=1000), curl para healthcheck
- [x] `astro/models.py` — Pydantic v2 models con validación semántica + `SkyPlanet` + `transit_retrograde`
- [x] `astro/chart.py` — carta natal + `calculate_solar_return()` (binary search)
- [x] `astro/aspects.py` — detección y scoring de aspectos
- [x] `astro/houses.py` — casas Placidus (fallback: Whole Sign)
- [x] `astro/transits.py` — escaneo diario + refinamiento binario + `transit_retrograde` + snapshot `sky` por mes (10 planetas al día 15)

### Endpoints del backend
| Endpoint | Rate limit | Descripción |
|----------|-----------|-------------|
| `GET /health` | 10/min | Health check |
| `POST /api/chart` | 20/min | Carta natal |
| `POST /api/transits` | 5/min | Tránsitos (año actual por mes + 4 años futuros) |
| `POST /api/solar-return` | 10/min | Retorno solar |
| `POST /api/mundane` | 5/min | Análisis geopolítico (configuraciones mundiales + análogos históricos + impacto natal opcional) |

### Frontend — Páginas
- [x] `app/layout.tsx` — layout principal
- [x] `app/page.tsx` — **portada**: intro, tarjetas de planetas, botones "Realizar carta natal" → `/nueva` y "Aprende los significados" → `/glosario`
- [x] `app/nueva/page.tsx` — formulario BirthDataForm + **panel de cartas guardadas**
- [x] `app/glosario/page.tsx` — glosario (aspectos, retrogradación, dignidades, planetas, ángulos, orbes)
- [x] `app/carta/[id]/page.tsx` — carta natal + botón "☉ Retorno Solar"
- [x] `app/transitos/[id]/page.tsx` — tránsitos: selector de año (actual + 4), filtro por mes con rueda interactiva y resumen breve; años futuros con análisis anual
- [x] `app/retorno/[id]/page.tsx` — **retorno solar** (tema ámbar) + **panel ejecutivo lateral**
- [x] `app/not-found.tsx`, `app/error.tsx`

### Frontend — API proxies
- [x] `app/api/chart/route.ts`
- [x] `app/api/transits/route.ts`
- [x] `app/api/solar-return/route.ts` — timeout 60s

### Frontend — Componentes
- [x] `components/BirthDataForm.tsx` — con geocoding Nominatim + DST
- [x] `components/ChartWheel.tsx` — **SVG puro** (sin D3), estilo astro.com
- [x] `components/AspectTable.tsx`
- [x] `components/PlanetPositions.tsx` — con **columna de dignidades** (⌂ ↑ ⊗ ↓)
- [x] `components/TransitZodiacWheel.tsx` — birueda zodiacal estilo astro.com; planetas como esferas 3D SVG; retrógrados con anillo rojo + ℞ + ↺; leyenda de movimiento
- [x] `components/SolarReturnSummaryPanel.tsx` — **panel ejecutivo retorno solar**
- [x] `components/InterpretationModal.tsx` — modal de interpretaciones natales (click en rueda)
- [x] `components/ChartSummary.tsx` — resumen compacto de carta natal
- [x] `components/PageNav.tsx` — navegación "Inicio / Nueva carta" en páginas de detalle
- [x] `components/NavHeader.tsx` — cabecera de navegación global
- [x] `components/Providers.tsx` — envuelve la app con `LanguageProvider`
- [x] `components/LangToggle.tsx` — selector ES/EN
- [x] `components/InterpretationCard.tsx` — (legacy, sin uso activo)
- [x] `components/TransitTimeline.tsx` — (legacy, sin uso activo)

### Frontend — Librerías
- [x] `lib/types.ts` — interfaces TypeScript (incluye `SolarReturnRequest`, `SkyPlanet`, `transit_retrograde` en `TransitEvent`)
- [x] `lib/storage.ts` — localStorage: `saveChart`, `loadChart`, `saveTransits`, `loadTransits`, `saveYearTransits`, `loadYearTransits`, `saveSolarReturn`, `loadSolarReturn`, `listCharts`, `deleteChart` (caché v2 por año)
- [x] `lib/zodiac-utils.ts` — helpers + **`getPlanetDignity()`** + `DIGNITY_SYMBOL/COLOR`
- [x] `lib/interpretation-engine.ts` — ~270 interpretaciones de tránsitos con claves en español (ej. `"júpiter_conjunción_sol"`); **bilingüe** (`lang` param → ES/EN)
- [x] `lib/brief-summary.ts` — `generateMonthBrief(month, exactCalendar, lang)` + `generateYearBrief(data, year, lang)` (resúmenes breves bilingüe)
- [x] `lib/solar-return-summary.ts` — **`generateSolarReturnSummary(srChart, lang)`** (Forrest/Tyl/Sasportas/Rodden) bilingüe
- [x] `lib/wheel-geometry.ts` — helpers SVG: `polarXY`, `describeSector`, `makeToAngle`
- [x] `lib/chart-summary.ts` — helpers para `ChartSummary`
- [x] `lib/natal-interpretations.ts` — corpus de interpretaciones natales (click en rueda; cuerpo en español, fuera de scope i18n)
- [x] `lib/i18n.tsx` — `LanguageProvider` + `useT()` → `{ lang, setLang, t }`
- [x] `lib/locales/es.ts` — diccionario español completo (incluyendo `modal.*` y `chart.loading_hint`)
- [x] `lib/locales/en.ts` — diccionario inglés completo (incluyendo `modal.*` y `chart.loading_hint`)

### Documentación
- [x] `GAP_ANALYSIS_DEPLOY.md` — análisis completo de seguridad para deploy a producción
- [x] `AUDIT_DEPLOY.md` — histórico de seguridad + nuevas features (2026-04-28)

---

## ARQUITECTURA

```
AstroEngineering/
├── CLAUDE.md                           ← Este archivo
├── README.md
├── GAP_ANALYSIS_DEPLOY.md              ← Seguridad + producción
├── AUDIT_DEPLOY.md                     ← Histórico seguridad (2026-04-28)
├── docker-compose.yml
├── render.yaml                         ← Configuración deploy backend en Render
├── backend/
│   ├── main.py                         ← FastAPI + CORS + rate limiting + logging
│   ├── requirements.txt                ← incluye slowapi
│   ├── Dockerfile                      ← non-root user astro (uid=1000)
│   └── astro/
│       ├── __init__.py
│       ├── models.py                   ← Pydantic v2 + validación semántica + SkyPlanet
│       ├── chart.py                    ← natal + solar return (binary search)
│       ├── aspects.py                  ← Detección y scoring de aspectos
│       ├── houses.py                   ← Casas Placidus (fallback: Whole Sign)
│       └── transits.py                 ← transit_retrograde + sky snapshot por mes
└── frontend/
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── next.config.ts
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx                    ← Portada: intro, planetas, botones /nueva y /glosario
    │   ├── nueva/page.tsx              ← Formulario BirthDataForm + cartas guardadas
    │   ├── glosario/page.tsx           ← Glosario (aspectos, dignidades, planetas, etc.)
    │   ├── carta/[id]/page.tsx         ← Carta natal completa + botón SR
    │   ├── transitos/[id]/page.tsx     ← Selector año, chips mes, rueda interactiva, análisis anual
    │   ├── retorno/[id]/page.tsx       ← Retorno solar + panel ejecutivo
    │   ├── not-found.tsx
    │   ├── error.tsx
    │   └── api/
    │       ├── chart/route.ts          ← Proxy → backend /api/chart
    │       ├── transits/route.ts       ← Proxy → backend /api/transits
    │       └── solar-return/route.ts   ← Proxy → backend /api/solar-return
    ├── components/
    │   ├── AspectTable.tsx
    │   ├── BirthDataForm.tsx
    │   ├── ChartSummary.tsx
    │   ├── ChartWheel.tsx              ← SVG puro, estilo astro.com
    │   ├── InterpretationCard.tsx      ← (legacy, sin uso activo)
    │   ├── InterpretationModal.tsx     ← Modal interpretaciones natales (click en rueda)
    │   ├── LangToggle.tsx              ← Selector ES/EN
    │   ├── NavHeader.tsx               ← Cabecera global
    │   ├── PageNav.tsx                 ← Botones "Inicio / Nueva carta"
    │   ├── PlanetPositions.tsx         ← con columna de dignidades
    │   ├── Providers.tsx               ← Envuelve app con LanguageProvider
    │   ├── SolarReturnSummaryPanel.tsx
    │   ├── TransitTimeline.tsx         ← (legacy, sin uso activo)
    │   └── TransitZodiacWheel.tsx      ← esferas 3D, retrógrados con anillo rojo + ℞ + ↺
    └── lib/
        ├── brief-summary.ts            ← generateMonthBrief() + generateYearBrief()
        ├── chart-summary.ts
        ├── i18n.tsx                    ← LanguageProvider + useT()
        ├── interpretation-engine.ts    ← ~270 interpretaciones, claves en español
        ├── locales/
        │   ├── en.ts
        │   └── es.ts
        ├── natal-interpretations.ts
        ├── solar-return-summary.ts
        ├── storage.ts                  ← saveYearTransits/loadYearTransits (caché v2)
        ├── types.ts
        ├── wheel-geometry.ts
        └── zodiac-utils.ts             ← getPlanetDignity() + DIGNITY_SYMBOL/COLOR
```

---

## CÓMO CORRER LOCALMENTE

### Con Docker (recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up --build

# Backend disponible en: http://localhost:8000
# Frontend disponible en: http://localhost:3000
# Docs API (Swagger): http://localhost:8000/docs (solo en desarrollo)
```

### Sin Docker (desarrollo rápido)

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

### GitHub Codespace

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000 --host 0.0.0.0
# → Hacer el puerto 8000 PUBLIC en la pestaña PORTS

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
# → Hacer el puerto 3000 PUBLIC en la pestaña PORTS

# Terminal 3 — Configurar URL del backend
echo "NEXT_PUBLIC_API_URL=https://TU-CODESPACE-8000.app.github.dev" > frontend/.env.local
# Reiniciar Terminal 2 para cargar la variable
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
1. Render: New Web Service → repo → autoselecciona `render.yaml` en la raíz
2. Render: configurar manualmente env var `FRONTEND_URL=https://tu-app.vercel.app`
3. Vercel: New Project → repo → Root Dir: `frontend` → Next.js
4. Vercel: agregar env var `NEXT_PUBLIC_API_URL=https://tu-backend.onrender.com`

> Ver `GAP_ANALYSIS_DEPLOY.md` para lista completa de brechas de seguridad pendientes (Sprint 1 y 2).

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

---

## NOTAS CRÍTICAS (NO OLVIDAR)

1. **Hora local → UT**: Siempre restar `timezone_offset` antes de `swe.julday()`.
2. **Efemérides**: Archivos `.se1` en `/usr/share/swisseph/ephe`. Sin ellos, usa Moshier (~0.1° de error, aceptable para MVP).
3. **Placidus en latitudes altas**: Falla para latitudes > 66°. Fallback a Whole Sign Houses en `houses.py`.
4. **Retrógrados en tránsitos**: Un planeta retrógrado puede formar el mismo aspecto 3 veces. `consolidate_transits()` en `transits.py` agrupa las pasadas.
5. **Orbes de tránsitos**: Más estrictos que natales. Ver `TRANSIT_ORBS` en `aspects.py`.
6. **ChartWheel sin D3**: SVG puro React. `makeToAngle(ascLon)` rotaciona la rueda con el ASC a la izquierda (9 o'clock).
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

### Resúmenes de tránsitos
Generados desde `lib/brief-summary.ts`:
- `generateMonthBrief(transits, month, lang)` — resumen breve para el mes seleccionado (vista de año actual filtrada por mes)
- `generateYearBrief(transits, year, lang)` — análisis anual breve para años futuros (sin detalle mensual)

### SolarReturnSummaryPanel (retorno solar)
Genera con `generateSolarReturnSummary(srChart, lang)` de `lib/solar-return-summary.ts`.
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

## MOTOR DE INTERPRETACIONES

Ubicación: `frontend/lib/interpretation-engine.ts`

~270 combinaciones: 6 planetas transitantes × 9 planetas/puntos natales × 5 aspectos mayores.

Claves en español (ej. `"júpiter_conjunción_sol"`, `"saturno_conjunción_sol"`). Función `getInterpretation(key, lang)` retorna la interpretación en el idioma solicitado.

---

## SEGURIDAD (Sprint 0 completado)

Ver `GAP_ANALYSIS_DEPLOY.md` y `AUDIT_DEPLOY.md` para el análisis completo. Implementado:

| Fix | Descripción |
|-----|-------------|
| Rate limiting | slowapi: 20/min chart, 5/min transits, 10/min SR |
| Non-root Docker | Usuario `astro` uid=1000 en contenedor |
| CORS exacto | `FRONTEND_URL` env var reemplaza regex wildcard en producción |
| Error handling | Stack traces no se exponen al cliente; logging centralizado |
| Validación fechas | `date.fromisoformat()` valida semánticamente; rango 1800-2200 |
| Límite de rango | Tránsitos: máximo 366 días por request/año |
| Swagger oculto | `/docs` y `/redoc` deshabilitados cuando `ENV=production` |

**Pendiente (Sprint 1 y 2):** ver `GAP_ANALYSIS_DEPLOY.md` secciones Alto y Medio.
