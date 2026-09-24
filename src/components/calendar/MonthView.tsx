import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from 'date-fns';
import clsx from 'clsx';
import { isoDate } from '../../utils/rotation';
import type { Assignment, CalendarEvent } from '../../types/database';

export function MonthView({
  month,
  assignments,
  events,
  displayMode,
  onDayClick,
}: {
  month: Date;
  assignments: Assignment[];
  events: CalendarEvent[];
  displayMode: 'detailed' | 'compact';
  onDayClick: (date: Date) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="overflow-hidden rounded-xl border border-slate/15">
      <div className="grid grid-cols-7 border-b border-slate/15 bg-slate/5 text-center text-[11px] font-medium text-slate">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = isoDate(day);
          const dayAssignments = assignments.filter((a) => a.due_date === key);
          const dayEvents = events.filter((e) => e.date === key);
          const items = dayAssignments.length + dayEvents.length;
          return (
            <button
              key={key}
              onClick={() => onDayClick(day)}
              className={clsx(
                'min-h-[64px] border-b border-r border-slate/10 p-1.5 text-left align-top last:border-r-0',
                !isSameMonth(day, month) && 'bg-slate/[0.03] text-slate/40'
              )}
            >
              <span
                className={clsx(
                  'inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px]',
                  isToday(day) && 'bg-teal font-semibold text-white'
                )}
              >
                {format(day, 'd')}
              </span>
              {displayMode === 'compact' ? (
                items > 0 && (
                  <div className="mt-1 flex gap-0.5">
                    {Array.from({ length: Math.min(items, 4) }).map((_, i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-teal/60" />
                    ))}
                  </div>
                )
              ) : (
                <div className="mt-1 space-y-0.5">
                  {dayAssignments.slice(0, 2).map((a) => (
                    <p key={a.id} className="truncate text-[10px] text-teal">
                      {a.name}
                    </p>
                  ))}
                  {dayEvents.slice(0, 2).map((e) => (
                    <p key={e.id} className="truncate text-[10px] text-slate">
                      {e.title}
                    </p>
                  ))}
                  {items > 2 && <p className="text-[10px] text-slate/60">+{items - 2} more</p>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
