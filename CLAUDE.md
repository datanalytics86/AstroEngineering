# AstroEngine Pro — Guía de Sesión para Claude Code

## DESCRIPCIÓN DEL PROYECTO

Aplicación web de ingeniería astrológica profesional que calcula cartas natales con precisión astronómica real (Swiss Ephemeris), detecta aspectos entre planetas, y genera pronósticos de tránsitos planetarios a futuro (1-12 meses).

**Stack:**
- Backend: Python 3.11 + FastAPI + pyswisseph
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + D3.js
- Deployment: Docker Compose (dev) → Vercel (frontend) + Railway (backend)

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
