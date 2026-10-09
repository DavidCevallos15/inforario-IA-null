import React, { useMemo, useState } from 'react';
import { Schedule, DAYS, ClassSession } from '../../../types';
import { AlertTriangle, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

interface ScheduleListProps {
  schedule: Schedule;
  onResolveConflict: (session: ClassSession) => void;
}

const FALLBACK_COLOR = '#22C55E';

export const ScheduleList: React.FC<ScheduleListProps> = ({ schedule, onResolveConflict }) => {
  const [selected, setSelected] = useState<ClassSession | null>(null);

  const regularClasses = useMemo(
    () => schedule.sessions.filter((s) => !s.isVirtual && s.day && s.startTime && s.endTime),
    [schedule.sessions]
  );

  const virtualClasses = useMemo(
    () => schedule.sessions.filter((s) => s.isVirtual || !s.day || !s.startTime || !s.endTime),
    [schedule.sessions]
  );

  // Group regular sessions by day
  const sessionsByDay = useMemo(() => {
    const groups: Record<string, ClassSession[]> = {};
    DAYS.forEach(day => {
      groups[day] = [];
    });

    regularClasses.forEach(s => {
      if (s.day && groups[s.day]) {
        groups[s.day].push(s);
      }
    });

    // Sort sessions in each day by start time
    DAYS.forEach(day => {
      groups[day].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });

    return groups;
  }, [regularClasses]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
  };

  return (
    <div className="w-full flex flex-col gap-6 px-2">
      {/* Sessions grouped by day */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {DAYS.map(day => {
          const sessions = sessionsByDay[day];
          if (sessions.length === 0) return null;

          return (
            <div key={day} className="space-y-3">
              <h3 className="text-sm font-black text-on-surface/50 uppercase tracking-widest pl-2">
                {day}
              </h3>
              
              <div className="space-y-3">
                {sessions.map((session) => (
                  <motion.div
                    key={session.id}
                    variants={itemVariants}
                    onClick={() => setSelected(session)}
                    className={`
                      p-4 rounded-[1.5rem] bg-surface-container-lowest border border-outline-variant/15 flex gap-4 items-center justify-between cursor-pointer relative overflow-hidden transition-all duration-200 active:scale-[0.98] active:bg-surface-container-low
                      ${session.conflict ? 'border-l-error ring-1 ring-error/10' : ''}
                    `}
                    style={!session.conflict ? { borderLeft: `4px solid ${session.color || FALLBACK_COLOR}` } : { borderLeftWidth: '4px' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Clock size={12} className="text-primary-fixed" />
                          {session.startTime} - {session.endTime}
                        </span>
                        {session.conflict && (
                          <Badge variant="error" className="py-0.5 px-2 text-[9px]">
                            <AlertTriangle size={9} />
                            CHOQUE
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-bold text-on-surface text-sm md:text-base leading-snug break-words whitespace-normal text-left">
                        {session.subject}
                      </h4>

                      <div className="flex items-center gap-4 mt-2 text-xs text-on-surface-variant font-medium">
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <User size={12} className="text-outline" />
                          {session.teacher?.split(' ')[0] || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin size={12} className="text-outline" />
                          {session.location?.split(' - ')[0]}
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={18} className="text-on-surface-variant shrink-0" />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Virtual subjects */}
      {virtualClasses.length > 0 && (
        <Card className="bg-surface-container-low border border-outline-variant/30 rounded-[2rem] p-5 shadow-editorial">
          <h3 className="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
            Materias Virtuales
          </h3>
          <div className="space-y-3">
            {virtualClasses.map((session) => (
              <div
                key={session.id}
                onClick={() => setSelected(session)}
                className="p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 flex justify-between items-center cursor-pointer transition-transform duration-200 active:scale-[0.98]"
                style={{ borderLeft: `4px solid ${session.color || FALLBACK_COLOR}` }}
              >
                <div className="text-left min-w-0">
                  <h4 className="font-bold text-sm text-on-surface break-words whitespace-normal leading-tight">
                    {session.subject}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-1 font-medium truncate max-w-[200px]">
                    Docente: {session.teacher || 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-0.5 bg-primary-fixed/20 text-on-primary-fixed-variant text-[10px] rounded-full font-bold">
                    VIRTUAL
                  </span>
                  <ChevronRight size={16} className="text-on-surface-variant" />
                </div>
              </div>
            ))}
          </div>
        </Card>
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
                  Choque
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
                  <span className="text-on-surface text-base font-bold">{selected.day || 'Virtual / N/A'}</span>
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
                  <span className="text-on-surface text-base font-bold text-primary">{selected.floor || 'N/A'}</span>
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
                  Quitar del horario
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
export default ScheduleList;
