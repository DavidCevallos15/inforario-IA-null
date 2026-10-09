import React from 'react';
import { ClassSession, DAYS } from '../../../types';
import { getScheduleHoursRange, layoutLanes, timeToMins, weekColumnTemplate } from '../../schedule/utils/timeSelectors';
import { DEFAULT_HIGHLIGHTER, inkOn } from '../../../lib/highlighters';
import { hyphenateEs } from '../../../lib/hyphenate';

const SHORT_DAY: Record<string, string> = {
  Lunes: 'Lun',
  Martes: 'Mar',
  'Miércoles': 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
};

const roomOf = (location: string) => location.split(' - ')[0];

/** Semana completa en la hoja cuadriculada (lado "después" en pantallas anchas). */
/** offsetPct: espacio a la izquierda que tapa el "antes" en reposo, para que la semana quede entera a la vista. */
export const DemoWeekGrid: React.FC<{ sessions: ClassSession[]; offsetPct?: number }> = ({ sessions, offsetPct = 0 }) => {
  const regular = sessions.filter((s) => s.day && s.startTime && s.endTime);
  const { minHour, maxHour } = getScheduleHoursRange(regular);
  const totalMins = (maxHour - minHour) * 60;
  const hours = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);
  const lanesByDay = Object.fromEntries(DAYS.map((day) => [day, layoutLanes(regular.filter((s) => s.day === day))]));
  const columns = weekColumnTemplate('40px', lanesByDay, DAYS);

  return (
    <div className="paper-grid absolute inset-0 flex flex-col p-4 text-on-surface" style={{ paddingLeft: `calc(${offsetPct}% + 16px)` }}>
      <div className="grid gap-x-2 pb-2" style={{ gridTemplateColumns: columns }}>
        <span />
        {DAYS.map((day) => (
          <span key={day} className="text-center text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            {SHORT_DAY[day]}
          </span>
        ))}
      </div>
      <div className="relative grid flex-1 gap-x-2" style={{ gridTemplateColumns: columns }}>
        <div className="relative">
          {hours.map((h, i) => (
            <time
              key={h}
              className="tabular absolute right-1 -translate-y-1/2 text-[10px] font-semibold text-on-surface-variant"
              style={{ top: `${(i / hours.length) * 100}%` }}
            >
              {String(h).padStart(2, '0')}:00
            </time>
          ))}
        </div>
        {DAYS.map((day) => {
          const lanes = lanesByDay[day];
          return (
          <div key={day} className="relative">
            {regular
              .filter((s) => s.day === day)
              .map((s) => {
                const { lane, lanes: laneCount } = lanes.get(s.id) ?? { lane: 0, lanes: 1 };
                const top = ((timeToMins(s.startTime!) - minHour * 60) / totalMins) * 100;
                const height = ((timeToMins(s.endTime!) - timeToMins(s.startTime!)) / totalMins) * 100;
                const color = s.color || DEFAULT_HIGHLIGHTER;
                return (
                  <div
                    key={s.id}
                    className={`absolute overflow-hidden rounded-sm p-1.5 shadow-editorial ${s.conflict ? 'outline outline-2 -outline-offset-2 outline-error' : ''}`}
                    style={{
                      top: `${top}%`,
                      height: `calc(${height}% - 3px)`,
                      left: `calc(${(lane / laneCount) * 100}% + 1px)`,
                      width: `calc(${100 / laneCount}% - 2px)`,
                      backgroundColor: color,
                      color: inkOn(color),
                    }}
                  >
                    <p className="line-clamp-3 text-[11px] font-bold leading-tight [hyphens:manual]">{hyphenateEs(s.subject)}</p>
                    <p className="tabular mt-0.5 text-[10px] font-semibold opacity-80">
                      {s.startTime}-{s.endTime}
                    </p>
                    <p className="truncate text-[10px] opacity-80">{roomOf(s.location)}</p>
                    {s.conflict && <p className="mt-0.5 text-[10px] font-extrabold text-error">Choque</p>}
                  </div>
                );
              })}
          </div>
          );
        })}
      </div>
    </div>
  );
};

/** La misma semana como lista por día (lado "después" en el celular). */
export const DemoDayList: React.FC<{ sessions: ClassSession[]; offsetPct?: number }> = ({ sessions, offsetPct = 0 }) => {
  const regular = sessions.filter((s) => s.day && s.startTime && s.endTime);
  const days = DAYS.filter((d) => regular.some((s) => s.day === d));

  return (
    <div className="paper-grid absolute inset-0 overflow-hidden py-3 pr-3 text-on-surface" style={{ paddingLeft: `calc(${offsetPct}% + 12px)` }}>
      {days.map((day) => (
        <section key={day} className="mb-3">
          <h4 className="ink mb-1 text-lg font-bold leading-6">{day}</h4>
          <ul className="space-y-1.5">
            {regular
              .filter((s) => s.day === day)
              .sort((a, b) => a.startTime!.localeCompare(b.startTime!))
              .map((s) => (
                <li key={s.id} className="grid grid-cols-[44px_1fr] items-start gap-2">
                  <time className="tabular pt-0.5 text-xs font-bold text-on-surface-variant">{s.startTime}</time>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[13px] font-bold leading-5">
                      <span className="highlight" style={{ ['--hl' as string]: s.color || DEFAULT_HIGHLIGHTER }}>
                        {s.subject}
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-on-surface-variant">{s.location}</p>
                    {s.conflict && <p className="text-[11px] font-extrabold text-error">Choque de horario</p>}
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
