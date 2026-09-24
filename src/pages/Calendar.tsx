import { useState } from 'react';
import { addMonths, addWeeks, format, isToday, subMonths, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSupabaseTable } from '../hooks/useSupabaseTable';
import { useScheduleContext } from '../hooks/useScheduleContext';
import { MonthView } from '../components/calendar/MonthView';
import { WeekView } from '../components/calendar/WeekView';
import { EventModal } from '../components/calendar/EventModal';
import { AssignmentForm } from '../components/assignments/AssignmentForm';
import { Modal } from '../components/ui/Modal';
import { EmptyState, SkeletonList } from '../components/ui/primitives';
import { formatDate, formatTime } from '../utils/format';
import { isoDate } from '../utils/rotation';
import type { Assignment, CalendarEvent, Period, Priority } from '../types/database';

type ViewMode = 'month' | 'week';
type DisplayMode = 'detailed' | 'compact';

export default function CalendarPage() {
  const { profile, activeSchoolYear } = useAppStore();
  const schoolYearId = activeSchoolYear?.id ?? null;
  const scheduleCtx = useScheduleContext(schoolYearId);
  const { rows: periods } = useSupabaseTable<Period>('periods', 'school_year_id', schoolYearId);
  const { rows: assignments, loading: aLoading, update: updateAssignment, remove: removeAssignment } = useSupabaseTable<Assignment>(
    'assignments',
    'school_year_id',
    schoolYearId
  );
  const { rows: events, loading: eLoading, insert: insertEvent, update: updateEvent, remove: removeEvent } = useSupabaseTable<CalendarEvent>(
    'calendar_events',
    'school_year_id',
    schoolYearId
  );

  const [view, setView] = useState<ViewMode>('month');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('detailed');
  const [cursor, setCursor] = useState(new Date());
  const [dayDetail, setDayDetail] = useState<Date | null>(null);
  const [eventModal, setEventModal] = useState<{ date: string; initial?: CalendarEvent } | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  function goPrev() {
    setCursor((c) => (view === 'month' ? subMonths(c, 1) : subWeeks(c, 1)));
  }
  function goNext() {
    setCursor((c) => (view === 'month' ? addMonths(c, 1) : addWeeks(c, 1)));
  }

  async function saveAssignment(values: {
    name: string;
    period_id: string;
    due_date: string;
    due_time: string | null;
    description: string | null;
    priority: Priority;
  }) {
    if (editingAssignment) await updateAssignment(editingAssignment.id, values);
    setEditingAssignment(null);
  }

  async function saveEvent(values: { title: string; date: string; time: string | null; description: string | null }) {
    if (eventModal?.initial) {
      await updateEvent(eventModal.initial.id, values);
    } else {
      await insertEvent({ ...values, user_id: profile!.id, school_year_id: schoolYearId! });
    }
    setEventModal(null);
  }

  const loading = aLoading || eLoading || scheduleCtx.loading;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-xl text-ink">Calendar</h1>
        <button
          onClick={() => setEventModal({ date: isoDate(new Date()) })}
          className="flex items-center gap-1.5 rounded-lg bg-teal px-3.5 py-2 text-sm font-medium text-white hover:bg-navy"
        >
          <Plus size={16} /> Event
        </button>
      </header>

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 rounded-lg bg-slate/10 p-1">
          {(['month', 'week'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                view === v ? 'bg-white text-teal shadow-sm' : 'text-slate'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {view === 'month' && (
          <button
            onClick={() => setDisplayMode((m) => (m === 'detailed' ? 'compact' : 'detailed'))}
            className="text-xs font-medium text-teal hover:underline"
          >
            {displayMode === 'detailed' ? 'Compact view' : 'Detailed view'}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={goPrev} className="rounded-lg p-2 text-slate hover:bg-slate/10" aria-label="Previous">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-ink">{format(cursor, view === 'month' ? 'MMMM yyyy' : "'Week of' MMM d")}</p>
          <button onClick={() => setCursor(new Date())} className="text-xs text-teal hover:underline">
            {isToday(cursor) ? 'Today' : 'Jump to today'}
          </button>
        </div>
        <button onClick={goNext} className="rounded-lg p-2 text-slate hover:bg-slate/10" aria-label="Next">
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <SkeletonList rows={4} />
      ) : view === 'month' ? (
        <MonthView month={cursor} assignments={assignments} events={events} displayMode={displayMode} onDayClick={setDayDetail} />
      ) : (
        <WeekView
          week={cursor}
          scheduleCtx={scheduleCtx}
          assignments={assignments}
          events={events}
          timeFormat={profile?.time_format}
          onAssignmentClick={setEditingAssignment}
          onEventClick={(e) => setEventModal({ date: e.date, initial: e })}
          onAddEvent={(date) => setEventModal({ date })}
        />
      )}

      {dayDetail && (
        <DayDetailModal
          date={dayDetail}
          assignments={assignments.filter((a) => a.due_date === isoDate(dayDetail))}
          events={events.filter((e) => e.date === isoDate(dayDetail))}
          onClose={() => setDayDetail(null)}
          onAssignmentClick={(a) => {
            setDayDetail(null);
            setEditingAssignment(a);
          }}
          onEventClick={(e) => {
            setDayDetail(null);
            setEventModal({ date: e.date, initial: e });
          }}
          onAddEvent={() => {
            setEventModal({ date: isoDate(dayDetail) });
            setDayDetail(null);
          }}
        />
      )}

      {eventModal && (
        <EventModal
          open
          date={eventModal.date}
          initial={eventModal.initial}
          onClose={() => setEventModal(null)}
          onSave={saveEvent}
          onDelete={
            eventModal.initial
              ? () => {
                  void removeEvent(eventModal.initial!.id);
                  setEventModal(null);
                }
              : undefined
          }
        />
      )}

      <Modal open={!!editingAssignment} onClose={() => setEditingAssignment(null)} title="Edit assignment">
        {editingAssignment && (
          <AssignmentForm
            periods={periods}
            initial={editingAssignment}
            onSave={saveAssignment}
            onDelete={() => {
              void removeAssignment(editingAssignment.id);
              setEditingAssignment(null);
            }}
            onCancel={() => setEditingAssignment(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function DayDetailModal({
  date,
  assignments,
  events,
  onClose,
  onAssignmentClick,
  onEventClick,
  onAddEvent,
}: {
  date: Date;
  assignments: Assignment[];
  events: CalendarEvent[];
  onClose: () => void;
  onAssignmentClick: (a: Assignment) => void;
  onEventClick: (e: CalendarEvent) => void;
  onAddEvent: () => void;
}) {
  return (
    <Modal open onClose={onClose} title={formatDate(date)} width="sm">
      {assignments.length === 0 && events.length === 0 ? (
        <EmptyState title="Nothing on this day." />
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <button
              key={a.id}
              onClick={() => onAssignmentClick(a)}
              className="block w-full rounded-lg border border-slate/15 px-3 py-2 text-left text-sm hover:border-teal/40"
            >
              <span className="font-medium text-ink">{a.name}</span>
              {a.due_time && <span className="ml-2 text-xs text-slate">{formatTime(a.due_time)}</span>}
            </button>
          ))}
          {events.map((e) => (
            <button
              key={e.id}
              onClick={() => onEventClick(e)}
              className="block w-full rounded-lg border border-slate/15 px-3 py-2 text-left text-sm hover:border-teal/40"
            >
              <span className="font-medium text-ink">{e.title}</span>
              {e.time && <span className="ml-2 text-xs text-slate">{formatTime(e.time)}</span>}
            </button>
          ))}
        </div>
      )}
      <button onClick={onAddEvent} className="mt-4 text-sm font-medium text-teal hover:underline">
        + Add an event
      </button>
    </Modal>
  );
}
