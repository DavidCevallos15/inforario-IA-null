// ------------------------------------------------------------------
// Extracción de texto posicional de PDFs con pdf.js
// Compartido por el parser local (sguRegexParser) y la extracción por IA.
// ------------------------------------------------------------------

export interface TextItem {
  text: string;
  x: number;
  y: number;
  page?: number;
}

/**
 * Lee todas las páginas del PDF y devuelve cada fragmento de texto con su
 * posición (y crece hacia abajo, como en la página impresa).
 */
export async function loadPdfTextItems(data: ArrayBuffer | Uint8Array): Promise<TextItem[]> {
  const pdfjsLib = await import('pdfjs-dist');

  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // Worker empaquetado por Vite: misma versión que la librería y sin depender de un CDN externo.
    const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  }

  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const items: TextItem[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        const tx = item.transform;
        items.push({
          text: item.str.trim(),
          x: Math.round(tx[4]),
          y: Math.round(viewport.height - tx[5]),
          page: pageNum,
        });
      }
    }
  }

  if (items.length === 0) {
    throw new Error('No se pudo extraer texto del PDF. El archivo puede estar corrupto o ser un escaneo.');
  }

  return items;
}

const SENSITIVE_LABELS = ['ESTUDIANTE:', 'CEDULA:', 'CODIGO DE MATRICULA:', 'FECHA DE IMPRESION:'];

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

/**
 * Quita del texto los datos personales del encabezado (nombre, cédula, código
 * de matrícula) antes de enviarlo a un servicio externo: la etiqueta y los
 * valores que la siguen en la misma línea.
 */
export function redactPersonalData(items: TextItem[]): TextItem[] {
  const labels = items.filter((i) => SENSITIVE_LABELS.includes(normalize(i.text)));
  return items.filter(
    (item) =>
      !labels.some(
        (label) =>
          item === label ||
          ((item.page ?? 1) === (label.page ?? 1) &&
            Math.abs(item.y - label.y) <= 5 &&
            item.x > label.x &&
            item.x - label.x < 400)
      )
  );
}

/**
 * Reconstruye líneas de texto legibles agrupando fragmentos con la misma
 * coordenada vertical. Se usa como entrada para el modelo de IA.
 */
export function textItemsToPlainText(items: TextItem[], lineTolerance = 2): string {
  const pages = new Map<number, TextItem[]>();
  for (const item of items) {
    const page = item.page ?? 1;
    const bucket = pages.get(page);
    if (bucket) bucket.push(item);
    else pages.set(page, [item]);
  }

  const pageChunks: string[] = [];
  for (const page of [...pages.keys()].sort((a, b) => a - b)) {
    const rows = [...pages.get(page)!].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
    const lines: string[] = [];
    let currentY: number | null = null;
    let currentLine: TextItem[] = [];

    // Dentro de una línea se reordena por x: fragmentos con 1–2 px de diferencia
    // vertical quedarían, si no, en orden incorrecto.
    const flush = () => {
      if (currentLine.length) {
        lines.push(currentLine.sort((a, b) => a.x - b.x).map((i) => i.text).join(' '));
      }
    };

    for (const row of rows) {
      if (currentY === null || Math.abs(row.y - currentY) <= lineTolerance) {
        currentLine.push(row);
        currentY = currentY ?? row.y;
      } else {
        flush();
        currentLine = [row];
        currentY = row.y;
      }
    }
    flush();
    pageChunks.push(lines.join('\n'));
  }

  return pageChunks.join('\n\n');
}
