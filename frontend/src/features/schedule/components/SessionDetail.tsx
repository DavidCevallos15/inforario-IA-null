import React from 'react';
import { CircleAlert, Clock, MapPin, UserRound } from 'lucide-react';
import { ClassSession } from '../../../types';
import { DEFAULT_HIGHLIGHTER } from '../../../lib/highlighters';

interface SessionDetailProps {
  session: ClassSession;
  onClose: () => void;
  onRemove: (session: ClassSession) => void;
}

const Row: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div className="grid grid-cols-[24px_1fr] gap-3 border-b border-outline-variant py-3 last:border-b-0">
    <span className="pt-0.5 text-on-surface-variant">{icon}</span>
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-0.5 text-base font-semibold leading-6 text-on-surface">{children}</p>
    </div>
  </div>
);

/** Detalle de una clase dentro del diálogo. */
export const SessionDetail: React.FC<SessionDetailProps> = ({ session, onClose, onRemove }) => {
  const hasSchedule = session.day && session.startTime && session.endTime;

  return (
    <div>
      <h2 className="text-2xl font-extrabold leading-tight tracking-[-0.02em] text-on-surface">
        <span className="highlight" style={{ ['--hl' as string]: session.color || DEFAULT_HIGHLIGHTER }}>
          {session.subject}
        </span>
      </h2>

      {session.conflict && (
        <p className="mt-3 flex items-start gap-2 rounded bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">
          <CircleAlert size={18} className="mt-0.5 shrink-0 text-error" />
          Se cruza con otra clase. Si te inscribiste en las dos, una tendrá que salir del horario.
        </p>
      )}

      <div className="mt-4 rounded bg-surface-container-lowest px-4">
        <Row icon={<Clock size={18} />} label="Cuándo">
          {hasSchedule ? (
            <>
              {session.day}, <time className="tabular">{session.startTime} a {session.endTime}</time>
            </>
          ) : session.isVirtual ? (
            'Materia virtual'
          ) : (
            'Sin horario asignado en el SGU'
          )}
        </Row>
        <Row icon={<MapPin size={18} />} label="Dónde">
          {session.location || 'Sin asignar'}
        </Row>
        <Row icon={<UserRound size={18} />} label="Docente">
          {session.teacher || 'Sin asignar'}
        </Row>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
        {session.conflict && (
          <button
            type="button"
            onClick={() => {
              onRemove(session);
              onClose();
            }}
            className="flex-1 rounded-md border border-error px-4 py-3 text-sm font-bold text-error transition-colors hover:bg-error hover:text-on-error"
          >
            Quitar del horario
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary-container"
        >
          Listo
        </button>
      </div>
    </div>
  );
};

export default SessionDetail;
