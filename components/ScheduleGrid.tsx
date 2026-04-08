import React, { useMemo } from 'react';
import { Schedule, DAYS, ClassSession, ScheduleTheme } from '../types';
import { AlertTriangle, Clock, MapPin, User, Building2 } from 'lucide-react';

interface ScheduleGridProps {
  schedule: Schedule;
  isGuest: boolean;
  onResolveConflict: (session: ClassSession) => void;
  theme?: ScheduleTheme;
  fontScale?: number;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ schedule, isGuest, onResolveConflict, theme = 'DEFAULT', fontScale = 1 }) => {
  // Determine grid range dynamically based on content
  const { minHour, maxHour } = useMemo(() => {
    if (schedule.sessions.length === 0) {
      return { minHour: 7, maxHour: 18 }; // Default view if empty
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
    // Add +1 buffer to max to ensure the closing time label is visible at the bottom of the last block
    const finalMax = Math.max(finalMin + 4, max + 1); 

    return { minHour: finalMin, maxHour: finalMax };
  }, [schedule]);

  const hours = Array.from({ length: maxHour - minHour }, (_, i) => i + minHour);

  // Helper to calculate position
  const getPosition = (session: ClassSession) => {
    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);
    
    const startOffset = (startH - minHour) * 60 + startM;
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    
    return {
      top: `${(startOffset / 60) * 80}px`, // 80px height per hour
      height: `${(duration / 60) * 80}px`
    };
  };

  // Theme Styles Configuration
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
            style: { borderLeftWidth: '4px', borderLeftColor: color } // Only colored indicator
          })
        };
      case 'SCHOOL':
        return {
          container: 'bg-[#fffdf0] border-4 border-orange-300 rounded-3xl shadow-xl', // Cream paper look
          header: 'bg-orange-100 text-orange-800 border-r border-orange-200 font-comic', // Playful header
          timeCol: 'bg-[#fffdf0] text-orange-600 border-r-2 border-orange-200 border-dashed',
          gridBg: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]', // Dot grid
          gridLine: 'border-orange-100 border-dashed',
          dayCol: 'border-r-2 border-orange-200 border-dashed',
          event: (color: string) => ({
            className: 'rounded-xl border-2 border-slate-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-slate-900 font-medium',
            style: { backgroundColor: color } // Full color block
          })
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
             style: { borderLeftColor: color, borderLeftWidth: '4px' }
          })
        };
      case 'DEFAULT':
      default:
        // Updated Default to match Cyberpunk/Dark palette
        return {
          container: 'bg-card rounded-xl shadow-lg border border-muted',
          header: 'bg-muted text-foreground border-r border-muted',
          timeCol: 'bg-card text-muted-foreground border-r border-muted',
          gridBg: 'bg-card',
          gridLine: 'border-muted/50',
          dayCol: 'border-r border-muted',
          event: (color: string) => ({
            className: 'bg-card border-l-2 md:border-l-4 text-foreground rounded-sm md:rounded-md shadow-sm border-t border-r border-b border-white/5',
            style: { backgroundColor: `${color}20`, borderColor: color } // Low opacity bg, strong border
          })
        };
    }
  };

  const styles = getThemeStyles();

  // Dynamic font sizes
  const headerFontSize = 12 * fontScale;
  const timeFontSize = 12 * fontScale;
  const subjectFontSize = 13 * fontScale; // Mobile base approx 11, Desktop 13
  const detailsFontSize = 11 * fontScale;

  // Spanish Day Mapping for Header
  const dayMap: Record<string, string> = {
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes'
  };

  return (
    <div className={`w-full overflow-hidden ${styles.container}`}>
      <div className="relative w-full">
        {/* Header Days */}
        <div className="grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr] border-b border-gray-700 sticky top-0 z-20">
          <div className={`p-2 text-center font-semibold flex items-center justify-center ${styles.header}`} style={{ fontSize: `${headerFontSize}px` }}>
            HORA
          </div>
          {DAYS.map(day => (
            <div key={day} className={`p-2 text-center font-bold uppercase tracking-wider flex items-center justify-center overflow-hidden ${styles.header}`} style={{ fontSize: `${headerFontSize}px` }}>
              <span className="md:hidden">{dayMap[day].slice(0, 1)}</span>
              <span className="hidden md:inline">{dayMap[day].slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className={`grid grid-cols-[50px_1fr_1fr_1fr_1fr_1fr] relative ${styles.gridBg}`}>
          {/* Time Labels */}
          <div className={`z-10 ${styles.timeCol}`}>
            {hours.map(h => (
              <div key={h} className={`h-[80px] border-b p-1 text-right pr-2 ${styles.gridLine} flex items-start justify-end pt-2`} style={{ fontSize: `${timeFontSize}px` }}>
                {h}:00
              </div>
            ))}
          </div>

          {DAYS.map(day => (
            <div key={day} className={`relative ${styles.dayCol}`}>
               {/* Background lines */}
               {hours.map(h => (
                  <div key={`${day}-${h}`} className={`h-[80px] border-b ${styles.gridLine}`}></div>
                ))}
                
                {/* Classes for this day */}
                {schedule.sessions
                  .filter(s => s.day === day)
                  .map(session => {
                    const pos = getPosition(session);
                    const eventStyles = styles.event(session.color || '#00F0FF');
                    
                    return (
                      <div
                        key={session.id}
                        className={`absolute w-[94%] left-[3%] p-1.5 md:p-2 transition-all cursor-pointer group overflow-hidden flex flex-col z-10 ${eventStyles.className} ${session.conflict ? '!bg-red-900/50 !border-destructive !text-white z-30' : ''}`}
                        style={{ ...pos, ...eventStyles.style }}
                        onClick={() => session.conflict && onResolveConflict(session)}
                      >
                        <div className="flex flex-col h-full px-0.5">
                          <span 
                            className="font-bold leading-tight break-words whitespace-normal uppercase" 
                            title={session.subject}
                            style={{ fontSize: `${subjectFontSize}px` }}
                          >
                            {session.subject}
                          </span>

                          {session.subject_faculty && (
                             <span className="truncate uppercase mt-0.5 opacity-90" style={{ fontSize: `${detailsFontSize}px` }} title={session.subject_faculty}>
                               {session.subject_faculty}
                             </span>
                          )}
                          
                          <span className="whitespace-nowrap mt-1 opacity-90 font-medium" style={{ fontSize: `${detailsFontSize}px` }}>
                             {session.startTime}-{session.endTime}
                          </span>
                          
                          <span className="truncate mt-0.5 opacity-90" style={{ fontSize: `${detailsFontSize}px` }}>
                            {session.location}
                          </span>
                          
                          <span className="truncate mt-0.5 opacity-90" style={{ fontSize: `${detailsFontSize}px` }}>
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