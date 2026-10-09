# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Estudiantes de la Universidad Técnica de Manabí (UTM, Portoviejo, Ecuador) de cualquier facultad. Usan Inforario sobre todo desde el **celular**: al inicio de cada período descargan del SGU su reporte "Horario de clases" en PDF, lo suben y luego consultan el horario durante la semana (qué clase sigue, en qué aula, piso y edificio, con qué docente).

## Product Purpose

Convertir el reporte PDF de horarios del SGU (Sistema de Gestión Académica de la UTM), pensado para imprimir y difícil de leer en un teléfono, en un horario digital claro y consultable. Éxito: un estudiante sube su PDF y en segundos ve su semana completa, entiende dónde tiene que estar y puede llevarse el horario a su calendario o imprimirlo.

## Positioning

Lee el PDF oficial del SGU directamente en el navegador: no hay que copiar materias a mano, y el reporte (que incluye nombre y cédula) no sale del dispositivo. Entiende el formato real del SGU: varias páginas, materias sin horario asignado, aula, piso y edificio a partir del código de ambiente y del campo LUGAR.

## Operating Context

- Entrada: PDF "Horario de clases" del SGU, de 1 a 2 páginas, horizontal. Contiene período, facultad, carrera, malla, nivel, materias con paralelo, créditos, docente, departamento y bloques "DÍA (HH:MM:SS-HH:MM:SS)" con LUGAR, COD. AMB., TIPO y PISO. Algunas materias dicen "HORARIO NO ASIGNADO"; otras pueden ser virtuales.
- Semana de clases: lunes a viernes.
- Uso típico: subir el PDF una vez por período y consultar el horario muchas veces, a menudo caminando por el campus entre edificios.

## Capabilities and Constraints

- Extracción local del PDF (parser por coordenadas); la IA (Groq vía Supabase Edge Function) es solo un respaldo para formatos no reconocidos y recibe el texto sin datos personales.
- Vistas: cuadrícula semanal (escritorio) y lista por día (móvil); materias virtuales o sin horario en una sección aparte.
- Detección de choques de horario; se puede quitar una clase en conflicto.
- Personalización: color por materia, temas de exportación y tamaño de letra.
- Exportación: PDF A3 horizontal y archivo .ics; sincronización directa con Google Calendar para usuarios con sesión (la app OAuth está en modo de prueba).
- Uso como invitado (el horario se guarda en el navegador) o con cuenta institucional `@utm.edu.ec` (horarios guardados en la nube; el horario del invitado se sube a la cuenta al iniciar sesión).
- Stack: Vite + React 19 + TypeScript + Tailwind v3 + framer-motion, Supabase, Vercel.

## Brand Commitments

- Nombre: **Inforario**. Se mantiene.
- Identidad visual libre: no está obligada a usar los colores ni el estilo institucional de la UTM (decisión del dueño, 2026-10-09).
- Es un proyecto estudiantil independiente, no un servicio oficial de la UTM: no debe presentarse como producto oficial de la universidad ni usar su escudo.
- Idioma: español (Ecuador).

## Evidence on Hand

- Reporte real del SGU, anonimizado: `frontend/src/features/uploader/utils/__fixtures__/sguReport.json` (5 materias, 2 páginas, período MAYO 2022 - SEPTIEMBRE 2022).
- No hay testimonios, métricas de uso, cantidad de usuarios ni logos de terceros. No inventarlos.

## Product Principles

1. El horario es el producto: cada pantalla existe para que el estudiante sepa qué clase tiene, cuándo y dónde.
2. Primero el celular: legible de un vistazo, con una mano, en exterior.
3. Privacidad por defecto: el PDF se procesa en el dispositivo; nada personal se envía sin necesidad.
4. Fiel al SGU: los datos se muestran tal como los registra la universidad (nombres de materias, aulas, edificios), sin adornos que confundan.
5. Sin fricción: funciona sin cuenta; la cuenta solo añade guardado y sincronización.

## Accessibility & Inclusion

Uso en exteriores y en movimiento: contraste alto, objetivos táctiles amplios y texto legible sin zoom. Respetar `prefers-reduced-motion`. Contenido y mensajes en español claro.
