import React, { useState, useEffect } from 'react';
import { Calendar, X, Download, CheckCircle2, RefreshCw } from 'lucide-react';
import { syncScheduleToCalendar, initializeGoogleApi } from '../../services/googleCalendar';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  schedule: any; // The schedule to sync
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, onConfirm, schedule }) => {
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initializeGoogleApi().catch(err => console.error("Error inicializando Google API:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // Calculamos automáticamente en el fondo para evitar fricción UX
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7)); // Próximo lunes
    
    const end = new Date(start);
    end.setMonth(end.getMonth() + 4);
    end.setDate(end.getDate() + 15);
    
    onConfirm(start, end);
    onClose();
  };

  const handleGoogleSync = async () => {
    setSyncing(true);
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7)); 
    
    const end = new Date(start);
    end.setMonth(end.getMonth() + 4);
    end.setDate(end.getDate() + 15);

    try {
      const res = await syncScheduleToCalendar(schedule, start, end);
      if (res.success) {
        alert(res.message);
        onClose();
      } else {
        alert("Error: " + res.message);
      }
    } catch (e: any) {
      alert("Error en la sincronización.");
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
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleGoogleSync}
                disabled={syncing}
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