import React, { useMemo } from 'react';
import { Schedule, DAYS, ClassSession, ScheduleTheme } from '../types';
import { AlertTriangle } from 'lucide-react';

interface ScheduleGridProps {
  schedule: Schedule;
  isGuest: boolean;
  onResolveConflict: (session: ClassSession) => void;
  theme?: ScheduleTheme;
  fontScale?: number;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule, isGuest, onResolveConflict, theme = 'DEFAULT', fontScale = 1 }) => {
  const { minHour, maxHour } = useMemo(() => {
    if (schedule.sessions.length === 0) {
      return { minHour: 7, maxHour: 18 };
    }
    let min = 24;
    let max = 0;
    schedule.sessions.forEach((s) => {
      const startH = parseInt(s.startTime.split(':')[0]);
      const [endHStr, endMStr] = s.endTime.split(':');
      const endH = parseInt(endHStr);
      const endM = parseInt(endMStr);
      if (startH < min) min = startH;
      let effectiveEnd = endH;
      if (endM > 0) effectiveEnd += 1;
      if (effectiveEnd > max) max = effectiveEnd;
    });
    const finalMin = Math.max(6, min);
    const finalMax = Math.max(finalMin + 4, max + 1);
    return { minHour: finalMin, maxHour: finalMax };
  }, [schedule]);

  const hours = Array.from({ length: maxHour - minHour }, (_, i) => i + minHour);

  const getPosition = (session: ClassSession) => {
    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);
    const startOffset = (startH - minHour) * 60 + startM;
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    return {
      top: `${(startOffset / 60) * 80}px`,
      height: `${(duration / 60) * 80}px`,
    };
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'MINIMALIST':
        return {
          container: 'bg-white border-2 border-black rounded-none shadow-none',
          header: 'bg-black text-white border-r border-gray-800',
          timeCol: 'bg-white text-black border-r-2 border-black font-serif',
          gridBg: 'bg-white',
          gridLine: 'border-gray-200',
          dayCol: 'border-r border-gray-200',
          event: (color: string) => ({
            className: 'bg-white border-2 border-black text-black rounded-none shadow-none hover:bg-gray-50',
            style: { borderLeftWidth: '4px', borderLeftColor: color },
          }),
        };
      case 'SCHOOL':
        return {
          container: 'bg-[#fffdf0] border-4 border-orange-300 rounded-3xl shadow-xl',
          header: 'bg-orange-100 text-orange-800 border-r border-orange-200',
          timeCol: 'bg-[#fffdf0] text-orange-600 border-r-2 border-orange-200 border-dashed',
          gridBg: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]',
          gridLine: 'border-orange-100 border-dashed',
          dayCol: 'border-r-2 border-orange-200 border-dashed',
          event: (color: string) => ({
            className: 'rounded-xl border-2 border-slate-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-slate-900 font-medium',
            style: { backgroundColor: color },
          }),
        };
      case 'NEON':
        return {
          container: 'bg-slate-900 border border-cyan-500/50 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)]',
          header: 'bg-slate-950 text-cyan-400 border-r border-cyan-900',
          timeCol: 'bg-slate-900 text-cyan-600 border-r border-cyan-900',
          gridBg: 'bg-slate-900',
          gridLine: 'border-cyan-900/30',
          dayCol: 'border-r border-cyan-900/50',
          event: (color: string) => ({
            className: 'bg-slate-900/90 border border-cyan-400 text-cyan-300 rounded-sm shadow-[0_0_10px_rgba(6,182,212,0.3)] backdrop-blur-sm',
            style: { borderLeftColor: color, borderLeftWidth: '4px' },
          }),
        };
      case 'DEFAULT':
      default:
        // Academic Curator DEFAULT — verde menta
        return {
          container: 'bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow',
          header: 'bg-surface-container-high text-on-surface border-r border-outline-variant/15',
          timeCol: 'bg-surface-container-lowest text-on-surface-variant border-r border-outline-variant/15',
          gridBg: 'bg-surface-container-lowest',
          gridLine: 'border-outline-variant/15',
          dayCol: 'border-r border-outline-variant/15',
          event: (_color: string) => ({
            className: 'rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-editorial',
            style: {
              backgroundColor: '#a1f5b8',
              color: '#00522a',
              borderLeft: '4px solid #004925',
              boxShadow: '0 4px 12px rgba(0,73,37,0.08)',
            },
          }),
        };
    }
  };

  const styles = getThemeStyles();

  const headerFontSize = 12 * fontScale;
  const timeFontSize = 12 * fontScale;
  const subjectFontSize = 13 * fontScale;
  const detailsFontSize = 11 * fontScale;

  const dayMap: Record<string, string> = {
    Monday: 'Lunes',
    Tuesday: 'Martes',
    Wednesday: 'Miércoles',
    Thursday: 'Jueves',
    Friday: 'Viernes',
  };

  return (
    <div className={`w-full overflow-hidden ${styles.container}`}>
      <div className="relative w-full">
        {/* Header Days */}
        <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr] sticky top-0 z-20">
          <div
            className={`p-2 text-center font-semibold flex items-center justify-center ${styles.header}`}
            style={{ fontSize: `${headerFontSize}px` }}
          >
            HORA
          </div>
          {DAYS.map((day) => (
            <div
              key={day}
              className={`p-2 text-center font-bold uppercase tracking-wider flex items-center justify-center overflow-hidden ${styles.header}`}
              style={{ fontSize: `${headerFontSize}px` }}
            >
              <span className="md:hidden">{dayMap[day].slice(0, 1)}</span>
              <span className="hidden md:inline">{dayMap[day].slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className={`grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr] relative ${styles.gridBg}`}>
          {/* Time column */}
          <div className={`z-10 ${styles.timeCol}`}>
            {hours.map((h) => (
              <div
                key={h}
                className={`h-[80px] border-b p-1 text-right pr-2 ${styles.gridLine} flex items-start justify-end pt-2`}
                style={{ fontSize: `${timeFontSize}px` }}
              >
                {h}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day) => (
            <div key={day} className={`relative ${styles.dayCol}`}>
              {hours.map((h) => (
                <div key={`${day}-${h}`} className={`h-[80px] border-b ${styles.gridLine}`} />
              ))}

              {/* Classes */}
              {schedule.sessions
                .filter((s) => s.day === day)
                .map((session) => {
                  const pos = getPosition(session);
                  const eventStyles = styles.event(session.color || '#a1f5b8');

                  return (
                    <div
                      key={session.id}
                      className={`absolute w-[94%] left-[3%] p-1.5 md:p-2 cursor-pointer group overflow-hidden flex flex-col z-10 ${eventStyles.className}
                        ${session.conflict ? '!bg-error-container !border-l-4 !border-error z-30' : ''}`}
                      style={{ ...pos, ...eventStyles.style }}
                      onClick={() => session.conflict && onResolveConflict(session)}
                      title={session.subject}
                    >
                      {session.conflict && (
                        <div className="absolute top-1 right-1 text-error">
                          <AlertTriangle size={12} />
                        </div>
                      )}
                      <div className="flex flex-col h-full px-0.5">
                        <span
                          className="font-bold leading-tight break-words whitespace-normal uppercase"
                          style={{ fontSize: `${subjectFontSize}px` }}
                        >
                          {session.subject}
                        </span>

                        {session.subject_faculty && (
                          <span
                            className="truncate uppercase mt-0.5 opacity-80"
                            style={{ fontSize: `${detailsFontSize}px` }}
                            title={session.subject_faculty}
                          >
                            {session.subject_faculty}
                          </span>
                        )}

                        <span
                          className="whitespace-nowrap mt-1 font-medium opacity-90"
                          style={{ fontSize: `${detailsFontSize}px` }}
                        >
                          {session.startTime}–{session.endTime}
                        </span>

                        <span
                          className="truncate mt-0.5 opacity-80"
                          style={{ fontSize: `${detailsFontSize}px` }}
                        >
                          {session.location}
                        </span>

                        <span
                          className="truncate mt-0.5 opacity-80"
                          style={{ fontSize: `${detailsFontSize}px` }}
                        >
                          {session.teacher}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleGrid;