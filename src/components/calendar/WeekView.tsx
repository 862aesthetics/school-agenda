import { startOfWeek, addDays, format, isToday } from 'date-fns';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import { getDaySchedule, type ScheduleContextData } from '../../utils/schedule';
import { isoDate } from '../../utils/rotation';
import { formatTime } from '../../utils/format';
import type { Assignment, CalendarEvent, TimeFormat } from '../../types/database';

export function WeekView({
  week,
  scheduleCtx,
  assignments,
  events,
  timeFormat,
  onAssignmentClick,
  onEventClick,
  onAddEvent,
}: {
  week: Date;
  scheduleCtx: ScheduleContextData;
  assignments: Assignment[];
  events: CalendarEvent[];
  timeFormat?: TimeFormat;
  onAssignmentClick: (a: Assignment) => void;
  onEventClick: (e: CalendarEvent) => void;
  onAddEvent: (date: string) => void;
}) {
  const start = startOfWeek(week);
  const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-7 sm:gap-2 sm:overflow-visible sm:px-0">
      {days.map((day) => {
        const key = isoDate(day);
        const { result, segments } = getDaySchedule(day, scheduleCtx);
        const dayAssignments = assignments.filter((a) => a.due_date === key);
        const dayEvents = events.filter((e) => e.date === key);
        const teachingSegments = segments.filter((s) => s.kind !== 'free');

        return (
          <div key={key} className="w-[180px] shrink-0 rounded-xl border border-slate/15 sm:w-auto">
            <div
              className={clsx(
                'flex items-center justify-between rounded-t-xl border-b border-slate/10 px-2.5 py-2',
                isToday(day) ? 'bg-teal/10' : 'bg-slate/5'
              )}
            >
              <div>
                <p className="text-[11px] font-medium text-slate">{format(day, 'EEE')}</p>
                <p className={clsx('text-sm font-semibold', isToday(day) ? 'text-teal' : 'text-ink')}>{format(day, 'd')}</p>
              </div>
              <button onClick={() => onAddEvent(key)} className="rounded p-1 text-slate hover:bg-white" aria-label="Add event">
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-1.5 p-2">
              {result.kind === 'no_school' || result.kind === 'weekend' ? (
                <p className="text-[11px] text-slate/60">No school</p>
              ) : (
                teachingSegments.map((s) => (
                  <div key={s.key} className="rounded-lg bg-navy/[0.04] px-2 py-1">
                    <p className="truncate text-[11px] font-medium text-ink">{s.kind === 'lunch' ? 'Lunch' : s.className}</p>
                    <p className="text-[10px] text-slate">{formatTime(s.start, timeFormat)}</p>
                  </div>
                ))
              )}

              {dayAssignments.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onAssignmentClick(a)}
                  className="block w-full rounded-lg bg-teal/10 px-2 py-1 text-left text-[11px] font-medium text-teal"
                >
                  {a.name}
                </button>
              ))}
              {dayEvents.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onEventClick(e)}
                  className="block w-full rounded-lg bg-slate/10 px-2 py-1 text-left text-[11px] font-medium text-ink"
                >
                  {e.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
