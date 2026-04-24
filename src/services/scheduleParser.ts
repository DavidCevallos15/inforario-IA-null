import { ClassSession } from "../types";

// ------------------------------------------------------------------
// INTERFACES
// ------------------------------------------------------------------
interface ParseResult {
  sessions: ClassSession[];
  faculty?: string;
  academic_period?: string;
  student_name?: string;
  career?: string;
}

interface TextItem {
  text: string;
  x: number;
  y: number;
}

// ------------------------------------------------------------------
// DAY DETECTION MAP (español → inglés)
// ------------------------------------------------------------------
const DAY_MAP: Record<string, 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = {
  'lunes': 'Monday',
  'martes': 'Tuesday',
  'miercoles': 'Wednesday',
  'miércoles': 'Wednesday',
  'jueves': 'Thursday',
  'viernes': 'Friday',
};

// ------------------------------------------------------------------
// NORMALIZACIÓN DE NOMBRES DE DOCENTES
// ------------------------------------------------------------------
const TITLE_PREFIXES = /\b(ing|lic|dr|dra|msc|mgtr|phd|abg|arq|econ|prof|sr|sra|srta)\.?\s*/gi;

function normalizeTeacherName(rawName: string): string {
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
function normalizeLocation(codAmb: string, tipo?: string): string {
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
function normalizeAcademicPeriod(raw: string): string {
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
 * El formato SGA UTM organiza los datos en columnas con posiciones X específicas:
 * 
 * x ~35:   ASIGNATURA (nombre de la materia)
 * x ~193:  NIVEL
 * x ~220:  PARALELO
 * x ~253:  CRÉDITOS
 * x ~273:  DOCENTE
 * x ~423:  DEPARTAMENTO DOCENTE
 * x ~505+: HORARIO Y AMBIENTE
 * 
 * Cada materia tiene un bloque vertical con:
 * - Líneas de horario: "- DIA (HH:MM:SS-HH:MM:SS)"
 * - Líneas de lugar: "- LUGAR: ..."
 * - Líneas de aula: "- COD. AMB.: X-XX-X-XX-X; TIPO: ...; PISO: X;"
 * - O "- MATERIA VIRTUAL" para materias sin aula física
 */

async function parsePDF(base64Data: string): Promise<ParseResult> {
  const pdfjsLib = await import('pdfjs-dist');
  
  // Configure worker — use CDN in browser, disable in Node.js for testing
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
  
  // Decode base64 to Uint8Array
  const binaryString = typeof atob !== 'undefined' 
    ? atob(base64Data) 
    : Buffer.from(base64Data, 'base64').toString('binary');
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  
  // Collect all text items from all pages
  const allItems: TextItem[] = [];
  
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        const tx = item.transform;
        allItems.push({
          text: item.str.trim(),
          x: Math.round(tx[4]),
          y: Math.round(viewport.height - tx[5]),
        });
      }
    }
  }
  
  if (allItems.length === 0) {
    throw new Error('No se pudo extraer texto del PDF. El archivo puede estar corrupto o ser un escaneo.');
  }
  
  // ----------------------------------------------------------------
  // 1. EXTRAER METADATOS DEL ENCABEZADO
  // ----------------------------------------------------------------
  const metadata = extractMetadata(allItems);
  
  // ----------------------------------------------------------------
  // 2. EXTRAER BLOQUES DE MATERIAS
  // ----------------------------------------------------------------
  const facultyName = metadata.faculty || 'Sin asignar';
  let sessions = extractSubjectBlocks(allItems, facultyName);
  
  // ----------------------------------------------------------------
  // 3. RESOLVER CONFLICTOS U OVERLAPS
  // ----------------------------------------------------------------
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
interface Metadata {
  faculty?: string;
  academicPeriod?: string;
  studentName?: string;
  career?: string;
  level?: string;
}

function extractMetadata(items: TextItem[]): Metadata {
  const result: Metadata = {};
  
  // Header items are in the top portion (y < 200)
  const headerItems = items.filter(i => i.y < 210);
  
  // Build a map of key-value pairs from header
  for (let idx = 0; idx < headerItems.length; idx++) {
    const item = headerItems[idx];
    const text = item.text.toUpperCase();
    
    if (text.includes('PERIODO:') || text === 'PERIODO:') {
      // The value is the next item at roughly the same Y
      const value = findValueAfterLabel(headerItems, idx);
      if (value) result.academicPeriod = normalizeAcademicPeriod(value);
    }
    
    if (text.includes('FACULTAD:') || text === 'FACULTAD:') {
      const value = findValueAfterLabel(headerItems, idx);
      if (value) result.faculty = value.toUpperCase();
    }
    
    if (text.includes('ESCUELA:') || text === 'ESCUELA:') {
      const value = findValueAfterLabel(headerItems, idx);
      if (value) result.career = value.toUpperCase();
    }
    
    if (text.includes('ESTUDIANTE:') || text === 'ESTUDIANTE:') {
      const value = findValueAfterLabel(headerItems, idx);
      if (value) result.studentName = value;
    }
    
    if (text.includes('NIVEL:') || text === 'NIVEL:') {
      const value = findValueAfterLabel(headerItems, idx);
      if (value) result.level = value;
    }
  }
  
  return result;
}

function findValueAfterLabel(items: TextItem[], labelIdx: number): string | null {
  const label = items[labelIdx];
  
  // Look for the next item that is on the same Y row but further to the right
  for (let i = labelIdx + 1; i < items.length; i++) {
    const candidate = items[i];
    if (Math.abs(candidate.y - label.y) <= 5 && candidate.x > label.x) {
      return candidate.text;
    }
  }
  return null;
}

// ------------------------------------------------------------------
// EXTRACT SUBJECT BLOCKS
// ------------------------------------------------------------------
function extractSubjectBlocks(items: TextItem[], faculty: string): ClassSession[] {
  const sessions: ClassSession[] = [];
  
  // Column boundaries (based on UTM SGA PDF layout analysis)
  const COL = {
    SUBJECT_MAX_X: 170,    // Subject name occupies x < 170
    DOCENTE_MIN_X: 260,    // DOCENTE column starts
    DOCENTE_MAX_X: 415,    // DOCENTE column ends
    HORARIO_MIN_X: 495,    // HORARIO Y AMBIENTE column starts
  };
  
  // Find all "ASIGNATURA" headers (one per page) to determine data start Y
  const asignaturaHeaders = items.filter(i => i.text === 'ASIGNATURA');
  const dataStartY = asignaturaHeaders.length > 0 
    ? Math.min(...asignaturaHeaders.map(h => h.y)) + 15 
    : 230;
  
  // Filter out footer/legend items and header repeats
  const headerTexts = ['ASIGNATURA', 'NIVEL', 'PARAL.', 'CREDI.', 'DOCENTE', 'DEPARTAMENTO', 'HORARIO Y AMBIENTE'];
  const footerTexts = ['LEYENDAS', 'DESCRIPCION', 'Sistema de Gestión', 'APROBADO', 'PENDIENTE', 'PARALELO QUE', 'AQUELLOS PARALELOS'];
  
  const contentItems = items.filter(i => {
    if (i.y < dataStartY) return false;
    // Filter out exact header column labels (they repeat on page 2)
    if (headerTexts.includes(i.text)) return false;
    // Filter out footer/legend text
    if (footerTexts.some(ft => i.text.includes(ft))) return false;
    if (i.text.startsWith('NOTA:')) return false;
    return true;
  });
  
  // First pass: identify all subject start positions
  // Subject names are in x < SUBJECT_MAX_X
  const subjectStarts: { y: number; text: string }[] = [];
  
  for (const item of contentItems) {
    if (item.x < COL.SUBJECT_MAX_X) {
      // Skip very short texts (probably noise)
      if (item.text.length < 3) continue;
      
      // Check if this Y is near an existing subject start (multi-line names)
      const existing = subjectStarts.find(s => Math.abs(s.y - item.y) < 15);
      if (!existing) {
        subjectStarts.push({ y: item.y, text: item.text });
      }
    }
  }
  
  // Sort by Y
  subjectStarts.sort((a, b) => a.y - b.y);
  
  if (subjectStarts.length === 0) return sessions;
  
  // Calculate block boundaries using MIDPOINTS between consecutive subjects
  // This ensures we capture horario items that appear ABOVE the subject name row
  // (the UTM PDF often places the first "- DIA (...)" line above the subject name in Y)
  for (let sIdx = 0; sIdx < subjectStarts.length; sIdx++) {
    // Block start: midpoint between previous subject and this one
    // For the first subject, use dataStartY
    const yStart = sIdx === 0 
      ? dataStartY 
      : Math.round((subjectStarts[sIdx - 1].y + subjectStarts[sIdx].y) / 2);
    
    // Block end: midpoint between this subject and the next one
    // For the last subject, use a large value
    const yEnd = sIdx < subjectStarts.length - 1 
      ? Math.round((subjectStarts[sIdx].y + subjectStarts[sIdx + 1].y) / 2)
      : 9999;
    
    const blockItems = contentItems.filter(i => i.y >= yStart && i.y < yEnd);
    
    // Extract subject name (all text items with x < SUBJECT_MAX_X)
    const subjectParts = blockItems
      .filter(i => i.x < COL.SUBJECT_MAX_X)
      .sort((a, b) => a.y - b.y)
      .map(i => i.text);
    
    // Extract docente name (all text items in docente column)
    const docenteParts = blockItems
      .filter(i => i.x >= COL.DOCENTE_MIN_X && i.x < COL.DOCENTE_MAX_X)
      .sort((a, b) => a.y - b.y)
      .map(i => i.text);
    
    // Extract horario items (everything in the schedule column)
    const horarioItems = blockItems
      .filter(i => i.x >= COL.HORARIO_MIN_X)
      .sort((a, b) => a.y - b.y);
    
    // Build the subject name (join multi-line names, remove trailing "(A19)" etc.)
    let subjectName = subjectParts.join(' ')
      .replace(/\s*\([A-Z0-9]+\)\s*/g, '') // Remove malla code like (A19) or (ITINERARIO) completely. User requested clean name
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!subjectName || subjectName.length < 3) continue;
    
    // Build docente name
    const docenteName = normalizeTeacherName(docenteParts.join(' '));
    
    // Parse schedule entries from horario items
    const scheduleEntries = parseHorarioEntries(horarioItems);
    
    // Skip virtual-only subjects (no physical schedule)
    if (scheduleEntries.length === 0) continue;
    
    // Create a session for each schedule entry
    for (const entry of scheduleEntries) {
      sessions.push({
        id: crypto.randomUUID(),
        subject: subjectName.toUpperCase(),
        subject_faculty: faculty,
        day: entry.day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        teacher: docenteName,
        location: entry.location,
        conflict: false,
        color: '#3b82f6',
      });
    }
  }
  
  return sessions;
}



// ------------------------------------------------------------------
// PARSE HORARIO ENTRIES
// ------------------------------------------------------------------
interface ScheduleEntry {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
  location: string;
}

function parseHorarioEntries(items: TextItem[]): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  
  // Join all horario text for processing
  const allText = items.map(i => i.text).join('\n');
  
  // Check if it's a virtual subject
  if (/MATERIA\s+VIRTUAL/i.test(allText)) {
    // If ALL entries are virtual, skip entirely
    // But if some are virtual and some have schedule, only process the scheduled ones
    if (!/\b(LUNES|MARTES|MI[EÉ]RCOLES|JUEVES|VIERNES)\b/i.test(allText)) {
      return []; // Purely virtual
    }
  }
  
  // Parse day + time entries
  // Format: "- DIA (HH:MM:SS-HH:MM:SS)"
  const dayTimeRegex = /-\s*(LUNES|MARTES|MI[EÉ]RCOLES|JUEVES|VIERNES)\s*\((\d{1,2}):(\d{2}):\d{2}-(\d{1,2}):(\d{2}):\d{2}\)/gi;
  
  let match;
  const rawEntries: { day: string; startTime: string; endTime: string; matchIndex: number }[] = [];
  
  while ((match = dayTimeRegex.exec(allText)) !== null) {
    const dayName = match[1].toLowerCase().replace('é', 'e').replace('í', 'i');
    const day = DAY_MAP[dayName];
    if (!day) continue;
    
    rawEntries.push({
      day: match[1],
      startTime: `${match[2].padStart(2, '0')}:${match[3]}`,
      endTime: `${match[4].padStart(2, '0')}:${match[5]}`,
      matchIndex: match.index,
    });
  }
  
  // For each day-time entry, find its associated location
  for (let i = 0; i < rawEntries.length; i++) {
    const entry = rawEntries[i];
    
    // Get the text between this entry and the next one
    const startIdx = entry.matchIndex;
    const endIdx = i < rawEntries.length - 1 ? rawEntries[i + 1].matchIndex : allText.length;
    const block = allText.substring(startIdx, endIdx);
    
    let location = 'Sin asignar';

    if (/MATERIA\s+VIRTUAL/i.test(block)) {
      location = 'Materia Virtual';
    }

    // Extract COD. AMB.
    const codAmbMatch = block.match(/COD\.\s*AMB\.?:?\s*(\S+)/i);
    const tipoMatch = block.match(/TIPO:\s*([^;]+)/i);
    const lugarMatch = block.match(/LUGAR:\s*(.+?)(?:\s*\(|$|\n)/m);
    
    if (codAmbMatch) {
      const codAmb = codAmbMatch[1].replace(/;$/, '');
      const tipo = tipoMatch ? tipoMatch[1].trim() : '';
      const normLoc = normalizeLocation(codAmb, tipo);
      if (normLoc !== 'Sin asignar') {
         location = normLoc;
      }
    } else if (lugarMatch && location === 'Sin asignar') {
      // Fallback para cuando no hay COD. AMB. pero sí LUGAR
      location = lugarMatch[1].trim();
    }
    
    const dayName = entry.day.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents for DAY_MAP lookup
    const day = DAY_MAP[dayName] || DAY_MAP[entry.day.toLowerCase()];
    
    if (day) {
      entries.push({
        day,
        startTime: entry.startTime,
        endTime: entry.endTime,
        location,
      });
    }
  }
  
  return entries;
}

// ------------------------------------------------------------------
// IMAGE PARSING con Tesseract.js (OCR) — fallback
// ------------------------------------------------------------------
async function parseImage(base64Data: string, mimeType: string): Promise<ParseResult> {
  const Tesseract = await import('tesseract.js');
  
  const imageDataUrl = `data:${mimeType};base64,${base64Data}`;
  
  const result = await Tesseract.recognize(imageDataUrl, 'spa', {
    logger: (m: any) => {
      if (m.status === 'recognizing text') {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    }
  });
  
  const text = result.data.text;
  
  if (!text || text.trim().length < 20) {
    throw new Error('No se pudo extraer texto de la imagen. Asegúrate de que sea legible y contenga un horario válido.');
  }
  
  // Try to parse the OCR text using the same SGA format patterns
  return parseRawText(text);
}

// ------------------------------------------------------------------
// PARSE RAW TEXT (fallback for OCR or other text sources)
// ------------------------------------------------------------------
function parseRawText(text: string): ParseResult {
  const sessions: ClassSession[] = [];
  let faculty: string | undefined;
  let academicPeriod: string | undefined;
  
  // Extract metadata
  const facultyMatch = text.match(/FACULTAD:\s*(.+)/i);
  if (facultyMatch) faculty = `FACULTAD DE ${facultyMatch[1].trim().toUpperCase()}`;
  
  const periodoMatch = text.match(/PERIODO:\s*(.+)/i);
  if (periodoMatch) academicPeriod = normalizeAcademicPeriod(periodoMatch[1].trim());
  
  // Split text into blocks by finding subject patterns
  // Look for lines that seem like subject names (all caps, at the start of a block)
  const lines = text.split('\n');
  
  let currentSubject = '';
  let currentDocente = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Try to detect day+time patterns
    const dayTimeMatch = line.match(/-\s*(LUNES|MARTES|MI[EÉ]RCOLES|JUEVES|VIERNES)\s*\((\d{1,2}):(\d{2}):\d{2}-(\d{1,2}):(\d{2}):\d{2}\)/i);
    
    if (dayTimeMatch) {
      const dayName = dayTimeMatch[1].toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const day = DAY_MAP[dayName];
      
      if (day && currentSubject) {
        // Look ahead for location
        let location = 'Sin asignar';
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const codMatch = lines[j].match(/COD\.\s*AMB\.?:?\s*(\S+)/i);
          const tipoMatch = lines[j].match(/TIPO:\s*([^;]+)/i);
          if (codMatch) {
            location = normalizeLocation(codMatch[1].replace(/;$/, ''), tipoMatch?.[1]?.trim());
            break;
          }
        }
        
        sessions.push({
          id: crypto.randomUUID(),
          subject: currentSubject,
          day,
          startTime: `${dayTimeMatch[2].padStart(2, '0')}:${dayTimeMatch[3]}`,
          endTime: `${dayTimeMatch[4].padStart(2, '0')}:${dayTimeMatch[5]}`,
          teacher: currentDocente || 'Sin asignar',
          subject_faculty: faculty,
          location,
          conflict: false,
          color: '#3b82f6',
        });
      }
    }
    
    // Detect subject/docente lines (heuristic: all caps, substantial text, not a schedule line)
    if (line.length > 10 && /^[A-ZÁÉÍÓÚÜÑ\s()]+$/.test(line) && !line.includes('LUGAR:') && !line.includes('COD.') && !line.includes('LEYENDA')) {
      if (!line.includes('LUNES') && !line.includes('MARTES') && !line.includes('JUEVES') && !line.includes('VIERNES')) {
        currentSubject = line.replace(/\s*\([A-Z0-9]+\)\s*/g, '').trim();
      }
    }
  }
  
  return { sessions: resolveConflicts(sessions), faculty, academic_period: academicPeriod };
}

// ------------------------------------------------------------------
// RESOLUCIÓN DE CONFLICTOS DE HORARIO
// ------------------------------------------------------------------
function resolveConflicts(sessions: ClassSession[]): ClassSession[] {
  if (sessions.length <= 1) return sessions;
  
  const toRemove = new Set<string>();
  
  // Sort by start time so we predictably evaluate conflicts
  sessions.sort((a, b) => {
    if (a.day !== b.day) return a.day.localeCompare(b.day);
    return a.startTime.localeCompare(b.startTime);
  });
  
  for (let i = 0; i < sessions.length; i++) {
    if (toRemove.has(sessions[i].id)) continue;
    
    for (let j = i + 1; j < sessions.length; j++) {
      if (toRemove.has(sessions[j].id)) continue;
      
      const s1 = sessions[i];
      const s2 = sessions[j];
      
      if (s1.day === s2.day) {
        const timeToMins = (time: string) => {
          const [h, m] = time.split(':').map(Number);
          return h * 60 + m;
        };
        
        const start1 = timeToMins(s1.startTime);
        const end1 = timeToMins(s1.endTime);
        const start2 = timeToMins(s2.startTime);
        const end2 = timeToMins(s2.endTime);
        
        // Detect overlap
        if (start1 < end2 && start2 < end1) {
          s1.subject = `${s1.subject} "choque con la materia de ${s2.subject}"`;
          toRemove.add(s2.id);
        }
      }
    }
  }
  
  return sessions.filter(s => !toRemove.has(s.id));
}

// ------------------------------------------------------------------
// FUNCIÓN PRINCIPAL EXPORTADA (misma interfaz que el viejo servicio de IA)
// ------------------------------------------------------------------
export const parseScheduleFile = async (base64Data: string, mimeType: string): Promise<ParseResult> => {
  // Remove data URL prefix
  const cleanBase64 = base64Data.replace(/^data:(.*);base64,/, "");
  
  try {
    if (mimeType === 'application/pdf') {
      return await parsePDF(cleanBase64);
    } else if (mimeType.startsWith('image/')) {
      return await parseImage(cleanBase64, mimeType);
    } else {
      throw new Error(`Tipo de archivo no soportado: ${mimeType}`);
    }
  } catch (error: any) {
    console.error("Schedule Parse Error:", error);
    
    if (error.message?.includes('No se pudo') || error.message?.includes('Tipo de archivo')) {
      throw error;
    }
    
    throw new Error("Error al analizar el horario. Por favor asegúrate de que el archivo sea legible y contenga un horario válido.");
  }
};
