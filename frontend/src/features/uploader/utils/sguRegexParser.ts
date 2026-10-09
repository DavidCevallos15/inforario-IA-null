import { ClassSession, DAYS } from "../../../types";
import { TextItem } from "./pdfText";

// ------------------------------------------------------------------
// INTERFACES
// ------------------------------------------------------------------
export interface ParseResult {
  sessions: ClassSession[];
  faculty?: string;
  academic_period?: string;
  student_name?: string;
  career?: string;
}

// ------------------------------------------------------------------
// DAY DETECTION MAP (texto normalizado → DayOfWeek)
// ------------------------------------------------------------------
const DAY_MAP: Record<string, 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes'> = {
  'lunes': 'Lunes',
  'martes': 'Martes',
  'miercoles': 'Miércoles',
  'jueves': 'Jueves',
  'viernes': 'Viernes',
};

const SUBJECT_COLORS = ['#22C55E', '#3B82F6', '#F97316', '#EF4444', '#A855F7', '#06B6D4', '#EAB308'];

/**
 * Asigna un color estable por materia a las sesiones que aún no tienen uno
 * (p. ej. las devueltas por la IA). Respeta los colores ya existentes.
 */
export function assignSubjectColors(sessions: ClassSession[]): ClassSession[] {
  const subjectColors = new Map<string, string>();
  for (const s of sessions) {
    if (s.color) subjectColors.set(s.subject.trim().toUpperCase(), s.color);
  }
  return sessions.map((s) => (s.color ? s : { ...s, color: getSubjectColor(s.subject, subjectColors) }));
}

const getSubjectColor = (subject: string, subjectColors: Map<string, string>) => {
  const key = subject.trim().toUpperCase();
  const existing = subjectColors.get(key);
  if (existing) return existing;
  const color = SUBJECT_COLORS[subjectColors.size % SUBJECT_COLORS.length];
  subjectColors.set(key, color);
  return color;
};

// ------------------------------------------------------------------
// NORMALIZACIÓN DE NOMBRES DE DOCENTES
// ------------------------------------------------------------------
// El título debe terminar en punto o fin de palabra: evita recortar apellidos como "DRAGO" o nombres como "INGRID"
const TITLE_PREFIXES = /\b(ing|lic|dra|dr|msc|mgtr|phd|abg|arq|econ|prof|srta|sra|sr)(?:\.|\b)\s*/gi;

export function normalizeTeacherName(rawName: string): string {
  if (!rawName || rawName.trim().length === 0) return 'Sin asignar';
  
  let name = rawName.trim();
  
  // Skip temporal/system-generated teacher names
  if (/^TEMP\s/i.test(name) || /TEMPORAL/i.test(name)) return 'Sin asignar';
  
  // Remove title prefixes
  name = name.replace(TITLE_PREFIXES, '').trim();
  name = name.replace(TITLE_PREFIXES, '').trim(); // Run twice for double titles
  
  if (!name) return rawName.trim();
  
  // UTM format is: LASTNAME1 LASTNAME2 FIRSTNAME1 FIRSTNAME2
  // We want: Firstname1 Lastname1
  const parts = name.split(/\s+/).filter(p => p.length > 0);
  
  if (parts.length >= 3) {
    // Assume: APELLIDO1 APELLIDO2 NOMBRE1 [NOMBRE2...]
    const firstName = capitalize(parts[2]);
    const lastName = capitalize(parts[0]);
    return `${firstName} ${lastName}`;
  } else if (parts.length === 2) {
    return `${capitalize(parts[1])} ${capitalize(parts[0])}`;
  }
  
  return capitalize(parts[0] || name);
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ------------------------------------------------------------------
// NORMALIZACIÓN DE UBICACIÓN (Código de Ambiente UTM)
// ------------------------------------------------------------------
// UTM format: "1-59-PISO-AULA-TIPO" 
// Example: "1-59-2-04-A" → "Aula 204 - Piso 2"
// Example: "1-59-3-06-LC" → "Lab. Computación 306 - Piso 3"
export function normalizeLocation(codAmb: string, tipo?: string): string {
  if (!codAmb || codAmb.trim() === '') return 'Sin asignar';
  
  const match = codAmb.match(/\d+-\d+-(\d+)-(\d+)-?([\w]*)/);
  if (!match) {
    // Para otras facultades (ej. administrativas) que no siguen el patrón 1-59...
    const cleanCod = codAmb.replace(/;$/, '').trim();
    if (tipo && cleanCod) return `${tipo} ${cleanCod}`;
    if (tipo) return tipo;
    return cleanCod;
  }
  
  const floor = parseInt(match[1]);
  const room = match[2].padStart(2, '0');
  const typeCode = match[3]?.toUpperCase() || '';
  
  const roomNumber = `${floor}${room}`;
  
  // Determine room type from the type code or explicit TIPO field
  if (typeCode === 'LC' || (tipo && /laboratorio/i.test(tipo))) {
    return `Lab. Computación ${roomNumber} - Piso ${floor}`;
  }
  
  return `Aula ${roomNumber} - Piso ${floor}`;
}

// ------------------------------------------------------------------
// DETECCIÓN DE PERÍODOS ACADÉMICOS
// ------------------------------------------------------------------
export function normalizeAcademicPeriod(raw: string): string {
  if (!raw) return '';
  
  // Input: "ABRIL DE 2026 HASTA AGOSTO DE 2026"
  // Input: "SEPTIEMBRE DEL 2025 HASTA ENERO DEL 2026"
  // Output: "ABRIL 2026 - AGOSTO 2026"
  const match = raw.match(/([A-ZÁÉÍÓÚÜÑa-záéíóúüñ]+)\s+(?:DE(?:L)?)\s+(\d{4})\s+HASTA\s+([A-ZÁÉÍÓÚÜÑa-záéíóúüñ]+)\s+(?:DE(?:L)?)\s+(\d{4})/i);
  if (match) {
    return `${match[1].toUpperCase()} ${match[2]} - ${match[3].toUpperCase()} ${match[4]}`;
  }
  return raw.trim().toUpperCase();
}

// ------------------------------------------------------------------
// PDF PARSING PRINCIPAL — Diseñado para SGA UTM
// ------------------------------------------------------------------

/**
 * Interpreta los fragmentos posicionales de un reporte de horarios del SGU.
 * Es una función pura (sin pdf.js) para poder probarla con datos sintéticos.
 */
export function parseSguTextItems(allItems: TextItem[]): ParseResult {
  // 1. EXTRAER METADATOS DEL ENCABEZADO
  const metadata = extractMetadata(allItems);
  
  // 2. EXTRAER BLOQUES DE MATERIAS
  let sessions = extractSubjectBlocks(allItems);
  
  // 3. RESOLVER CONFLICTOS U OVERLAPS (No destructivo)
  sessions = resolveConflicts(sessions);
  
  return {
    sessions,
    faculty: metadata.faculty,
    academic_period: metadata.academicPeriod,
    student_name: metadata.studentName,
    career: metadata.career,
  };
}

// ------------------------------------------------------------------
// EXTRACT METADATA FROM HEADER
// ------------------------------------------------------------------
export interface Metadata {
  faculty?: string;
  academicPeriod?: string;
  studentName?: string;
  career?: string;
  level?: string;
}

/** Mayúsculas y sin tildes: el SGU imprime "Período:" y el SGA antiguo "PERIODO:". */
const normalizeLabel = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

/** Y del encabezado de la tabla de materias en la página, si existe. */
const findTableHeaderY = (pageItems: TextItem[]): number | undefined => {
  const headers = pageItems.filter((i) => normalizeLabel(i.text) === 'ASIGNATURA');
  return headers.length ? Math.min(...headers.map((h) => h.y)) : undefined;
};

export function extractMetadata(items: TextItem[]): Metadata {
  const result: Metadata = {};

  // El encabezado está en la página 1, por encima de la tabla de materias
  const page1 = items.filter((i) => (i.page ?? 1) === 1);
  const tableY = findTableHeaderY(page1) ?? 210;
  const headerItems = page1.filter((i) => i.y < tableY);

  for (let idx = 0; idx < headerItems.length; idx++) {
    const label = normalizeLabel(headerItems[idx].text);
    if (!label.endsWith(':')) continue;
    const value = findValueAfterLabel(headerItems, idx);
    if (!value) continue;

    switch (label) {
      case 'PERIODO:':
        result.academicPeriod = normalizeAcademicPeriod(value);
        break;
      case 'FACULTAD:': {
        const faculty = value.toUpperCase();
        result.faculty = faculty.startsWith('FACULTAD') ? faculty : `FACULTAD DE ${faculty}`;
        break;
      }
      case 'CARRERA:':
      case 'ESCUELA:':
        result.career = value.toUpperCase();
        break;
      case 'ESTUDIANTE:':
        result.studentName = value;
        break;
      case 'NIVEL:':
        result.level = value;
        break;
    }
  }

  return result;
}

function findValueAfterLabel(items: TextItem[], labelIdx: number): string | null {
  const label = items[labelIdx];
  const candidates = items
    .filter((c) => c !== label && Math.abs(c.y - label.y) <= 5 && c.x > label.x)
    .sort((a, b) => a.x - b.x);
  return candidates[0]?.text ?? null;
}

const LOWERCASE_WORDS = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'E', 'EN']);

const toTitleCase = (text: string) =>
  text
    .toUpperCase()
    .split(/\s+/)
    .map((word, i) =>
      i > 0 && LOWERCASE_WORDS.has(word)
        ? word.toLowerCase()
        : word.replace(/[A-ZÁÉÍÓÚÜÑ]+/g, (w) => w.charAt(0) + w.slice(1).toLowerCase())
    )
    .join(' ');

/**
 * Edificio a partir del campo LUGAR, p. ej.
 * "FACULTAD DE CIENCIAS BÁSICAS I (CIENCIAS BÁSICAS)" → "Ciencias Básicas I".
 */
export function extractBuilding(lugar: string): string | undefined {
  const clean = lugar
    .replace(/\s+/g, ' ')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/^FACULTAD DE\s+/i, '')
    .trim();
  return clean ? toTitleCase(clean) : undefined;
}

// ------------------------------------------------------------------
// EXTRACT SUBJECT BLOCKS
// ------------------------------------------------------------------
// Columnas del reporte SGU (página horizontal de 792 pt). Medidas sobre un reporte real:
// ASIGNATURA x≈26 · NIVEL 229 · PARAL. 263 · CREDI. 305 · DOCENTE 330 · DEPARTAMENTO 441 · HORARIO 538–566+
const COL = {
  SUBJECT_MAX_X: 200,
  DOCENTE_MIN_X: 320,
  DOCENTE_MAX_X: 430,
  HORARIO_MIN_X: 495,
};

// Textos que marcan el fin de la tabla (leyenda y pie de página)
const TABLE_END_MARKERS = ['LEYENDAS', 'LEYENDA', 'APROBADO', 'PENDIENTE', 'NOTA', 'SISTEMA DE GESTION'];

function extractSubjectBlocks(items: TextItem[]): ClassSession[] {
  const sessions: ClassSession[] = [];
  const subjectColors = new Map<string, string>();

  const pages = Array.from(new Set(items.map(i => i.page || 1))).sort((a, b) => a - b);

  for (const pageNum of pages) {
    const pageItems = items.filter(i => (i.page || 1) === pageNum);

    // Las páginas de continuación no repiten el encabezado: la tabla empieza arriba
    const tableHeaderY = findTableHeaderY(pageItems);
    const dataStartY = tableHeaderY !== undefined ? tableHeaderY + 15 : 0;
    const endMarkers = pageItems.filter(
      (i) => i.y >= dataStartY && TABLE_END_MARKERS.some((m) => normalizeLabel(i.text).startsWith(m))
    );
    const dataEndY = endMarkers.length ? Math.min(...endMarkers.map((m) => m.y)) : Infinity;
    const inTable = (i: TextItem) => i.y >= dataStartY && i.y < dataEndY;

    const headerTexts = ['ASIGNATURA', 'NIVEL', 'PARAL.', 'CREDI.', 'DOCENTE', 'DEPARTAMENTO', 'HORARIO Y AMBIENTE'];
    const footerTexts = ['LEYENDAS', 'DESCRIPCION', 'LEYENDA', 'DESCRIPCIÓN', 'Sistema de Gestión', 'APROBADO', 'PENDIENTE', 'PARALELO QUE', 'AQUELLOS PARALELOS'];

    // 1. Identify subjects on this page
    const subjectItems = pageItems.filter(i =>
      inTable(i) &&
      i.x < COL.SUBJECT_MAX_X &&
      !headerTexts.includes(i.text) && 
      !footerTexts.some(ft => i.text.includes(ft)) &&
      !i.text.startsWith('NOTA:') &&
      i.text.length >= 3
    );
    
    interface TempSubject {
      y: number;
      items: TextItem[];
      name?: string;
      docenteItems: TextItem[];
      teacher?: string;
    }
    
    const subjects: TempSubject[] = [];
    for (const item of subjectItems) {
      const existing = subjects.find(s => Math.abs(s.y - item.y) < 15);
      if (existing) {
        existing.items.push(item);
        existing.y = (existing.y * (existing.items.length - 1) + item.y) / existing.items.length;
      } else {
        subjects.push({
          y: item.y,
          items: [item],
          docenteItems: [],
        });
      }
    }
    
    subjects.sort((a, b) => a.y - b.y);
    
    for (const sub of subjects) {
      sub.name = sub.items
        .sort((a, b) => a.y - b.y)
        .map(i => i.text)
        .join(' ')
        .replace(/\s*\([A-Z0-9\s-]+\)\s*/gi, '')
        .replace(/^(TECNOLOG[IÍ]AS DE LA\s*)+/i, '')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    if (subjects.length === 0) continue;
    
    // 2. Identify docente name items for each subject
    const docenteItems = pageItems.filter(i =>
      inTable(i) &&
      i.x >= COL.DOCENTE_MIN_X && i.x < COL.DOCENTE_MAX_X &&
      !headerTexts.includes(i.text) && 
      !footerTexts.some(ft => i.text.includes(ft))
    );
    
    for (const item of docenteItems) {
      let closestSub: TempSubject | null = null;
      let minDistance = Infinity;
      for (const sub of subjects) {
        const dist = Math.abs(sub.y - item.y);
        if (dist < minDistance) {
          minDistance = dist;
          closestSub = sub;
        }
      }
      if (closestSub) {
        closestSub.docenteItems.push(item);
      }
    }
    
    for (const sub of subjects) {
      const rawTeacher = sub.docenteItems
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map(i => i.text)
        .join(' ');
      sub.teacher = normalizeTeacherName(rawTeacher);
    }
    
    // 3. Identify schedule entry headers in the schedule column
    const scheduleItems = pageItems.filter(i =>
      inTable(i) &&
      i.x >= COL.HORARIO_MIN_X &&
      !headerTexts.includes(i.text) && 
      !footerTexts.some(ft => i.text.includes(ft))
    );
    
    const dayTimeRegex = /(?:-\s*)?\b(LUNES|MARTES|MI[EÉ]RCOLES|JUEVES|VIERNES)\b\s*\((\d{1,2}):(\d{2}):\d{2}-(\d{1,2}):(\d{2}):\d{2}\)/i;
    const virtualRegex = /(?:MATERIA|ASIGNATURA)\s+VIRTUAL/i;
    const unassignedRegex = /HORARIO\s+NO\s+ASIGNADO/i;
    
    interface EntryHeader {
      y: number;
      text: string;
      isVirtual: boolean;
      items: TextItem[];
    }
    
    const entryHeaders: EntryHeader[] = [];
    const nonHeaderItems: TextItem[] = [];
    
    for (const item of scheduleItems) {
      const isDayTime = dayTimeRegex.test(item.text);
      const isVirtual = virtualRegex.test(item.text);
      // "- HORARIO NO ASIGNADO.": cierra el bloque anterior; la materia se agrega luego sin horario
      if (unassignedRegex.test(item.text)) continue;
      if (isDayTime || isVirtual) {
        entryHeaders.push({
          y: item.y,
          text: item.text,
          isVirtual,
          items: [item]
        });
      } else {
        nonHeaderItems.push(item);
      }
    }
    
    entryHeaders.sort((a, b) => a.y - b.y);
    
    for (const item of nonHeaderItems) {
      let targetHeader: EntryHeader | null = null;
      for (let j = entryHeaders.length - 1; j >= 0; j--) {
        if (entryHeaders[j].y <= item.y) {
          targetHeader = entryHeaders[j];
          break;
        }
      }
      if (!targetHeader && entryHeaders.length > 0) {
        targetHeader = entryHeaders[0];
      }
      if (targetHeader) {
        targetHeader.items.push(item);
      }
    }
    
    const findClosestSubject = (y: number): TempSubject | null => {
      let closest: TempSubject | null = null;
      let minDistance = Infinity;
      for (const sub of subjects) {
        const dist = Math.abs(sub.y - y);
        if (dist < minDistance) {
          minDistance = dist;
          closest = sub;
        }
      }
      return closest;
    };

    const subjectsWithSessions = new Set<TempSubject>();

    for (const header of entryHeaders) {
      const allText = header.items
        .sort((a, b) => a.y - b.y || a.x - b.x)
        .map(i => i.text)
        .join('\n');

      let location = 'Sin asignar';

      const codAmbMatch = allText.match(/COD\.\s*AMB\.?:?\s*(\S+)/i);
      const tipoMatch = allText.match(/TIPO:\s*([^;\n]+)/i);
      // LUGAR ocupa varias líneas hasta "COD. AMB."
      const lugarMatch = allText.match(/LUGAR:\s*([\s\S]*?)\s*(?:COD\.\s*AMB|TIPO:|PISO:|$)/i);
      const building = lugarMatch ? extractBuilding(lugarMatch[1]) : undefined;

      if (codAmbMatch) {
        const codAmb = codAmbMatch[1].replace(/;$/, '');
        const tipo = tipoMatch ? tipoMatch[1].trim() : '';
        const normLoc = normalizeLocation(codAmb, tipo);
        if (normLoc !== 'Sin asignar') {
          location = building ? `${normLoc} - ${building}` : normLoc;
        }
      } else if (building) {
        location = building;
      }

      const closestSub = findClosestSubject(header.y);
      if (!closestSub || !closestSub.name) continue;

      const subjectKey = closestSub.name.toUpperCase();
      const subjectColor = getSubjectColor(subjectKey, subjectColors);

      if (header.isVirtual) {
        subjectsWithSessions.add(closestSub);
        sessions.push({
          id: crypto.randomUUID(),
          subject: subjectKey,
          teacher: closestSub.teacher || 'Sin asignar',
          location: 'Virtual',
          floor: 'N/A',
          isVirtual: true,
          conflict: false,
          color: subjectColor,
        });
        continue;
      }

      const dayMatch = header.text.match(/\b(LUNES|MARTES|MI[EÉ]RCOLES|JUEVES|VIERNES)\b/i);
      const timesMatch = header.text.match(/\((\d{1,2}):(\d{2}):\d{2}-(\d{1,2}):(\d{2}):\d{2}\)/i);
      const day = dayMatch ? DAY_MAP[normalizeLabel(dayMatch[1]).toLowerCase()] : undefined;
      if (!day || !timesMatch) continue;

      const floorMatch = location.match(/Piso\s*(\d+)/i);
      subjectsWithSessions.add(closestSub);
      sessions.push({
        id: crypto.randomUUID(),
        subject: subjectKey,
        day,
        startTime: `${timesMatch[1].padStart(2, '0')}:${timesMatch[2]}`,
        endTime: `${timesMatch[3].padStart(2, '0')}:${timesMatch[4]}`,
        teacher: closestSub.teacher || 'Sin asignar',
        location,
        floor: floorMatch?.[1] || 'N/A',
        isVirtual: false,
        conflict: false,
        color: subjectColor,
      });
    }

    // Materias inscritas sin bloques (p. ej. "HORARIO NO ASIGNADO"): se conservan sin horario
    for (const sub of subjects) {
      if (subjectsWithSessions.has(sub) || !sub.name) continue;
      const subjectKey = sub.name.toUpperCase();
      sessions.push({
        id: crypto.randomUUID(),
        subject: subjectKey,
        teacher: sub.teacher || 'Sin asignar',
        location: 'Horario no asignado',
        floor: 'N/A',
        isVirtual: false,
        conflict: false,
        color: getSubjectColor(subjectKey, subjectColors),
      });
    }
  }
  return sessions;
}

// ------------------------------------------------------------------
// RESOLUCIÓN DE CONFLICTOS DE HORARIO (No destructivo)
// ------------------------------------------------------------------
export function resolveConflicts(sessions: ClassSession[]): ClassSession[] {
  const timeToMins = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  // Copias para no mutar el arreglo recibido (puede venir del estado de React)
  const copies = sessions.map((s) => ({ ...s, conflict: false }));
  const schedulable = copies.filter((s) => !s.isVirtual && s.day && s.startTime && s.endTime);
  const unscheduled = copies.filter((s) => s.isVirtual || !s.day || !s.startTime || !s.endTime);

  // Orden cronológico real (Lunes → Viernes), no alfabético
  schedulable.sort((a, b) => {
    if (a.day !== b.day) return DAYS.indexOf(a.day!) - DAYS.indexOf(b.day!);
    return a.startTime!.localeCompare(b.startTime!);
  });

  for (let i = 0; i < schedulable.length; i++) {
    for (let j = i + 1; j < schedulable.length; j++) {
      const s1 = schedulable[i];
      const s2 = schedulable[j];
      if (s1.day !== s2.day) continue;

      const start1 = timeToMins(s1.startTime!);
      const end1 = timeToMins(s1.endTime!);
      const start2 = timeToMins(s2.startTime!);
      const end2 = timeToMins(s2.endTime!);

      if (start1 < end2 && start2 < end1) {
        s1.conflict = true;
        s2.conflict = true;
      }
    }
  }

  return [...schedulable, ...unscheduled];
}
