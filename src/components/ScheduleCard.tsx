import { ClassSession } from '../types';
import type { CSSProperties } from 'react';

interface ScheduleCardProps {
  session: ClassSession;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export const ScheduleCard = ({ session, className, style, onClick }: ScheduleCardProps) => {
  return (
    <div
      onClick={onClick}
      className={`p-3 md:p-4 rounded-lg cursor-pointer transition-all duration-200 border-l-4 min-h-[72px] hover:shadow-editorial ${className || ''}`}
      style={style}
    >
      <h4 className="font-semibold leading-tight break-words whitespace-normal text-[1em]">
        {session.subject || 'Materia sin nombre'}
      </h4>
      <p className="mt-1 leading-tight break-words whitespace-normal text-[0.85em] opacity-80">
        {session.startTime && session.endTime
          ? `${session.startTime} - ${session.endTime}`
          : 'Sin horario'}
      </p>
    </div>
  );
};
