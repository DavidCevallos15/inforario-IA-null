# Inforario

Convierte el reporte de horarios en PDF del SGU de la Universidad Técnica de Manabí en un horario interactivo: vista de cuadrícula/lista, detección de choques, colores por materia y exportación a PDF o `.ics` (Google Calendar, Apple Calendar, Outlook).

## Estructura

```
frontend/   React 19 + TypeScript + Vite + Tailwind (ver docs/ARCHITECTURE.md)
backend/    Supabase: configuración y Edge Functions
  supabase/functions/extract-schedule      Extracción del horario con IA (Groq)
  supabase/functions/google-calendar-sync  Inserción de eventos en Google Calendar
```

## Flujo de procesamiento

1. El PDF se lee en el navegador con pdf.js (`features/uploader/utils/pdfText.ts`).
2. El texto se envía a la Edge Function `extract-schedule`; si falla, se usa el parser local por coordenadas (`sguRegexParser.ts`).
3. Facultad y período siempre se leen localmente del encabezado del PDF.
4. Se asignan colores por materia y se marcan los choques de horario.
5. Los usuarios autenticados guardan sus horarios en la tabla `schedules`; los invitados trabajan solo en local.

## Desarrollo local

Requisitos: Node.js 20+ (y la CLI de Supabase si vas a ejecutar las funciones localmente).

```bash
npm run install:all
npm run dev          # http://localhost:3000
```

Opcional: copia `frontend/.env.example` a `frontend/.env.local` para apuntar a otro proyecto Supabase.

## Calidad

```bash
npm test             # pruebas unitarias (Vitest)
npm run typecheck    # TypeScript en modo estricto
npm run build        # build de producción
```

## Base de datos

El esquema y las políticas RLS están versionados en `backend/supabase/migrations/`.
Los tokens de Google Calendar solo los escribe el servidor (service role); el cliente únicamente puede ver si su cuenta está vinculada.

## Edge Functions

Secretos necesarios (Supabase → Edge Functions → Secrets, o `supabase secrets set ...`):

| Función | Secretos |
| --- | --- |
| `extract-schedule` | `GROQ_API_KEY`, opcional `GROQ_MODEL` |
| `google-calendar-connect` / `google-calendar-sync` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

`extract-schedule` es pública (sin JWT) y está protegida con un límite de 15 solicitudes/hora por IP y 300/hora en total (tabla `ai_extraction_requests`).

```bash
cd backend && supabase functions deploy extract-schedule
```

## Google Calendar

1. En [Google Cloud Console](https://console.cloud.google.com/): habilita **Google Calendar API**.
2. Pantalla de consentimiento OAuth: agrega el permiso `.../auth/calendar.events`. Mientras la app esté en modo *Testing*, agrega como usuarios de prueba los correos que la usarán.
3. Credenciales → ID de cliente OAuth (Aplicación web) → **Orígenes de JavaScript autorizados**: `https://inforario-ia-null.vercel.app` y `http://localhost:3000`.
4. Guarda `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` como secretos de Supabase. Si el ID no es el que trae `src/constants.ts`, define también `VITE_GOOGLE_CLIENT_ID` en Vercel.
