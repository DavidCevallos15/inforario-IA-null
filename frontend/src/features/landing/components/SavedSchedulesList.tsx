import React, { useState } from 'react';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { ScheduleSummary } from '../../../types';

interface SavedSchedulesListProps {
  schedules: ScheduleSummary[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onCreateNew: () => void;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Índice de horarios guardados, como la primera hoja del cuaderno. */
export const SavedSchedulesList: React.FC<SavedSchedulesListProps> = ({ schedules, onOpen, onDelete, onBulkDelete, onCreateNew }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allSelected = schedules.length > 0 && selectedIds.length === schedules.length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-on-surface-variant">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelectedIds(allSelected ? [] : schedules.map((s) => s.id))}
            className="h-4 w-4 accent-[rgb(var(--c-primary))]"
          />
          {schedules.length} {schedules.length === 1 ? 'horario' : 'horarios'}
        </label>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && onBulkDelete && (
            <button
              type="button"
              onClick={() => {
                onBulkDelete(selectedIds);
                setSelectedIds([]);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-error px-3 py-2 text-sm font-bold text-error transition-colors hover:bg-error hover:text-on-error"
            >
              <Trash2 size={15} /> Eliminar {selectedIds.length}
            </button>
          )}
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-editorial transition-colors hover:bg-primary-container"
          >
            <Plus size={16} /> Nuevo horario
          </button>
        </div>
      </div>

      <ul className="divide-y divide-outline-variant">
        {schedules.map((schedule) => {
          const date = formatDate(schedule.last_updated);
          const checked = selectedIds.includes(schedule.id);
          return (
            <li key={schedule.id} className={`flex items-center gap-3 py-1 ${checked ? 'bg-primary-fixed/40' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(schedule.id)}
                aria-label={`Seleccionar ${schedule.title}`}
                className="ml-1 h-4 w-4 shrink-0 accent-[rgb(var(--c-primary))]"
              />
              <button
                type="button"
                onClick={() => onOpen(schedule.id)}
                className="group flex min-w-0 flex-1 items-center gap-3 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-extrabold text-on-surface transition-colors group-hover:text-primary">
                    {schedule.title}
                  </span>
                  <span className="block truncate text-sm text-on-surface-variant">
                    {[schedule.academic_period, date && `actualizado el ${date}`].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <ChevronRight size={18} className="shrink-0 text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(schedule.id)}
                className="rounded-md p-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-error"
                aria-label={`Eliminar ${schedule.title}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SavedSchedulesList;
