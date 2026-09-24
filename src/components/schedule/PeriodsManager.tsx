import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';
import { Input } from '../ui/primitives';
import { ConfirmDialog } from '../ui/Modal';
import { useSupabaseTable } from '../../hooks/useSupabaseTable';
import { useAppStore } from '../../store/appStore';
import type { Period } from '../../types/database';

export function PeriodsManager({ schoolYearId, readOnly = false }: { schoolYearId: string; readOnly?: boolean }) {
  const { rows: periods, insert, update, remove } = useSupabaseTable<Period>('periods', 'school_year_id', schoolYearId, {
    orderBy: 'order_index',
  });
  const { profile } = useAppStore();
  const sorted = [...periods].sort((a, b) => a.order_index - b.order_index);
  const [pendingDelete, setPendingDelete] = useState<Period | null>(null);

  async function addPeriod() {
    await insert({
      user_id: profile!.id,
      school_year_id: schoolYearId,
      order_index: periods.length,
      class_name: '',
      teacher: '',
      room: '',
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
      {sorted.map((period, i) => (
        <div key={period.id} className="rounded-xl border border-slate/15 p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate/70">Period {i + 1}</span>
            {!readOnly && (
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
                <button onClick={() => setPendingDelete(period)} className="rounded p-1 text-red-500 hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Input
              placeholder="Class name"
              value={period.class_name}
              onChange={(e) => update(period.id, { class_name: e.target.value })}
              disabled={readOnly}
            />
            <Input
              placeholder="Teacher"
              value={period.teacher ?? ''}
              onChange={(e) => update(period.id, { teacher: e.target.value })}
              disabled={readOnly}
            />
            <Input
              placeholder="Room"
              value={period.room ?? ''}
              onChange={(e) => update(period.id, { room: e.target.value })}
              disabled={readOnly}
            />
          </div>
        </div>
      ))}

      {!readOnly && (
        <button
          onClick={addPeriod}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate/30 py-3 text-sm font-medium text-teal hover:border-teal hover:bg-teal/5"
        >
          <Plus size={16} /> Add Period
        </button>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove(pendingDelete.id)}
        title={`Delete ${pendingDelete?.class_name || 'this period'}?`}
        description="This permanently deletes every assignment, grade, and note tied to this class, and clears it from any schedule block that references it. This can't be undone."
        confirmLabel="Delete permanently"
        danger
      />
    </div>
  );
}
