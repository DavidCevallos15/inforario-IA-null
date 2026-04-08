import React, { useState } from 'react';
import { Calendar, X, Download, CheckCircle2 } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  isSyncing?: boolean; // Kept for prop compatibility
}

const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose, onConfirm }) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-muted max-w-md w-full overflow-hidden">
        
        <div className="bg-muted p-5 border-b border-muted flex justify-between items-center">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <div className="bg-green-900/30 text-green-400 p-1.5 rounded-lg">
              <Calendar size={20} />
            </div>
            Exportar Archivo de Calendario
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
            <div className="mb-6 bg-primary/10 border border-primary/20 rounded-lg p-4">
              <h3 className="text-primary font-bold flex items-center gap-2 mb-2">
                 <CheckCircle2 size={18} />
                 Sincronización Universal
              </h3>
              <p className="text-sm text-foreground/90 mb-3 leading-relaxed">
                Descarga tu horario y llévalo a tu calendario de preferencia (Google Calendar, Apple Calendar, Outlook, etc.).
              </p>
              <p className="text-xs text-muted-foreground border-l-2 border-primary/50 pl-2">
                 Al abrir el archivo descargado, todas tus materias se programarán automáticamente en tu aplicación semana a semana hasta finalizar el ciclo.
              </p>
            </div>

            <button 
              onClick={handleSubmit}
              className="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            >
              <Download size={18} />
              Generar y Descargar (.ics)
            </button>
        </div>

      </div>
    </div>
  );
};

export default CalendarModal;