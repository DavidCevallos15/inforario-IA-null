import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CircleAlert } from 'lucide-react';
import { ClassSession, DAYS, Schedule } from '../../../types';
import { getScheduleHoursRange, layoutLanes, timeToMins, weekColumnTemplate } from '../utils/timeSelectors';
import { getLiveSessionId, getTimeState, todayOf } from '../utils/timeState';
import { DEFAULT_HIGHLIGHTER, inkOn } from '../../../lib/highlighters';
import { useNow } from '../../../hooks/useNow';
import { hyphenateEs } from '../../../lib/hyphenate';
import { ease } from '../../../lib/motion';
import { Modal } from '../../../components/ui/Modal';
import { SessionDetail } from './SessionDetail';
import { UnscheduledList } from './UnscheduledList';

interface ScheduleGridProps {
  schedule: Schedule;
  onResolveConflict: (session: ClassSession) => void;
  fontScale?: number;
}

// Una hora ocupa 3 cuadros de la hoja (3 × 24 px): la cuadrícula del papel coincide con las horas
const CELL = 24;
const HOUR_PX = CELL * 3;

/** Semana en la hoja cuadriculada: columnas de lunes a viernes, clases marcadas con resaltador. */
export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule, onResolveConflict, fontScale = 1 }) => {
  const [selected, setSelected] = useState<ClassSession | null>(null);
  const reduce = useReducedMotion();
  const now = useNow();

  const regular = useMemo(
    () => schedule.sessions.filter((s) => !s.isVirtual && s.day && s.startTime && s.endTime),
    [schedule.sessions]
  );
  const unscheduled = useMemo(
    () => schedule.sessions.filter((s) => s.isVirtual || !s.day || !s.startTime || !s.endTime),
    [schedule.sessions]
  );

  const { minHour, maxHour } = useMemo(() => getScheduleHoursRange(regular), [regular]);
  // Clases que se cruzan: lado a lado, cada una con su hora real; su día se ensancha
  const lanesByDay = useMemo(
    () => Object.fromEntries(DAYS.map((day) => [day, layoutLanes(regular.filter((s) => s.day === day))])),
    [regular]
  );
  const columns = weekColumnTemplate('56px', lanesByDay, DAYS);
  const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);
  const live = getLiveSessionId(regular, now);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const today = todayOf(now);
  const hourPx = Math.round(HOUR_PX * Math.max(1, fontScale));

  return (
    <div className="flex w-full flex-col gap-10">
      <div className="no-scrollbar w-full overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Días */}
          <div // Sin sticky: dentro de un contenedor con scroll horizontal, top-16 desplazaba la fila sobre las clases
            className="grid gap-x-1.5 border-b border-outline-variant bg-surface-container-lowest pb-2 pt-1"
            style={{ gridTemplateColumns: columns }}
          >
            <span />
            {DAYS.map((day) => (
              <div key={day} className="text-center">
                <span
                  className={`ink relative inline-block px-1 text-xl font-bold ${day === today ? 'text-on-surface' : ''}`}
                  aria-current={day === today ? 'date' : undefined}
                >
                  {day === today && <span aria-hidden className="absolute inset-x-0 -bottom-0.5 h-1.5 rounded-full bg-hl-yellow" />}
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Cuerpo: la cuadrícula del papel alineada a las horas */}
          <div className="paper-grid relative grid gap-x-1.5" style={{ gridTemplateColumns: columns, ['--grid-size' as string]: `${hourPx / 3}px` }}>
            <div className="relative">
              {hours.map((h, i) => (
                <time
                  key={h}
                  className="tabular absolute right-2 -translate-y-1/2 bg-surface-container-lowest px-0.5 text-xs font-bold text-on-surface-variant first:translate-y-0"
                  style={{ top: i * hourPx }}
                >
                  {String(h).padStart(2, '0')}:00
                </time>
              ))}
            </div>

            {DAYS.map((day, dayIndex) => {
              const lanes = lanesByDay[day];
              return (
              <div key={day} className="relative" style={{ height: hours.length * hourPx }}>
                {/* Línea de "ahora": tinta azul a la hora actual, solo en la columna de hoy */}
                {day === today && nowMins >= minHour * 60 && nowMins < maxHour * 60 && (
                  <div aria-hidden className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: ((nowMins - minHour * 60) / 60) * hourPx }}>
                    <span className="-ml-1 h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="h-0.5 flex-1 bg-primary" />
                  </div>
                )}
                {regular
                  .filter((s) => s.day === day)
                  .sort((a, b) => a.startTime!.localeCompare(b.startTime!))
                  .map((session, i) => {
                    const start = timeToMins(session.startTime!);
                    const top = ((start - minHour * 60) / 60) * hourPx;
                    const height = ((timeToMins(session.endTime!) - start) / 60) * hourPx;
                    const color = session.color || DEFAULT_HIGHLIGHTER;
                    const state = getTimeState(session, now, live);
                    const { lane, lanes: laneCount } = lanes.get(session.id) ?? { lane: 0, lanes: 1 };

                    return (
                      <motion.button
                        key={session.id}
                        type="button"
                        onClick={() => setSelected(session)}
                        // La semana se "escribe" celda por celda al aparecer
                        initial={reduce ? false : { opacity: 0.4, y: 6 }}
                        animate={{ opacity: state === 'past' ? 0.45 : 1, y: 0 }}
                        transition={{ duration: 0.32, ease: ease.disclosure, delay: reduce ? 0 : dayIndex * 0.05 + i * 0.03 }}
                        whileTap={{ scale: 0.98 }}
                        className={`group absolute flex flex-col overflow-hidden rounded-sm p-2 text-left shadow-editorial transition-shadow duration-150 hover:shadow-editorial-lg ${
                          session.conflict ? 'outline outline-2 -outline-offset-2 outline-error' : ''
                        } ${state === 'now' ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface-container-lowest' : ''}`}
                        style={{
                          top: top + 1,
                          height: height - 2,
                          left: `calc(${(lane / laneCount) * 100}% + 2px)`,
                          width: `calc(${100 / laneCount}% - 4px)`,
                          backgroundColor: color,
                          color: inkOn(color),
                          fontSize: `${13 * fontScale}px`,
                        }}
                        aria-label={`${session.subject}, ${session.day} de ${session.startTime} a ${session.endTime}, ${session.location}`}
                      >
                        {(state === 'now' || state === 'next') && (
                          <span className="mb-1 self-start rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-primary">
                            {state === 'now' ? 'Ahora' : 'Siguiente'}
                          </span>
                        )}
                        {/* Guiones suaves por sílaba y puntos suspensivos: ninguna palabra se corta en el borde del bloque */}
                        <span className={`line-clamp-3 font-extrabold leading-tight [hyphens:manual] ${session.conflict ? 'pr-6' : ''}`}>{hyphenateEs(session.subject)}</span>
                        <time className="tabular mt-1 text-[0.85em] font-bold opacity-80">
                          {session.startTime} - {session.endTime}
                        </time>
                        <span className="mt-auto truncate pt-1 text-[0.85em] font-semibold opacity-80">
                          {session.location.split(' - ').slice(0, 2).join(' · ')}
                        </span>
                        {session.conflict && (
                          <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-error text-on-error" title="Choque de horario">
                            <CircleAlert size={14} strokeWidth={2.5} />
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {unscheduled.length > 0 && <UnscheduledList sessions={unscheduled} onSelect={setSelected} />}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalle de la clase">
        {selected && <SessionDetail session={selected} onClose={() => setSelected(null)} onRemove={onResolveConflict} />}
      </Modal>
    </div>
  );
};

export default ScheduleGrid;
