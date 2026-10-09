import React from 'react';
import { ClassSession } from '../../../types';
import { DEFAULT_HIGHLIGHTER } from '../../../lib/highlighters';

/** Materias sin horario fijo: a lápiz y punteadas, porque no tienen un lugar en la semana. */
export const UnscheduledList: React.FC<{ sessions: ClassSession[]; onSelect: (s: ClassSession) => void }> = ({ sessions, onSelect }) => (
  <section aria-labelledby="sin-horario-title">
    <h3 id="sin-horario-title" className="text-lg font-extrabold text-on-surface">
      Sin horario fijo
    </h3>
    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
      {sessions.map((session) => (
        <li key={session.id}>
          <button
            type="button"
            onClick={() => onSelect(session)}
            className="pencil-dashed flex w-full flex-col items-start gap-1 rounded bg-surface-container-lowest/70 px-4 py-3 text-left transition-colors duration-150 hover:bg-surface-container-lowest"
          >
            <span className="font-extrabold leading-tight text-on-surface">
              <span className="highlight" style={{ ['--hl' as string]: session.color || DEFAULT_HIGHLIGHTER }}>
                {session.subject}
              </span>
            </span>
            <span className="text-sm text-on-surface-variant">
              {session.isVirtual ? 'Virtual' : 'Horario no asignado en el SGU'}
              {session.teacher && session.teacher !== 'Sin asignar' ? ` · ${session.teacher}` : ''}
            </span>
          </button>
        </li>
      ))}
    </ul>
  </section>
);

export default UnscheduledList;
