import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CircleAlert, MapPin } from 'lucide-react';
import { ClassSession, Schedule } from '../../../types';
import { daysWithClasses, getLiveSessionId, getTimeState, todayOf } from '../utils/timeState';
import { DEFAULT_HIGHLIGHTER } from '../../../lib/highlighters';
import { useNow } from '../../../hooks/useNow';
import { ease } from '../../../lib/motion';
import { Modal } from '../../../components/ui/Modal';
import { SessionDetail } from './SessionDetail';
import { UnscheduledList } from './UnscheduledList';

interface ScheduleListProps {
  schedule: Schedule;
  onResolveConflict: (session: ClassSession) => void;
  fontScale?: number;
}

/** La semana como apuntes por día: pensada para consultarse con una mano, caminando. */
export const ScheduleList: React.FC<ScheduleListProps> = ({ schedule, onResolveConflict, fontScale = 1 }) => {
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

  const days = daysWithClasses(regular);
  const today = todayOf(now);
  const live = getLiveSessionId(regular, now);
  let order = 0;

  return (
    <div className="flex w-full flex-col gap-8" style={{ fontSize: `${16 * fontScale}px` }}>
      {days.map((day) => (
        <section key={day} aria-labelledby={`dia-${day}`}>
          <h3 id={`dia-${day}`} className="ink relative inline-block text-2xl font-bold leading-8">
            {day === today && <span aria-hidden className="absolute inset-x-0 -bottom-0.5 h-1.5 rounded-full bg-hl-yellow" />}
            {day === today ? `Hoy, ${day.toLowerCase()}` : day}
          </h3>
          <ol className="mt-2 divide-y divide-outline-variant">
            {regular
              .filter((s) => s.day === day)
              .sort((a, b) => a.startTime!.localeCompare(b.startTime!))
              .map((session) => {
                const state = getTimeState(session, now, live);
                const index = order++;
                return (
                  <motion.li
                    key={session.id}
                    initial={reduce ? false : { opacity: 0.4, x: -6 }}
                    animate={{ opacity: state === 'past' ? 0.5 : 1, x: 0 }}
                    transition={{ duration: 0.32, ease: ease.disclosure, delay: reduce ? 0 : index * 0.035 }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(session)}
                      className="grid w-full grid-cols-[3.25em_1fr] gap-3 py-3 text-left transition-colors duration-150 active:bg-surface-container"
                    >
                      <span className="pt-0.5">
                        <time className="tabular block text-[0.95em] font-extrabold text-on-surface">{session.startTime}</time>
                        <time className="tabular block text-[0.8em] font-semibold text-on-surface-variant">{session.endTime}</time>
                      </span>
                      <span className="min-w-0">
                        {(state === 'now' || state === 'next') && (
                          <span className="mb-1 inline-block rounded-sm bg-primary px-1.5 py-0.5 text-[0.65em] font-bold uppercase tracking-wide text-on-primary">
                            {state === 'now' ? 'Ahora' : 'Siguiente'}
                          </span>
                        )}
                        <span className="block font-extrabold leading-snug text-on-surface">
                          <span className="highlight" style={{ ['--hl' as string]: session.color || DEFAULT_HIGHLIGHTER }}>
                            {session.subject}
                          </span>
                        </span>
                        <span className="mt-1 flex items-start gap-1.5 text-[0.85em] leading-snug text-on-surface-variant">
                          <MapPin size={14} className="mt-0.5 shrink-0" />
                          <span>{session.location}</span>
                        </span>
                        {session.conflict && (
                          <span className="mt-1.5 flex items-center gap-1.5 text-[0.85em] font-bold text-error">
                            <CircleAlert size={14} strokeWidth={2.5} />
                            Choque de horario
                          </span>
                        )}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
          </ol>
        </section>
      ))}

      {unscheduled.length > 0 && <UnscheduledList sessions={unscheduled} onSelect={setSelected} />}

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Detalle de la clase">
        {selected && <SessionDetail session={selected} onClose={() => setSelected(null)} onRemove={onResolveConflict} />}
      </Modal>
    </div>
  );
};

export default ScheduleList;
