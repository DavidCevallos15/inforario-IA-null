---
version: 1
slug: "frontend-src-features-landing-landingpage-tsx"
primary_target: "frontend/src/features/landing/LandingPage.tsx"
related_targets: ["frontend/src/features/schedule/components/ScheduleDashboard.tsx"]
---

# Landing + horario (Inforario)

Scope: rediseño completo; la landing (portada con carga del PDF) es la primera superficie y fija el mundo para el resto (horario, login, perfil, acerca de).
Mode: persuade (landing). Las vistas del horario son operate dentro del mismo mundo.
Audience/job: estudiante de la UTM, en el celular, que quiere ver su semana a partir del PDF del SGU.
Action: subir el PDF en la propia portada (zona de carga funcional en el primer viewport).
Proof: antes/después interactivo con el reporte real anonimizado (fixture) frente a la vista de horario real.
Constraints: sin imágenes generadas; sin presentarse como servicio oficial de la UTM; crédito "Hecho por DC.dev" con enlace https://github.com/DavidCevallos15; modo oscuro automático; botón principal magnético solo con puntero fino.

## Direction contract

THESIS: La app es una hoja de cuaderno cuadriculado donde tu semana queda pasada en limpio. Rechaza el arreglo típico de app estudiantil (héroe con degradado, tres tarjetas de funciones, zona de carga genérica).

OWN-WORLD: Hoja blanca fría con cuadrícula celeste de 24 px y margen rojo vertical; tinta azul de esfero para estructura y títulos; rojo solo para choques y alertas; resaltadores (amarillo, verde, rosa, naranja, celeste, lila) solo para materias; lápiz gris punteado para lo que no tiene horario. Letra de esfero (Kalam) solo en acentos de tinta; datos en Atkinson Hyperlegible Next con números tabulares. En oscuro: hoja de pizarra con cuadrícula tenue y tinta clara.

STORY: El visitante entiende en una línea que su PDF del SGU se convierte en su horario, lo comprueba deslizando el antes/después, ve que es privado y lo sube.

FIRST VIEWPORT: La hoja ocupa la pantalla; margen rojo a la izquierda. Arriba "Inforario" en tinta como encabezado de cuaderno. Titular en dos líneas sobre la cuadrícula. Debajo, ocupando el ancho útil, el recuadro a lápiz que se dibuja solo: es la zona de carga (tocar o arrastrar el PDF), con el botón principal magnético. Todo alineado a la cuadrícula.

FORM: cuaderno cuadriculado, candidato 4 de mi lista ordenada; seed 33dc1a9a. Raises: retícula estricta (teletexto), color por función (Bauhaus), firme/punteado (molde de costura), estados de tiempo (disco de acreción), una sola señal viva (BBS). Interacción firma: antes/después con línea arrastrable. Motion: trazos que se dibujan (pathLength), apariciones al entrar, semana que se escribe celda por celda, firma con esfero al cierre.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
