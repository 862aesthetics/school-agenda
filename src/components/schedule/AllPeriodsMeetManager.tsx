import { useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import { Input, Select } from '../ui/primitives';
import { useSupabaseTable } from '../../hooks/useSupabaseTable';
import { useAppStore } from '../../store/appStore';
import { dbTimeToInput, timeInputToDb } from '../../utils/format';
import type { AllPeriodsMeetItem, AllPeriodsMeetSchedule, Period } from '../../types/database';

export function AllPeriodsMeetManager({ schoolYearId }: { schoolYearId: string }) {
  const { profile } = useAppStore();
  const { rows: periods } = useSupabaseTable<Period>('periods', 'school_year_id', schoolYearId);
  const {
    rows: schedules,
    insert: insertSchedule,
    loading: scheduleLoading,
  } = useSupabaseTable<AllPeriodsMeetSchedule>('all_periods_meet_schedules', 'school_year_id', schoolYearId);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || scheduleLoading) return;
    if (schedules.length === 0) {
      seeded.current = true;
      void insertSchedule({ user_id: profile!.id, school_year_id: schoolYearId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleLoading, schedules.length]);

  const schedule = schedules[0];

  if (!schedule) return <p className="mt-4 text-sm text-slate">Setting up…</p>;
  return <ItemsEditor scheduleId={schedule.id} periods={periods} />;
}

function ItemsEditor({ scheduleId, periods }: { scheduleId: string; periods: Period[] }) {
  const { profile } = useAppStore();
  const { rows: items, insert, update, remove } = useSupabaseTable<AllPeriodsMeetItem>(
    'all_periods_meet_items',
    'schedule_id',
    scheduleId,
    { orderBy: 'order_index' }
  );
  const sorted = [...items].sort((a, b) => a.order_index - b.order_index);

  async function addItem() {
    await insert({
      user_id: profile!.id,
      schedule_id: scheduleId,
      order_index: items.length,
      period_id: null,
      label: '',
      name_override: '',
      teacher_override: '',
      room_override: '',
      start_time: '08:00:00',
      end_time: '08:45:00',
      is_lunch: false,
    });
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const a = sorted[index];
    const b = sorted[target];
    await update(a.id, { order_index: b.order_index });
    await update(b.id, { order_index: a.order_index });
  }

  return (
    <div className="space-y-3">
      {sorted.map((item, i) => (
        <div key={item.id} className="rounded-xl border border-slate/15 p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate">
              <input
                type="checkbox"
                checked={item.is_lunch}
                onChange={(e) => update(item.id, { is_lunch: e.target.checked })}
              />
              This is Lunch
            </label>
            <div className="flex items-center gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-slate hover:bg-slate/10 disabled:opacity-30">
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === sorted.length - 1}
                className="rounded p-1 text-slate hover:bg-slate/10 disabled:opacity-30"
              >
                <ChevronDown size={16} />
              </button>
              <button onClick={() => remove(item.id)} className="rounded p-1 text-red-500 hover:bg-red-50">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <Input
            placeholder="Label (optional) — e.g. Lunch/Block 3 Lab"
            value={item.label ?? ''}
            onChange={(e) => update(item.id, { label: e.target.value })}
            className="mb-2"
          />

          {!item.is_lunch && (
            <Select
              value={item.period_id ?? ''}
              onChange={(e) => update(item.id, { period_id: e.target.value || null })}
              className="mb-2"
            >
              <option value="">Custom (not tied to a class)</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.class_name || 'Untitled class'}
                </option>
              ))}
            </Select>
          )}

          {!item.is_lunch && !item.period_id && (
            <div className="mb-2 grid grid-cols-2 gap-2">
              <Input
                placeholder="Class name"
                value={item.name_override ?? ''}
                onChange={(e) => update(item.id, { name_override: e.target.value })}
              />
              <Input
                placeholder="Teacher"
                value={item.teacher_override ?? ''}
                onChange={(e) => update(item.id, { teacher_override: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={dbTimeToInput(item.start_time)}
              onChange={(e) => update(item.id, { start_time: timeInputToDb(e.target.value) })}
              className="rounded-lg border border-slate/25 px-2.5 py-2 text-sm"
            />
            <input
              type="time"
              value={dbTimeToInput(item.end_time)}
              onChange={(e) => update(item.id, { end_time: timeInputToDb(e.target.value) })}
              className="rounded-lg border border-slate/25 px-2.5 py-2 text-sm"
            />
          </div>
        </div>
      ))}

      <button
        onClick={addItem}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate/30 py-3 text-sm font-medium text-teal hover:border-teal hover:bg-teal/5"
      >
        <Plus size={16} /> Add time slot
      </button>
    </div>
  );
}
