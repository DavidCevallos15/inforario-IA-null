import React, { useState, useEffect } from 'react';
import { Calendar, X, Download, CheckCircle2, RefreshCw } from 'lucide-react';
import { Schedule } from '../../types';
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

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, onConfirm, schedule, isLoggedIn }) => {
  const [syncing, setSyncing] = useState(false);
  const {
    isLinked,
    isLoading: statusLoading,
    error: statusError,
    refreshStatus,
  } = useCalendarStatus();

  useEffect(() => {
    if (isOpen) {
      void refreshStatus();
    }
  }, [isOpen, refreshStatus]);

  if (!isOpen) return null;

  // Fechas derivadas del período del SGU (o un ciclo estándar si no se reconoce)
  const { start, end } = getSemesterRange(schedule.academic_period);
  const formatDate = (d: Date) => d.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleSubmit = () => {
    onConfirm(start, end);
    onClose();
  };

  const handleGoogleSync = async () => {
    if (!isLoggedIn) return;

    const events = buildCalendarEventsFromSchedule(schedule, start, end);
    if (!events.length) {
      alert('No hay clases presenciales sin choque de horario para sincronizar.');
      return;
    }
    if (!confirm(`Se agregarán ${events.length} clases semanales a tu calendario principal de Google. ¿Continuar?`)) {
      return;
    }

    setSyncing(true);
    try {
      // Primera vez: abrir el consentimiento de Google y vincular la cuenta
      if (!isLinked) {
        await connectGoogleCalendar();
        await refreshStatus();
      }

      const res = await syncCalendarEvents({ events, calendarId: 'primary' });
      alert(res.success ? res.message : `Error: ${res.message}`);
      if (res.success) onClose();
    } catch (syncError: unknown) {
      alert(syncError instanceof Error ? syncError.message : 'Error en la sincronización.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-3xl shadow-editorial border border-outline-variant/15 max-w-md w-full overflow-hidden">
        
        <div className="bg-surface-container p-5 border-b border-outline-variant/15 flex justify-between items-center">
          <div className="flex items-center gap-2 text-on-surface font-bold">
            <div className="bg-primary-fixed text-on-primary-fixed-variant p-2 rounded-xl">
              <Calendar size={20} />
            </div>
            Exportar Archivo de Calendario
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface bg-surface-container-high p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
            <div className="mb-6 bg-primary/10 border border-primary/20 rounded-xl p-4">
              <h3 className="text-primary font-bold flex items-center gap-2 mb-2">
                 <CheckCircle2 size={18} />
                 Sincronización Universal
              </h3>
              <p className="text-sm text-on-surface-variant mb-3 leading-relaxed">
                Descarga tu horario y llévalo a tu calendario de preferencia (Google Calendar, Apple Calendar, Outlook, etc.).
              </p>
              <p className="text-xs text-on-surface-variant border-l-2 border-primary/50 pl-2">
                 Al abrir el archivo descargado, todas tus materias se programarán automáticamente en tu aplicación semana a semana hasta finalizar el ciclo.
              </p>
              <p className="text-xs font-semibold text-on-surface mt-3">
                Clases del {formatDate(start)} al {formatDate(end)}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleGoogleSync}
                disabled={!isLoggedIn || syncing || statusLoading}
                className="w-full py-3 bg-surface-container text-on-surface border border-outline-variant/15 font-bold rounded-xl hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
              >
                {syncing ? <RefreshCw size={18} className="animate-spin" /> : (
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Sincronizar con Google Calendar
              </button>

              {!isLoggedIn && (
                <p className="text-xs text-on-surface-variant px-1">Inicia sesión para sincronizar directamente con Google Calendar.</p>
              )}
              {isLoggedIn && !statusLoading && !isLinked && (
                <p className="text-xs text-on-surface-variant px-1">La primera vez se abrirá Google para autorizar el acceso a tu calendario.</p>
              )}

              {statusError && (
                <p className="text-xs text-error px-1">{statusError}</p>
              )}
              
              <button 
                onClick={handleSubmit}
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-editorial"
              >
                <Download size={18} />
                Generar y Descargar (.ics)
              </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CalendarModal;