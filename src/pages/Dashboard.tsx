import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useScheduleContext } from '../hooks/useScheduleContext';
import { useSupabaseTable } from '../hooks/useSupabaseTable';
import { getDaySchedule, computeCurrentStatus, type ResolvedSegment } from '../utils/schedule';
import { isoDate } from '../utils/rotation';
import { formatDate, formatTime, formatTimeRange } from '../utils/format';
import { Avatar, Badge, EmptyState, SkeletonList } from '../components/ui/primitives';
import type { Assignment, Period } from '../types/database';

export default function Dashboard() {
  const { profile, activeSchoolYear } = useAppStore();
  const schoolYearId = activeSchoolYear?.id ?? null;
  const ctx = useScheduleContext(schoolYearId);
  const { rows: assignments, loading: assignmentsLoading } = useSupabaseTable<Assignment>(
    'assignments',
    'school_year_id',
    schoolYearId
  );
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { result, segments } = useMemo(() => getDaySchedule(now, ctx), [now, ctx]);
  const status = useMemo(() => computeCurrentStatus(now, segments), [now, segments]);

  const todayKey = isoDate(now);
  const todaysAssignments = assignments.filter((a) => a.due_date === todayKey && !a.completed);
  const upcoming = assignments
    .filter((a) => a.due_date > todayKey && !a.completed)
    .sort((a, b) => (a.due_date < b.due_date ? -1 : 1))
    .slice(0, 6);

  const periodById = (id?: string | null) => ctx.periods.find((p) => p.id === id);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Avatar url={profile?.avatar_url} name={profile?.display_name} shape={profile?.avatar_shape} size={44} />
        <div>
          <p className="text-xs font-medium text-slate">{formatDate(now, profile?.date_format)}</p>
          <h1 className="font-display text-xl text-ink">{profile?.display_name ?? 'Dashboard'}</h1>
        </div>
      </header>

      {ctx.loading ? (
        <SkeletonList rows={3} />
      ) : (
        <>
          <StatusCard result={result.kind} status={status} timeFormat={profile?.time_format} />

          {segments.length > 0 && (
            <Section title="Today's schedule">
              <div className="divide-y divide-slate/10 rounded-xl border border-slate/15">
                {segments.map((seg) => (
                  <ScheduleRow key={seg.key} seg={seg} isCurrent={status.current?.key === seg.key} timeFormat={profile?.time_format} />
                ))}
              </div>
            </Section>
          )}

          <Section title="Due today">
            {assignmentsLoading ? (
              <SkeletonList rows={1} />
            ) : todaysAssignments.length === 0 ? (
              <EmptyState title="No assignments due today." />
            ) : (
              <div className="space-y-2">
                {todaysAssignments.map((a) => (
                  <AssignmentRow key={a.id} assignment={a} period={periodById(a.period_id)} />
                ))}
              </div>
            )}
          </Section>

          <Section title="Upcoming work" action={<Link to="/assignments" className="text-xs font-medium text-teal">See all</Link>}>
            {upcoming.length === 0 ? (
              <EmptyState title="Nothing else on the horizon." />
            ) : (
              <div className="space-y-2">
                {upcoming.map((a) => (
                  <AssignmentRow key={a.id} assignment={a} period={periodById(a.period_id)} showDate />
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function StatusCard({
  result,
  status,
  timeFormat,
}: {
  result: 'day' | 'all_periods_meet' | 'no_school' | 'weekend';
  status: ReturnType<typeof computeCurrentStatus>;
  timeFormat?: '12h' | '24h';
}) {
  if (result === 'no_school' || result === 'weekend') {
    return (
      <div className="rounded-2xl bg-navy px-6 py-8 text-center text-white">
        <p className="font-display text-xl">Free — No school today.</p>
      </div>
    );
  }

  if (status.state === 'after_school') {
    return (
      <div className="rounded-2xl bg-navy px-6 py-8 text-center text-white">
        <p className="font-display text-xl">Free — School day complete.</p>
      </div>
    );
  }

  if (status.state === 'before_school') {
    return (
      <div className="rounded-2xl bg-navy px-6 py-7 text-center text-white">
        <p className="text-xs uppercase tracking-wide text-white/50">Before school</p>
        {status.next && <p className="mt-2 font-display text-xl">Starts at {formatTime(status.next.start, timeFormat)}</p>}
      </div>
    );
  }

  const current = status.current;
  const label = status.state === 'lunch' ? 'Lunch' : status.state === 'free_period' ? 'Free Period' : current?.className ?? 'Class';

  return (
    <div className="rounded-2xl bg-navy px-6 py-7 text-white">
      <p className="text-xs uppercase tracking-wide text-white/50">
        {current?.label ?? 'Now'} {status.minutesRemaining != null && `· ${status.minutesRemaining} min left`}
      </p>
      <p className="mt-1.5 font-display text-2xl">{label}</p>
      {current && (current.teacher || current.room) && (
        <p className="mt-1 text-sm text-white/70">{[current.teacher, current.room].filter(Boolean).join(' · ')}</p>
      )}
      {status.next && (
        <p className="mt-4 border-t border-white/10 pt-3 text-sm text-white/60">
          Next: {status.next.kind === 'lunch' ? 'Lunch' : status.next.className ?? 'Free'} at{' '}
          {formatTime(status.next.start, timeFormat)}
        </p>
      )}
    </div>
  );
}

function ScheduleRow({ seg, isCurrent, timeFormat }: { seg: ResolvedSegment; isCurrent: boolean; timeFormat?: '12h' | '24h' }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 ${isCurrent ? 'bg-teal/5' : ''}`}>
      <div>
        <p className={`text-sm font-medium ${isCurrent ? 'text-teal' : 'text-ink'}`}>
          {seg.kind === 'free' ? 'Free' : seg.kind === 'lunch' ? 'Lunch' : seg.className}
        </p>
        {(seg.teacher || seg.room) && <p className="text-xs text-slate">{[seg.teacher, seg.room].filter(Boolean).join(' · ')}</p>}
      </div>
      <p className="text-xs text-slate">{formatTimeRange(seg.start, seg.end, timeFormat)}</p>
    </div>
  );
}

function AssignmentRow({ assignment, period, showDate }: { assignment: Assignment; period?: Period; showDate?: boolean }) {
  return (
    <Link
      to="/assignments"
      className="flex items-center justify-between rounded-xl border border-slate/15 px-4 py-3 hover:border-teal/40"
    >
      <div>
        <p className="text-sm font-medium text-ink">{assignment.name}</p>
        <p className="text-xs text-slate">
          {period?.class_name ?? 'Class'}
          {showDate && ` · ${formatDate(new Date(assignment.due_date + 'T00:00:00'))}`}
        </p>
      </div>
      {assignment.priority !== 'normal' && (
        <Badge tone={assignment.priority === 'high' ? 'red' : 'neutral'}>{assignment.priority}</Badge>
      )}
    </Link>
  );
}
