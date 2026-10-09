import { useState } from 'react';
import { ClassSession, Schedule } from '../../../types';
import { extractScheduleWithAI, saveScheduleToDB } from '../../../services/supabase/supabaseClient';
import { assignSubjectColors, parseSguTextItems, ParseResult, resolveConflicts } from '../utils/sguRegexParser';
import { loadPdfTextItems, textItemsToPlainText } from '../utils/pdfText';

interface UseScheduleUploadProps {
  deviceId: string | null;
  onSuccess: (schedule: Schedule) => void;
}

/**
 * PDF: se extrae el texto una sola vez. La IA obtiene las sesiones (con el
 * parser local como respaldo) y los metadatos del encabezado (facultad,
 * período) siempre se leen localmente, porque la IA no los devuelve.
 */
const parsePdfSchedule = async (file: File): Promise<ParseResult> => {
  const items = await loadPdfTextItems(await file.arrayBuffer());

  let local: ParseResult | null = null;
  try {
    local = parseSguTextItems(items);
  } catch (localError) {
    console.warn('El parser local falló.', localError);
  }

  let sessions: ClassSession[] = [];
  try {
    sessions = await extractScheduleWithAI(textItemsToPlainText(items));
  } catch (edgeError) {
    console.warn('La extracción con Edge Function falló, usando parser local.', edgeError);
    sessions = local?.sessions ?? [];
  }

  return { ...local, sessions };
};

export const useScheduleUpload = ({ deviceId, onSuccess }: UseScheduleUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const uploadFile = async (file: File): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      if (file.type !== 'application/pdf') {
        throw new Error(`Tipo de archivo no soportado: ${file.type || 'desconocido'}`);
      }
      const parsed = await parsePdfSchedule(file);

      if (parsed.sessions.length === 0) {
        throw new Error('No se encontraron materias en el documento. Verifica que sea el reporte de horarios del SGU.');
      }

      const newSchedule: Schedule = {
        title: 'Mi Horario Académico',
        sessions: resolveConflicts(assignSubjectColors(parsed.sessions)),
        lastUpdated: new Date(),
        academic_period: parsed.academic_period,
        faculty: parsed.faculty,
      };

      // saveScheduleToDB ignora a los invitados (deviceId no UUID)
      if (deviceId) {
        const saved = await saveScheduleToDB(deviceId, newSchedule);
        if (saved?.[0]) {
          newSchedule.id = saved[0].id;
        }
      }

      onSuccess(newSchedule);
    } catch (err: unknown) {
      const msg = err instanceof Error && err.message ? err.message : 'No se pudo procesar el documento.';
      setError(msg);
      console.error(err);
      throw err instanceof Error ? err : new Error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    error,
    uploadFile,
    clearError,
  };
};
