import { useState } from 'react';
import { addDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useScheduleContext } from '../hooks/useScheduleContext';
import { getDaySchedule, type ResolvedSegment } from '../utils/schedule';
import { isoDate } from '../utils/rotation';
import { formatDate, formatTimeRange, dbTimeToInput, timeInputToDb } from '../utils/format';
import { Button, SkeletonList, Badge } from '../components/ui/primitives';
import { Modal } from '../components/ui/Modal';
import { DAY_LABELS, type OverrideType, type DateOverride, type ScheduleTimeOverride } from '../types/database';

const OVERRIDE_OPTIONS: { value: OverrideType; label: string }[] = [
  { value: 'day1', label: 'Day 1' },
  { value: 'day2', label: 'Day 2' },
  { value: 'day3', label: 'Day 3' },
  { value: 'day4', label: 'Day 4' },
  { value: 'all_periods_meet', label: 'All Periods Meet' },
  { value: 'no_school', label: 'No School' },
];

export default function SchedulePage() {
  const { profile, activeSchoolYear } = useAppStore();
  const schoolYearId = activeSchoolYear?.id ?? null;
  const ctx = useScheduleContext(schoolYearId);
  const [date, setDate] = useState(new Date());
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [timeEditSegment, setTimeEditSegment] = useState<ResolvedSegment | null>(null);

  const dateKey = isoDate(date);
  const { result, segments } = getDaySchedule(date, ctx);
  const existingOverride = ctx.dateOverrides.find((o) => o.date === dateKey);

  const dayLabel =
    result.kind === 'day'
      ? DAY_LABELS[result.day]
      : result.kind === 'all_periods_meet'
      ? 'All Periods Meet'
      : result.kind === 'no_school'
      ? 'No School'
      : 'Weekend';

  async function applyOverride(type: OverrideType | null) {
    const { dateOverrides } = ctx.mutators;
    if (type === null) {
      if (existingOverride) await dateOverrides.remove(existingOverride.id);
    } else if (existingOverride) {
      await dateOverrides.update(existingOverride.id, { override_type: type });
    } else {
      await dateOverrides.insert({
        user_id: profile!.id,
        school_year_id: schoolYearId!,
        date: dateKey,
        override_type: type,
      } as Partial<DateOverride>);
    }
    setOverrideModalOpen(false);
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-xl text-ink">Schedule</h1>
      </header>

      <div className="flex items-center justify-between rounded-xl border border-slate/15 p-3">
        <button onClick={() => setDate((d) => addDays(d, -1))} className="rounded-lg p-2 text-slate hover:bg-slate/10" aria-label="Previous day">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-ink">{formatDate(date, profile?.date_format)}</p>
          <button onClick={() => setDate(new Date())} className="text-xs text-teal hover:underline">
            Today
          </button>
        </div>
        <button onClick={() => setDate((d) => addDays(d, 1))} className="rounded-lg p-2 text-slate hover:bg-slate/10" aria-label="Next day">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Badge tone={existingOverride ? 'amber' : 'teal'}>{dayLabel}</Badge>
        <button onClick={() => setOverrideModalOpen(true)} className="text-xs font-medium text-teal hover:underline">
          Change this date
        </button>
      </div>

      {ctx.loading ? (
        <SkeletonList rows={4} />
      ) : segments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate/25 px-5 py-10 text-center text-sm text-slate">
          {result.kind === 'weekend' ? 'No school on weekends.' : 'No school today.'}
        </div>
      ) : (
        <div className="divide-y divide-slate/10 rounded-xl border border-slate/15">
          {segments.map((seg) => (
            <div key={seg.key} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  {seg.kind === 'free' ? 'Free' : seg.kind === 'lunch' ? 'Lunch' : seg.className}
                </p>
                {(seg.teacher || seg.room) && <p className="text-xs text-slate">{[seg.teacher, seg.room].filter(Boolean).join(' · ')}</p>}
                <p className="text-xs text-slate/70">{formatTimeRange(seg.start, seg.end, profile?.time_format)}</p>
              </div>
              {result.kind === 'day' && seg.blockKey && (
                <button onClick={() => setTimeEditSegment(seg)} className="rounded-lg p-2 text-slate hover:bg-slate/10" aria-label="Edit time">
                  <Pencil size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={overrideModalOpen} onClose={() => setOverrideModalOpen(false)} title="Change this date" width="sm">
        <div className="space-y-1.5">
          {OVERRIDE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => applyOverride(opt.value)}
              className="block w-full rounded-lg px-3.5 py-2.5 text-left text-sm hover:bg-slate/10"
            >
              {opt.label}
            </button>
          ))}
          {existingOverride && (
            <button
              onClick={() => applyOverride(null)}
              className="block w-full rounded-lg px-3.5 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Remove override (use normal rotation)
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-slate/70">This only affects {formatDate(date, profile?.date_format)}. The rotation continues normally afterward.</p>
      </Modal>

      {timeEditSegment && schoolYearId && (
        <TimeEditModal
          segment={timeEditSegment}
          date={date}
          schoolYearId={schoolYearId}
          onClose={() => setTimeEditSegment(null)}
        />
      )}
    </div>
  );
}

function TimeEditModal({
  segment,
  date,
  schoolYearId,
  onClose,
}: {
  segment: ResolvedSegment;
  date: Date;
  schoolYearId: string;
  onClose: () => void;
}) {
  const { profile } = useAppStore();
  const ctx = useScheduleContext(schoolYearId);
  const [start, setStart] = useState(dbTimeToInput(segment.start));
  const [end, setEnd] = useState(dbTimeToInput(segment.end));
  const [scope, setScope] = useState<'single_date' | 'from_date' | 'all_occurrences'>('single_date');
  const dateKey = isoDate(date);

  async function save() {
    if (!segment.blockKey) return;
    const startDb = timeInputToDb(start);
    const endDb = timeInputToDb(end);

    if (scope === 'all_occurrences') {
      const base = ctx.blockTimes.find((b) => b.block_key === segment.blockKey);
      if (base) await ctx.mutators.blockTimes.update(base.id, { start_time: startDb, end_time: endDb });
    } else {
      const existing = ctx.timeOverrides.find(
        (o) => o.block_key === segment.blockKey && o.scope === scope && o.effective_date === dateKey
      );
      const payload = {
        user_id: profile!.id,
        school_year_id: schoolYearId,
        block_key: segment.blockKey,
        scope,
        effective_date: dateKey,
        start_time: startDb,
        end_time: endDb,
      };
      if (existing) {
        await ctx.mutators.timeOverrides.update(existing.id, payload);
      } else {
        await ctx.mutators.timeOverrides.insert(payload as Partial<ScheduleTimeOverride>);
      }
    }
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={`Edit time — ${segment.label}`} width="sm">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="time"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="rounded-lg border border-slate/25 px-3 py-2 text-sm"
        />
        <input
          type="time"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="rounded-lg border border-slate/25 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4 space-y-2">
        {[
          { value: 'single_date' as const, label: 'This date only' },
          { value: 'from_date' as const, label: 'This date and future occurrences' },
          { value: 'all_occurrences' as const, label: 'All occurrences of this schedule' },
        ].map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm text-ink">
            <input type="radio" checked={scope === opt.value} onChange={() => setScope(opt.value)} />
            {opt.label}
          </label>
        ))}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save}>Save</Button>
      </div>
    </Modal>
  );
}
