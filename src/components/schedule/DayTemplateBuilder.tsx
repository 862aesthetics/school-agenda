import { useEffect, useRef, useState } from 'react';
import { Select } from '../ui/primitives';
import { useSupabaseTable } from '../../hooks/useSupabaseTable';
import { useAppStore } from '../../store/appStore';
import {
  ALL_BLOCK_ORDER,
  BLOCK_LABELS,
  DAY_KEYS,
  DAY_LABELS,
  DEFAULT_BLOCK_TIMES,
  SCHEDULE_BLOCK_ORDER,
  type BlockTime,
  type DayKey,
  type DayTemplate,
  type DayTemplateBlock,
  type Period,
} from '../../types/database';
import { dbTimeToInput, timeInputToDb } from '../../utils/format';

export function DayTemplateBuilder({ schoolYearId }: { schoolYearId: string }) {
  const { profile } = useAppStore();
  const { rows: periods } = useSupabaseTable<Period>('periods', 'school_year_id', schoolYearId);
  const { rows: blockTimes, insert: insertBlockTime, update: updateBlockTime, loading: btLoading } = useSupabaseTable<BlockTime>(
    'block_times',
    'school_year_id',
    schoolYearId
  );
  const { rows: templates, insert: insertTemplate, loading: tLoading } = useSupabaseTable<DayTemplate>(
    'day_templates',
    'school_year_id',
    schoolYearId
  );
  const [activeDay, setActiveDay] = useState<DayKey>('day1');
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || btLoading || tLoading) return;
    seeded.current = true;
    (async () => {
      for (const blockKey of ALL_BLOCK_ORDER) {
        if (!blockTimes.some((b) => b.block_key === blockKey)) {
          await insertBlockTime({
            user_id: profile!.id,
            school_year_id: schoolYearId,
            block_key: blockKey,
            start_time: `${DEFAULT_BLOCK_TIMES[blockKey].start}:00`,
            end_time: `${DEFAULT_BLOCK_TIMES[blockKey].end}:00`,
          });
        }
      }
      for (const dayKey of DAY_KEYS) {
        if (!templates.some((t) => t.day_key === dayKey)) {
          await insertTemplate({ user_id: profile!.id, school_year_id: schoolYearId, day_key: dayKey });
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [btLoading, tLoading]);

  const activeTemplate = templates.find((t) => t.day_key === activeDay);

  return (
    <div>
      <BlockTimesEditor blockTimes={blockTimes} onUpdate={updateBlockTime} />

      <div className="mt-6 flex gap-1.5 rounded-lg bg-slate/10 p-1">
        {DAY_KEYS.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeDay === d ? 'bg-white text-teal shadow-sm' : 'text-slate'
            }`}
          >
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>

      {activeTemplate ? (
        <DayBlockEditor key={activeTemplate.id} template={activeTemplate} periods={periods} />
      ) : (
        <p className="mt-4 text-sm text-slate">Setting up…</p>
      )}
    </div>
  );
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function BlockTimesEditor({
  blockTimes,
  onUpdate,
}: {
  blockTimes: BlockTime[];
  onUpdate: (id: string, patch: Partial<BlockTime>) => Promise<void>;
}) {
  const ordered = ALL_BLOCK_ORDER.map((k) => blockTimes.find((b) => b.block_key === k)).filter(Boolean) as BlockTime[];

  function overlapsPrevious(index: number): boolean {
    if (index === 0) return false;
    const prev = ordered[index - 1];
    const current = ordered[index];
    return timeToMinutes(current.start_time) < timeToMinutes(prev.end_time);
  }

  return (
    <details className="mt-5 rounded-xl border border-slate/15 p-3.5" open>
      <summary className="cursor-pointer text-sm font-medium text-teal">Block times</summary>
      <div className="mt-3 space-y-2">
        {ordered.map((bt, i) => {
          const conflict = overlapsPrevious(i);
          return (
            <div key={bt.block_key}>
              <div className="grid grid-cols-3 items-center gap-2 text-sm">
                <span className="text-slate">{BLOCK_LABELS[bt.block_key]}</span>
                <input
                  type="time"
                  value={dbTimeToInput(bt.start_time)}
                  onChange={(e) => onUpdate(bt.id, { start_time: timeInputToDb(e.target.value) })}
                  className={`rounded-lg border px-2 py-1.5 ${conflict ? 'border-amber-400' : 'border-slate/25'}`}
                />
                <input
                  type="time"
                  value={dbTimeToInput(bt.end_time)}
                  onChange={(e) => onUpdate(bt.id, { end_time: timeInputToDb(e.target.value) })}
                  className={`rounded-lg border px-2 py-1.5 ${conflict ? 'border-amber-400' : 'border-slate/25'}`}
                />
              </div>
              {conflict && <p className="mt-1 text-xs text-amber-600">Overlaps with the block before it.</p>}
            </div>
          );
        })}
      </div>
    </details>
  );
}

function DayBlockEditor({ template, periods }: { template: DayTemplate; periods: Period[] }) {
  const { profile } = useAppStore();
  const { rows: blocks, insert, update } = useSupabaseTable<DayTemplateBlock>('day_template_blocks', 'day_template_id', template.id);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    (async () => {
      for (const blockKey of SCHEDULE_BLOCK_ORDER) {
        if (!blocks.some((b) => b.block_key === blockKey)) {
          await insert({
            user_id: profile!.id,
            school_year_id: template.school_year_id,
            day_template_id: template.id,
            block_key: blockKey,
            period_id: null,
          });
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setPeriod(blockKey: string, periodId: string | null) {
    const existing = blocks.find((b) => b.block_key === blockKey);
    if (!existing) return;
    await update(existing.id, { period_id: periodId });
  }

  return (
    <div className="mt-4 space-y-2">
      {SCHEDULE_BLOCK_ORDER.map((blockKey) => {
        const block = blocks.find((b) => b.block_key === blockKey);
        const usedElsewhere = new Set(blocks.filter((b) => b.block_key !== blockKey && b.period_id).map((b) => b.period_id));
        return (
          <div key={blockKey}>
            {blockKey === 'block4' && (
              <div className="my-1 rounded-lg bg-slate/5 px-3 py-1.5 text-xs font-medium text-slate">Lunch</div>
            )}
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm text-slate">{BLOCK_LABELS[blockKey]}</span>
              <Select value={block?.period_id ?? ''} onChange={(e) => setPeriod(blockKey, e.target.value || null)} className="flex-1">
                <option value="">Free</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id} disabled={usedElsewhere.has(p.id)}>
                    {p.class_name || 'Untitled class'} {usedElsewhere.has(p.id) ? '(used elsewhere)' : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
