import React, { useEffect, useState } from 'react';
import { CalendarSync, CircleAlert, CircleCheck, Download, RefreshCw } from 'lucide-react';
import { Schedule } from '../../types';
import { Modal } from '../ui/Modal';
import { useCalendarStatus } from '../../hooks/useCalendarStatus';
import { buildCalendarEventsFromSchedule, syncCalendarEvents } from '../../services/google/googleCalendarEdge';
import { connectGoogleCalendar } from '../../services/google/googleCalendarConnect';
import { getSemesterRange } from '../../services/ics/semesterRange';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  schedule: Schedule;
  isLoggedIn: boolean;
}

type Notice = { kind: 'ok' | 'error'; text: string } | null;

const formatDate = (d: Date) => d.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, onConfirm, schedule, isLoggedIn }) => {
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const { isLinked, isLoading: statusLoading, refreshStatus } = useCalendarStatus();

  useEffect(() => {
    if (isOpen) {
      setNotice(null);
      void refreshStatus();
    }
  }, [isOpen, refreshStatus]);

  // Fechas derivadas del período del SGU (o un ciclo estándar si no se reconoce)
  const { start, end } = getSemesterRange(schedule.academic_period);
  const events = buildCalendarEventsFromSchedule(schedule, start, end);

  const handleDownload = () => {
    onConfirm(start, end);
    setNotice({ kind: 'ok', text: 'Archivo descargado. Ábrelo para añadir tus clases a tu calendario.' });
  };

  const handleGoogleSync = async () => {
    if (!isLoggedIn || !events.length) return;
    setSyncing(true);
    setNotice(null);
    try {
      // Primera vez: abrir el consentimiento de Google y vincular la cuenta
      if (!isLinked) {
        await connectGoogleCalendar();
        await refreshStatus();
      }
      const res = await syncCalendarEvents({ events, calendarId: 'primary' });
      setNotice({ kind: res.success ? 'ok' : 'error', text: res.message });
    } catch (syncError: unknown) {
      setNotice({ kind: 'error', text: syncError instanceof Error ? syncError.message : 'No se pudo sincronizar con Google Calendar.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Llévalo a tu calendario" size="sm">
      <p className="text-base leading-7 text-on-surface-variant">
        Cada clase se repite semana a semana del{' '}
        <span className="font-bold text-on-surface">{formatDate(start)}</span> al{' '}
        <span className="font-bold text-on-surface">{formatDate(end)}</span>.
      </p>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3.5 text-sm font-bold text-on-primary shadow-editorial transition-colors hover:bg-primary-container"
        >
          <Download size={18} />
          Descargar archivo .ics
        </button>
        <p className="text-center text-xs text-on-surface-variant">Funciona con Google Calendar, Apple Calendar y Outlook.</p>

        <div className="pt-3">
          <button
            type="button"
            onClick={handleGoogleSync}
            disabled={!isLoggedIn || syncing || statusLoading || !events.length}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-sm font-bold text-on-surface transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing ? <RefreshCw size={18} className="animate-spin" /> : <CalendarSync size={18} />}
            Sincronizar con Google Calendar
          </button>
          <p className="mt-2 text-center text-xs leading-5 text-on-surface-variant">
            {!isLoggedIn
              ? 'Inicia sesión para sincronizar directamente con Google.'
              : !events.length
                ? 'No hay clases presenciales sin choque para sincronizar.'
                : isLinked
                  ? `Se agregarán ${events.length} clases a tu calendario principal.`
                  : 'La primera vez se abrirá Google para que autorices el acceso.'}
          </p>
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className={`mt-5 flex items-start gap-2 rounded px-3 py-2.5 text-sm font-semibold ${
            notice.kind === 'ok' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-error-container text-on-error-container'
          }`}
        >
          {notice.kind === 'ok' ? <CircleCheck size={18} className="mt-0.5 shrink-0" /> : <CircleAlert size={18} className="mt-0.5 shrink-0" />}
          {notice.text}
        </p>
      )}
    </Modal>
  );
};

export default CalendarModal;
