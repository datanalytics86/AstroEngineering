# AGENTS.md — Grok Agent OS (AstroEngine)

> Este archivo es leído automáticamente por Cursor (Grok 4.6), Grok Build y agentes compatibles.
> Objetivo: que Grok produzca trabajo consistente sin que le tengas que re-explicar las reglas cada vez.

## Propósito del proyecto
AstroEngine es una aplicación web de ingeniería astrológica profesional. Calcula cartas natales con precisión real (Swiss Ephemeris), detecta aspectos, genera tránsitos, retornos solares y análisis mundanos. Frontend en Next.js 14 + TypeScript + Tailwind. Backend en FastAPI + pyswisseph. Deploy: Vercel (frontend) + Render (backend).

## 1. Clasificación obligatoria de trabajo (HAZLO PRIMERO)

Antes de escribir código o generar contenido, clasifica la petición:

| Tipo de request | Acción | No hagas |
|-----------------|--------|----------|
| Idea / problema / outcome sin spec | Crear Spec Draft | Escribir código de producto |
| Spec Draft o con preguntas abiertas | Resolver con el usuario | Escribir código de producto |
| Spec **Accepted** o **Shipped** + comportamiento nuevo | Seguir el flujo de feature | Saltar el Spec |
| Spec vs código discrepan | Decir cuál está mal y corregir ese | Inventar tercera regla |
| Comportamiento actual incorrecto | Tratar como bugfix | Empezar feature |
| Mismo comportamiento, nueva forma | Refactor | Cambiar reglas de negocio |
| Tooling, deps, CI, env, docs, deploy | Chore | Meter comportamiento nuevo |
| UI / copy / layout | UI polish | Meter lógica de negocio en React |
| Investigación / datos | Usar web_search + x_search + code_execution | Alucinar datos |

**Regla de oro:** Solo implementa producto cuando el Spec esté Accepted o Shipped.

## 2. Orden de verdad

1. Este `AGENTS.md`
2. Specs / documentación de producto
3. `DEPLOY.md` (para temas de deploy)
4. Código existente (como referencia de patrones)
5. Herramientas nativas de Grok (web_search, code_execution, etc.)

Nunca inventes reglas de negocio. Si falta detalle → pregunta o actualiza el Spec primero.

## 3. Stack no negociable

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind
- **Backend**: Python 3.11 + FastAPI + pyswisseph + slowapi
- **Deploy**: Vercel (frontend) + Render (backend)
- **Precisión**: Swiss Ephemeris (no aproximaciones)

Cualquier cambio de stack requiere aprobación explícita.

## 4. Non-negotiables específicos de este proyecto

- No romper la precisión de las posiciones planetarias (±0.05°).
- Mantener i18n ES/EN funcionando.
- Respetar los rate limits existentes.
- No meter secretos en el código.
- Para cambios de deploy: seguir `DEPLOY.md`.
- Commits solo cuando el usuario lo pida.

## 5. Instrucciones para el agente

1. Clasifica siempre primero.
2. Sé directo y preciso.
3. Usa herramientas nativas de Grok cuando aporten valor real.
4. Al terminar, resume qué se hizo y qué queda pendiente.
5. Si algo no está claro o es de alto riesgo → pregunta.
