import React, { useState } from 'react';
import { Calendar, Trash2, Plus, ArrowLeft, Check, CheckSquare } from 'lucide-react';
import { UserProfile } from '../types';

interface ScheduleSummary {
  id: string;
  title: string;
  academic_period?: string;
  last_updated: string;
}

interface ScheduleListProps {
  user?: UserProfile;
  schedules: ScheduleSummary[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onLogout?: () => void;
  onCreateNew: () => void;
  onBack?: () => void;
}

const ScheduleList: React.FC<ScheduleListProps> = ({
  user,
  schedules,
  onOpen,
  onDelete,
  onBulkDelete,
  onLogout,
  onCreateNew,
  onBack,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === schedules.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(schedules.map((s) => s.id));
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteSelected = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-on-surface-variant hover:text-on-surface transition-colors"
              title="Volver"
            >
              <ArrowLeft size={22} />
            </button>
          )}
          <div>
            <h2 className="headline-md text-on-surface">Mis Horarios</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              <span className="inline-flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed-variant px-2.5 py-0.5 rounded-full text-xs font-semibold">
                {schedules.length} guardados
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedIds.length > 0 && onBulkDelete && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 text-on-error bg-error hover:bg-red-700 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm"
              id="schedule-list-bulk-delete-btn"
            >
              <Trash2 size={15} />
              Eliminar ({selectedIds.length})
            </button>
          )}

          {schedules.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors text-sm font-medium
                ${selectedIds.length === schedules.length
                  ? 'text-on-primary-fixed-variant bg-primary-fixed'
                  : 'text-on-surface-variant bg-surface-container hover:bg-surface-container-high'}`}
              title="Seleccionar todos"
              id="schedule-list-select-all-btn"
            >
              <CheckSquare size={16} />
              <span className="hidden sm:inline">Seleccionar</span>
            </button>
          )}

          <button
            onClick={onCreateNew}
            id="schedule-list-new-btn"
            className="flex items-center gap-2 bg-secondary-container text-on-secondary-container hover:scale-105 active:scale-95 px-5 py-2 rounded-full text-sm font-bold transition-transform duration-200 shadow-editorial"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Schedule items */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="text-center py-12 bg-surface-container-low rounded-xl flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center mb-4 text-on-primary-fixed-variant">
              <Calendar size={30} />
            </div>
            <h4 className="text-lg font-bold text-on-surface mb-2">Sin horarios guardados</h4>
            <p className="text-on-surface-variant mb-6 max-w-xs mx-auto text-sm">
              Carga un PDF de tu horario del SGA para comenzar.
            </p>
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-secondary-container text-on-secondary-container rounded-xl text-sm font-bold shadow-editorial hover:scale-105 transition-transform duration-200 flex items-center gap-2"
            >
              <Plus size={16} />
              Crear Horario
            </button>
          </div>
        ) : (
          schedules.map((schedule) => {
            const isSelected = selectedIds.includes(schedule.id);
            const lastUpdatedDate = new Date(schedule.last_updated);
            const formattedDate = !isNaN(lastUpdatedDate.getTime())
              ? lastUpdatedDate.toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })
              : 'Fecha desconocida';

            return (
              <div
                key={schedule.id}
                onClick={() => onOpen(schedule.id)}
                className={`
                  bg-surface-container-lowest rounded-xl p-4 transition-all duration-300 cursor-pointer group flex items-center gap-4 relative overflow-hidden
                  ${isSelected
                    ? 'shadow-editorial-lg ring-2 ring-primary/20'
                    : 'editorial-shadow hover:shadow-editorial-lg'
                  }
                `}
              >
                {/* Custom Checkbox */}
                <div
                  onClick={(e) => { e.stopPropagation(); toggleSelection(schedule.id); }}
                  className={`
                    w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 z-10
                    ${isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-surface-container border-outline-variant hover:border-primary/60'
                    }
                  `}
                >
                  {isSelected && <Check size={12} className="text-on-primary" />}
                </div>

                {/* Ícono */}
                <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center text-on-primary-fixed-variant shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <Calendar size={22} />
                </div>

                {/* Contenido */}
                <div className="flex-grow min-w-0">
                  <h4 className="font-bold text-on-surface text-base truncate group-hover:text-primary transition-colors duration-200">
                    {schedule.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider mt-0.5">
                    {schedule.academic_period || `Actualizado: ${formattedDate}`}
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDeleteClick(e, schedule.id)}
                    type="button"
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg transition-colors z-20"
                    title="Eliminar horario"
                    aria-label={`Eliminar ${schedule.title}`}
                  >
                    <Trash2 size={16} />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); onOpen(schedule.id); }}
                    type="button"
                    className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-surface-container text-on-surface-variant font-semibold rounded-full hover:bg-surface-container-high transition-colors text-sm z-20"
                  >
                    Abrir
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mobile FAB */}
      {schedules.length > 0 && !selectedIds.length && (
        <button
          onClick={onCreateNew}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-secondary-container text-on-secondary-container rounded-full shadow-editorial-lg flex items-center justify-center z-40 hover:scale-110 transition-transform active:scale-95"
          id="schedule-list-fab"
          aria-label="Crear nuevo horario"
        >
          <Plus size={26} />
        </button>
      )}
    </div>
  );
};

export default ScheduleList;