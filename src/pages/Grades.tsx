import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useSupabaseTable } from '../hooks/useSupabaseTable';
import { EmptyState, SkeletonList } from '../components/ui/primitives';
import type { Grade, MarkingPeriod, Period } from '../types/database';

const MARKING_PERIODS: MarkingPeriod[] = ['MP1', 'MP2', 'MP3', 'MP4'];

function computeFinal(values: (string | null | undefined)[]): string {
  if (values.some((v) => !v || v.trim() === '')) return 'No Grade Yet';
  const nums = values.map((v) => Number(v));
  if (nums.some((n) => Number.isNaN(n))) return '—';
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return avg.toFixed(1);
}

export default function GradesPage() {
  const { activeSchoolYear, profile } = useAppStore();
  const schoolYearId = activeSchoolYear?.id ?? null;
  const { rows: periods, loading: pLoading } = useSupabaseTable<Period>('periods', 'school_year_id', schoolYearId, {
    orderBy: 'order_index',
  });
  const { rows: grades, insert, update } = useSupabaseTable<Grade>('grades', 'school_year_id', schoolYearId);

  function gradeFor(periodId: string, mp: MarkingPeriod) {
    return grades.find((g) => g.period_id === periodId && g.marking_period === mp);
  }

  async function setGrade(periodId: string, mp: MarkingPeriod, value: string) {
    const existing = gradeFor(periodId, mp);
    if (existing) {
      await update(existing.id, { grade_value: value });
    } else {
      await insert({
        user_id: profile!.id,
        school_year_id: schoolYearId!,
        period_id: periodId,
        marking_period: mp,
        grade_value: value,
      });
    }
  }

  if (pLoading) return <SkeletonList rows={4} />;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl text-ink">Grades</h1>

      {periods.length === 0 ? (
        <EmptyState title="Add classes in Schedule to start tracking grades." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate/15 sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate/5 text-left text-xs font-medium text-slate">
                  <th className="px-4 py-2.5">Class</th>
                  {MARKING_PERIODS.map((mp) => (
                    <th key={mp} className="px-3 py-2.5 text-center">
                      {mp}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-center">Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate/10">
                {periods.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2.5 font-medium text-ink">{p.class_name || 'Untitled class'}</td>
                    {MARKING_PERIODS.map((mp) => (
                      <td key={mp} className="px-3 py-1.5 text-center">
                        <GradeCell value={gradeFor(p.id, mp)?.grade_value ?? ''} onChange={(v) => setGrade(p.id, mp, v)} />
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-center font-medium text-teal">
                      {computeFinal(MARKING_PERIODS.map((mp) => gradeFor(p.id, mp)?.grade_value))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="space-y-3 sm:hidden">
            {periods.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate/15 p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{p.class_name || 'Untitled class'}</p>
                  <span className="text-sm font-medium text-teal">
                    {computeFinal(MARKING_PERIODS.map((mp) => gradeFor(p.id, mp)?.grade_value))}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {MARKING_PERIODS.map((mp) => (
                    <div key={mp}>
                      <p className="mb-1 text-center text-[11px] text-slate">{mp}</p>
                      <GradeCell value={gradeFor(p.id, mp)?.grade_value ?? ''} onChange={(v) => setGrade(p.id, mp, v)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GradeCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onChange(local);
      }}
      placeholder="—"
      className="w-14 rounded-lg border border-slate/25 px-2 py-1.5 text-center text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
    />
  );
}
