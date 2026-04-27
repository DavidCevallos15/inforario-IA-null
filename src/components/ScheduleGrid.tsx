import React, { useMemo, useState } from 'react';
import { Schedule, DAYS, ClassSession, ScheduleTheme } from '../types';
import { AlertTriangle } from 'lucide-react';
import { ScheduleCard } from './ScheduleCard';
import { createPortal } from 'react-dom';

interface ScheduleGridProps {
  schedule: Schedule;
  isGuest: boolean;
  onResolveConflict: (session: ClassSession) => void;
  theme?: ScheduleTheme;
  fontScale?: number;
}

type ViewMode = 'grid' | 'list';

const hexToRgb = (hex: string) => {
  const cleaned = hex.replace('#', '').trim();
  if (cleaned.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }

  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);

  return { r, g, b };
};

const getTextColor = (bg: string) => {
  const { r, g, b } = hexToRgb(bg);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111111' : '#ffffff';
};

const FALLBACK_COLOR = '#22C55E';

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule, isGuest, onResolveConflict, theme = 'DEFAULT', fontScale = 1 }) => {
  const [selected, setSelected] = useState<ClassSession | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const regularClasses = useMemo(
    () => schedule.sessions.filter((s) => !s.isVirtual && s.day && s.startTime && s.endTime),
    [schedule.sessions]
  );

  const virtualClasses = useMemo(
    () => schedule.sessions.filter((s) => s.isVirtual || !s.day || !s.startTime || !s.endTime),
    [schedule.sessions]
  );

  const sortedListClasses = useMemo(() => {
    return [...regularClasses].sort((a, b) => {
      if (!a.day || !b.day) return 0;
      if (a.day !== b.day) return DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }, [regularClasses]);

  const { minHour, maxHour } = useMemo(() => {
    if (regularClasses.length === 0) {
      return { minHour: 7, maxHour: 18 };
    }
    let min = 24;
    let max = 0;
    regularClasses.forEach((s) => {
      if (!s.startTime || !s.endTime) return;
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
  }, [regularClasses]);

  const hours = Array.from({ length: maxHour - minHour }, (_, i) => i + minHour);

  const getPosition = (session: ClassSession) => {
    if (!session.startTime || !session.endTime) {
      return { top: '0px', height: '80px' };
    }
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
          container: 'bg-white border-2 border-black rounded-none shadow-none overflow-hidden',
          header: 'bg-black text-white border-r border-gray-800',
          timeCol: 'bg-white text-black border-r-2 border-black font-serif',
          gridBg: 'bg-white',
          gridLine: 'border-gray-200',
          dayCol: 'border-r border-gray-200',
          event: (color: string) => {
            const textColor = getTextColor(color);
            return {
              className: 'border-2 border-black rounded-none shadow-none',
              style: {
                backgroundColor: color,
                color: textColor,
                borderLeftColor: textColor,
                borderLeftWidth: '4px',
              },
            };
          },
        };
      case 'SCHOOL':
        return {
          container: 'bg-[#fffdf0] border-4 border-orange-300 rounded-3xl shadow-xl overflow-hidden',
          header: 'bg-orange-100 text-orange-800 border-r border-orange-200',
          timeCol: 'bg-[#fffdf0] text-orange-600 border-r-2 border-orange-200 border-dashed',
          gridBg: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]',
          gridLine: 'border-orange-100 border-dashed',
          dayCol: 'border-r-2 border-orange-200 border-dashed',
          event: (color: string) => {
            const textColor = getTextColor(color);
            return {
              className: 'rounded-xl border-2 border-slate-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-medium',
              style: {
                backgroundColor: color,
                color: textColor,
                borderLeftColor: textColor,
                borderLeftWidth: '4px',
              },
            };
          },
        };
      case 'NEON':
        return {
          container: 'bg-slate-900 border border-cyan-500/50 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)] overflow-hidden',
          header: 'bg-slate-950 text-cyan-400 border-r border-cyan-900',
          timeCol: 'bg-slate-900 text-cyan-600 border-r border-cyan-900',
          gridBg: 'bg-slate-900',
          gridLine: 'border-cyan-900/30',
          dayCol: 'border-r border-cyan-900/50',
          event: (color: string) => {
            const textColor = getTextColor(color);
            return {
              className: 'border border-cyan-400 rounded-sm shadow-[0_0_10px_rgba(6,182,212,0.3)] backdrop-blur-sm',
              style: {
                backgroundColor: color,
                color: textColor,
                borderLeftColor: textColor,
                borderLeftWidth: '4px',
              },
            };
          },
        };
      case 'DEFAULT':
      default:
        // Academic Curator DEFAULT — verde menta
        return {
          container: 'bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden editorial-shadow',
          header: 'bg-surface-container-high text-on-surface border-r border-outline-variant/15',
          timeCol: 'bg-surface-container-lowest text-on-surface-variant border-r border-outline-variant/15',
          gridBg: 'bg-surface-container-lowest',
          gridLine: 'border-outline-variant/15',
          dayCol: 'border-r border-outline-variant/15',
          event: (color: string) => {
            const textColor = getTextColor(color);
            return {
              className: 'rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-editorial',
              style: {
                backgroundColor: color,
                color: textColor,
                borderLeftColor: textColor,
                borderLeftWidth: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              },
            };
          },
        };
    }
  };

  const styles = getThemeStyles();

  const headerFontSize = 12 * fontScale;
  const timeFontSize = 12 * fontScale;
  const detailsFontSize = 11 * fontScale;

  const safeSlice = (value?: string, len = 3) => {
    return value ? value.slice(0, len) : '';
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={() => setViewMode('grid')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            viewMode === 'grid'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          Grid
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            viewMode === 'list'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          Lista
        </button>
      </div>

      {viewMode === 'list' && (
        <div className="flex flex-col gap-4">
          {sortedListClasses.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-xl shadow bg-surface-container-lowest border border-outline-variant/20 border-l-4"
              style={{ borderLeftColor: session.color || FALLBACK_COLOR }}
            >
              <h3 className="text-sm font-semibold leading-snug break-words whitespace-normal">{session.subject}</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                {session.day} · {session.startTime} - {session.endTime}
              </p>
              <p className="text-xs text-on-surface-variant mt-1 break-words whitespace-normal">
                {session.location} {session.floor && session.floor !== 'N/A' ? `· Piso ${session.floor}` : ''}
              </p>
            </div>
          ))}

          {virtualClasses.length > 0 && (
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4">
              <h3 className="text-sm font-bold text-on-surface mb-3">Materias Virtuales / Sin Horario Fijo</h3>
              <div className="flex flex-col gap-3">
                {virtualClasses.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 border-l-4"
                    style={{ borderLeftColor: session.color || FALLBACK_COLOR }}
                  >
                    <p className="text-sm font-semibold leading-tight break-words whitespace-normal">{session.subject}</p>
                    <p className="text-xs text-on-surface-variant mt-1 break-words whitespace-normal">
                      Docente: {session.teacher || 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[900px]">
            <div className={`w-full ${styles.container}`}>
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
                      className={`p-2 text-center font-bold uppercase tracking-wider flex items-center justify-center ${styles.header}`}
                      style={{ fontSize: `${headerFontSize}px` }}
                    >
                      <span className="md:hidden">{safeSlice(day, 1)}</span>
                      <span className="hidden md:inline">{safeSlice(day, 3)}</span>
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
                      {regularClasses
                        .filter((s) => s.day === day)
                        .map((session) => {
                          const pos = getPosition(session);
                          const eventStyles = styles.event(session.color || FALLBACK_COLOR);

                          return (
                            <div
                              key={session.id}
                              className="absolute w-[94%] left-[3%] z-10"
                              style={{ ...pos }}
                            >
                              {session.conflict && (
                                <div className="absolute top-1 right-1 text-error z-20">
                                  <AlertTriangle size={12} />
                                </div>
                              )}
                              <ScheduleCard
                                session={session}
                                className={`h-full ${session.conflict ? '!border-l-error !bg-error-container' : eventStyles.className}`}
                                style={{ ...eventStyles.style, fontSize: `${detailsFontSize}px` }}
                                onClick={() => {
                                  if (session.conflict) {
                                    onResolveConflict(session);
                                  }
                                  setSelected(session);
                                }}
                              />
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'grid' && virtualClasses.length > 0 && (
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            Materias Virtuales / Sin Horario Fijo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {virtualClasses.map((session) => (
              <div
                key={session.id}
                className="bg-surface-container-lowest p-4 rounded-lg shadow-sm border border-outline-variant/20 border-l-4"
                style={{ borderLeftColor: session.color || FALLBACK_COLOR }}
              >
                <h4 className="font-bold text-sm text-on-surface break-words whitespace-normal leading-tight">{session.subject}</h4>
                <p className="text-xs text-on-surface-variant mt-1 break-words whitespace-normal leading-tight">
                  Docente: {session.teacher || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4 break-words whitespace-normal leading-tight">{selected.subject}</h2>
              <div className="space-y-2 text-sm text-gray-800">
                <p><strong>Docente:</strong> {selected.teacher || 'N/A'}</p>
                <p>
                  <strong>Hora:</strong>{' '}
                  {selected.startTime && selected.endTime
                    ? `${selected.startTime} - ${selected.endTime}`
                    : 'Sin horario definido'}
                </p>
                <p><strong>Lugar:</strong> {selected.location || 'N/A'}</p>
                <p className="text-blue-600 font-semibold"><strong>Piso:</strong> {selected.floor || 'N/A'}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ScheduleGrid;