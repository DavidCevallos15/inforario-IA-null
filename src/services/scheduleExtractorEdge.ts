import { supabase, isSupabaseConfigured } from './supabase';
import { ClassSession } from '../types';

interface ExtractScheduleEdgeResponse {
  sessions?: Array<{
    subject?: string;
    teacher?: string;
    day?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    floor?: string;
    isVirtual?: boolean;
  }>;
  error?: string;
}

interface ParseResult {
  sessions: ClassSession[];
  faculty?: string;
  academic_period?: string;
}

const DAY_MAP: Record<string, ClassSession['day']> = {
  Lunes: 'Lunes',
  Martes: 'Martes',
  Miércoles: 'Miércoles',
  Jueves: 'Jueves',
  Viernes: 'Viernes',
};

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const sanitizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

const extractPdfText = async (base64DataUrl: string): Promise<string> => {
  const pdfjsLib = await import('pdfjs-dist');

  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const cleanBase64 = base64DataUrl.replace(/^data:(.*);base64,/, '');
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;

  const pageChunks: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    const rows = textContent.items
      .map((item) => {
        const candidate = item as { str?: string; transform?: number[] };
        if (!candidate.str || !candidate.transform || candidate.transform.length < 6) {
          return null;
        }

        const text = candidate.str.trim();
        if (!text) {
          return null;
        }

        return {
          text,
          x: Math.round(candidate.transform[4]),
          y: Math.round(viewport.height - candidate.transform[5]),
        };
      })
      .filter((item): item is { text: string; x: number; y: number } => item !== null)
      .sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

    let currentY: number | null = null;
    let currentLine: string[] = [];
    const lines: string[] = [];

    for (const row of rows) {
      if (currentY === null || Math.abs(row.y - currentY) <= 2) {
        currentLine.push(row.text);
        currentY = currentY ?? row.y;
      } else {
        lines.push(currentLine.join(' '));
        currentLine = [row.text];
        currentY = row.y;
      }
    }

    if (currentLine.length) {
      lines.push(currentLine.join(' '));
    }

    pageChunks.push(lines.join('\n'));
  }

  const plainText = pageChunks.join('\n\n');
  const normalized = sanitizeText(plainText);

  if (!normalized) {
    throw new Error('No se pudo extraer texto del PDF.');
  }

  return plainText;
};

const mapSessions = (payload: ExtractScheduleEdgeResponse): ClassSession[] => {
  if (!Array.isArray(payload.sessions)) {
    throw new Error('La respuesta de la IA no contiene sessions.');
  }

  return payload.sessions
    .map((item) => {
      const isVirtual = item.isVirtual === true || (item.location || '').toUpperCase().includes('VIRTUAL');
      const day = item.day ? DAY_MAP[item.day] : undefined;
      const startTime = item.startTime?.trim();
      const endTime = item.endTime?.trim();
      const subject = item.subject
        // Remove hallucinated career prefix and curriculum tags from IA output.
        ?.replace(/^(TECNOLOG[IÍ]AS DE LA\s*)+/i, '')
        ?.replace(/\s*\((A19|ITINERARIO|[A-Z0-9]+)\)\s*/gi, '')
        .trim() || '';
      const hasValidTime =
        !!startTime &&
        !!endTime &&
        TIME_REGEX.test(startTime) &&
        TIME_REGEX.test(endTime);

      if (!subject) {
        return null;
      }

      if (!isVirtual && (!day || !hasValidTime)) {
        return null;
      }

      return {
        id: crypto.randomUUID(),
        subject,
        day: isVirtual ? undefined : day,
        startTime: isVirtual ? undefined : startTime,
        endTime: isVirtual ? undefined : endTime,
        teacher: item.teacher?.trim() || 'N/A',
        location: isVirtual ? 'Virtual' : item.location?.trim() || 'N/A',
        floor: item.floor?.trim() || 'N/A',
        isVirtual,
        conflict: false,
      } as ClassSession;
    })
    .filter((session): session is ClassSession => session !== null);
};

export const parseScheduleFileWithEdge = async (base64Data: string): Promise<ParseResult> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase no está configurado para usar extracción por IA.');
  }

  const pdfText = await extractPdfText(base64Data);

  const { data, error } = await supabase.functions.invoke('extract-schedule', {
    body: { pdfText },
  });

  if (error) {
    throw new Error(error.message || 'No se pudo invocar extract-schedule.');
  }

  const payload = (data || {}) as ExtractScheduleEdgeResponse;

  if (payload.error) {
    throw new Error(payload.error);
  }

  const sessions = mapSessions(payload);

  if (!sessions.length) {
    throw new Error('La IA no devolvió sesiones válidas.');
  }

  return {
    sessions,
  };
};
