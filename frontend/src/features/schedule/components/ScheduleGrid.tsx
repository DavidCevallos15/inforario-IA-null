import React, { useMemo, useState } from 'react';
import { Schedule, DAYS, ClassSession, ScheduleTheme } from '../../../types';
import { AlertTriangle } from 'lucide-react';
import { SubjectCard } from './SubjectCard';
import { createPortal } from 'react-dom';
import { getScheduleHoursRange, getScheduleHoursRange as calcHoursRange } from '../utils/timeSelectors';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

interface ScheduleGridProps {
  schedule: Schedule;
  isGuest: boolean;
  onResolveConflict: (session: ClassSession) => void;
  theme?: ScheduleTheme;
  fontScale?: number;
}

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

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  schedule,
  isGuest,
  onResolveConflict,
  theme = 'DEFAULT',
  fontScale = 1,
}) => {
  const [selected, setSelected] = useState<ClassSession | null>(null);

  const regularClasses = useMemo(
    () => schedule.sessions.filter((s) => !s.isVirtual && s.day && s.startTime && s.endTime),
    [schedule.sessions]
  );

  const virtualClasses = useMemo(
    () => schedule.sessions.filter((s) => s.isVirtual || !s.day || !s.startTime || !s.endTime),
    [schedule.sessions]
  );

  const { minHour, maxHour } = useMemo(() => {
    return calcHoursRange(regularClasses);
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
      top: `${(startOffset / 60) * 82}px`, // slightly padded
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
        // Academic Cyber Portal DEFAULT — oscuro
        return {
          container: 'bg-surface-container-lowest rounded-[2rem] border border-outline/40 overflow-hidden editorial-shadow p-2',
          header: 'bg-surface-container-high text-on-surface border-r border-outline/30 font-bold rounded-xl py-3 m-1',
          timeCol: 'bg-surface-container-lowest text-on-surface-variant border-r border-outline/30',
          gridBg: 'bg-surface-container-lowest cyber-grid',
          gridLine: 'border-outline/25',
          dayCol: 'border-r border-outline/25',
          event: (color: string) => {
            const textColor = getTextColor(color);
            return {
              className: 'rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:shadow-editorial-lg',
              style: {
                backgroundColor: color,
                color: textColor,
                borderLeftColor: textColor,
                borderLeftWidth: '4px',
                boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
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
      <div className="w-full overflow-x-auto no-scrollbar">
        <div className="min-w-[900px] p-1">
          <div className={`w-full ${styles.container}`}>
            <div className="relative w-full">
              {/* Header Days */}
              <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr] sticky top-0 z-20">
                <div
                  className={`text-center font-bold flex items-center justify-center ${styles.header}`}
                  style={{ fontSize: `${headerFontSize}px` }}
                >
                  HORA
                </div>
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className={`text-center uppercase tracking-wider flex items-center justify-center ${styles.header}`}
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
                      className={`h-[82px] border-b p-1 text-right pr-3 ${styles.gridLine} flex items-start justify-end pt-2 font-medium`}
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
                      <div key={`${day}-${h}`} className={`h-[82px] border-b ${styles.gridLine}`} />
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
                              <div className="absolute top-2 right-2 text-error z-20 animate-pulse bg-error-container p-1 rounded-full border border-error/20">
                                <AlertTriangle size={14} />
                              </div>
                            )}
                            <SubjectCard
                              session={session}
                              className={`h-full ${session.conflict ? '!border-l-error !bg-error-container/85 !ring-2 !ring-error/20' : eventStyles.className}`}
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

      {virtualClasses.length > 0 && (
        <div className="bg-surface-container-low border border-outline/40 rounded-[2rem] p-6 shadow-editorial">
          <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            Materias Virtuales / Sin Horario Fijo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {virtualClasses.map((session) => (
              <div
                key={session.id}
                className="bg-surface-container p-4 rounded-2xl border border-outline/40 border-l-4 hover:border-primary/40 hover:shadow-editorial transition-all"
                style={{ borderLeftColor: session.color || FALLBACK_COLOR }}
                onClick={() => setSelected(session)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelected(session)}
              >
                <h4 className="font-bold text-sm text-on-surface break-words whitespace-normal leading-tight">{session.subject}</h4>
                <p className="text-xs text-on-surface-variant mt-1.5 break-words whitespace-normal leading-tight font-medium">
                  Docente: {session.teacher || 'N/A'}
                </p>
                <div className="mt-2 inline-block px-2.5 py-0.5 bg-success-container border border-primary/30 text-primary-fixed text-[10px] rounded-full font-bold">
                  VIRTUAL
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="text-left">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-4">
              <h2 className="text-xl font-bold text-on-surface break-words whitespace-normal leading-tight pr-6">
                {selected.subject}
              </h2>
              {selected.conflict && (
                <span className="flex items-center gap-1 bg-error-container text-on-error-container px-3 py-1 rounded-full text-xs font-bold shrink-0 border border-error/20">
                  <AlertTriangle size={12} />
                  Choque de hora
                </span>
              )}
            </div>

            <div className="space-y-4 text-sm text-on-surface-variant font-medium">
              <div className="flex flex-col gap-1 p-3 bg-surface-container-low rounded-xl">
                <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Docente</span>
                <span className="text-on-surface text-base font-bold">{selected.teacher || 'Sin Asignar'}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 p-3 bg-surface-container-low rounded-xl">
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Día</span>
                  <span className="text-on-surface text-base font-bold">{selected.day || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-surface-container-low rounded-xl">
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Horario</span>
                  <span className="text-on-surface text-base font-bold">
                    {selected.startTime && selected.endTime ? `${selected.startTime} - ${selected.endTime}` : 'Virtual'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 p-3 bg-surface-container-low rounded-xl">
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Lugar</span>
                  <span className="text-on-surface text-base font-bold">{selected.location || 'Virtual'}</span>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-surface-container-low rounded-xl">
                  <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Piso</span>
                  <span className="text-base font-bold text-primary-fixed">{selected.floor || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {selected.conflict && (
                <Button
                  variant="primary"
                  onClick={() => {
                    onResolveConflict(selected);
                    setSelected(null);
                  }}
                  className="flex-1 text-sm py-3"
                >
                  Resolver Conflicto
                </Button>
              )}
              <Button
                variant={selected.conflict ? "ghost" : "secondary"}
                onClick={() => setSelected(null)}
                className="flex-1 text-sm py-3"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
