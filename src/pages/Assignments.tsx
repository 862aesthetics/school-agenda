import { useMemo, useState } from 'react';
import { addDays, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSupabaseTable } from '../hooks/useSupabaseTable';
import { AssignmentForm } from '../components/assignments/AssignmentForm';
import { Modal } from '../components/ui/Modal';
import { Badge, EmptyState, SkeletonList } from '../components/ui/primitives';
import { formatDate, formatTime } from '../utils/format';
import { isoDate } from '../utils/rotation';
import type { Assignment, Period, Priority } from '../types/database';

type GroupMode = 'date' | 'class';
type SortMode = 'due' | 'priority';
type Tab = 'active' | 'completed';

interface AssignmentValues {
  name: string;
  period_id: string;
  due_date: string;
  due_time: string | null;
  description: string | null;
  priority: Priority;
}

const PRIORITY_WEIGHT: Record<Priority, number> = { high: 0, normal: 1, low: 2 };

export default function AssignmentsPage() {
  const { profile, activeSchoolYear } = useAppStore();
  const schoolYearId = activeSchoolYear?.id ?? null;
  const { rows: periods } = useSupabaseTable<Period>('periods', 'school_year_id', schoolYearId, { orderBy: 'order_index' });
  const { rows: assignments, loading, insert, update, remove } = useSupabaseTable<Assignment>(
    'assignments',
    'school_year_id',
    schoolYearId
  );

  const [tab, setTab] = useState<Tab>('active');
  const [groupMode, setGroupMode] = useState<GroupMode>('date');
  const [sortMode, setSortMode] = useState<SortMode>('due');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);

  const periodById = (id: string) => periods.find((p) => p.id === id);
  const todayKey = isoDate(new Date());

  const sortFn = (a: Assignment, b: Assignment) => {
    if (sortMode === 'priority') {
      const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (diff !== 0) return diff;
    }
    if (a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1;
    const at = a.due_time ?? '23:59:59';
    const bt = b.due_time ?? '23:59:59';
    return at < bt ? -1 : at > bt ? 1 : 0;
  };

  const active = useMemo(() => [...assignments.filter((a) => !a.completed)].sort(sortFn), [assignments, sortMode]);
  const completed = useMemo(
    () => [...assignments.filter((a) => a.completed)].sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? '')),
    [assignments]
  );

  async function handleSave(values: AssignmentValues) {
    if (editing) {
      await update(editing.id, values);
    } else {
      await insert({ ...values, user_id: profile!.id, school_year_id: schoolYearId!, completed: false });
    }
    closeForm();
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function toggleComplete(a: Assignment) {
    await update(a.id, { completed: !a.completed, completed_at: !a.completed ? new Date().toISOString() : null });
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-xl text-ink">Assignments</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-teal px-3.5 py-2 text-sm font-medium text-white hover:bg-navy"
        >
          <Plus size={16} /> New
        </button>
      </header>

      <div className="flex gap-1.5 rounded-lg bg-slate/10 p-1">
        {(['active', 'completed'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-white text-teal shadow-sm' : 'text-slate'
            }`}
          >
            {t === 'active' ? 'Active' : 'Completed'}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex gap-3">
            <button onClick={() => setGroupMode('date')} className={groupMode === 'date' ? 'font-semibold text-teal' : 'text-slate'}>
              By Date
            </button>
            <button onClick={() => setGroupMode('class')} className={groupMode === 'class' ? 'font-semibold text-teal' : 'text-slate'}>
              By Class
            </button>
          </div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="rounded-md border border-slate/25 bg-white px-2 py-1 text-slate"
          >
            <option value="due">Sort: Due date</option>
            <option value="priority">Sort: Priority</option>
          </select>
        </div>
      )}

      {loading ? (
        <SkeletonList rows={3} />
      ) : tab === 'active' ? (
        active.length === 0 ? (
          <EmptyState title="Nothing due — you're all caught up." />
        ) : groupMode === 'date' ? (
          <DateGroups assignments={active} todayKey={todayKey} periodById={periodById} onToggle={toggleComplete} onEdit={setEditing} />
        ) : (
          <ClassGroups assignments={active} periods={periods} periodById={periodById} onToggle={toggleComplete} onEdit={setEditing} />
        )
      ) : completed.length === 0 ? (
        <EmptyState title="No completed assignments yet." />
      ) : (
        <div className="space-y-2">
          {completed.map((a) => (
            <AssignmentRow key={a.id} assignment={a} period={periodById(a.period_id)} onToggle={() => toggleComplete(a)} onEdit={() => setEditing(a)} />
          ))}
        </div>
      )}

      <Modal open={formOpen || !!editing} onClose={closeForm} title={editing ? 'Edit assignment' : 'New assignment'}>
        <AssignmentForm
          periods={periods}
          initial={editing ?? undefined}
          onSave={handleSave}
          onDelete={
            editing
              ? () => {
                  void remove(editing.id);
                  closeForm();
                }
              : undefined
          }
          onCancel={closeForm}
        />
      </Modal>
    </div>
  );
}

function DateGroups({
  assignments,
  todayKey,
  periodById,
  onToggle,
  onEdit,
}: {
  assignments: Assignment[];
  todayKey: string;
  periodById: (id: string) => Period | undefined;
  onToggle: (a: Assignment) => void;
  onEdit: (a: Assignment) => void;
}) {
  const tomorrowKey = isoDate(addDays(new Date(), 1));
  const weekEndKey = isoDate(addDays(new Date(), 7));

  const overdue = assignments.filter((a) => a.due_date < todayKey);
  const today = assignments.filter((a) => a.due_date === todayKey);
  const tomorrow = assignments.filter((a) => a.due_date === tomorrowKey);
  const thisWeek = assignments.filter((a) => a.due_date > tomorrowKey && a.due_date <= weekEndKey);
  const later = assignments.filter((a) => a.due_date > weekEndKey);

  return (
    <div className="space-y-5">
      <Group title="Overdue" items={overdue} periodById={periodById} onToggle={onToggle} onEdit={onEdit} tone="red" />
      <Group title="Today" items={today} periodById={periodById} onToggle={onToggle} onEdit={onEdit} />
      <Group title="Tomorrow" items={tomorrow} periodById={periodById} onToggle={onToggle} onEdit={onEdit} />
      <Group title="This Week" items={thisWeek} periodById={periodById} onToggle={onToggle} onEdit={onEdit} />
      <Group title="Later" items={later} periodById={periodById} onToggle={onToggle} onEdit={onEdit} />
    </div>
  );
}

function ClassGroups({
  assignments,
  periods,
  periodById,
  onToggle,
  onEdit,
}: {
  assignments: Assignment[];
  periods: Period[];
  periodById: (id: string) => Period | undefined;
  onToggle: (a: Assignment) => void;
  onEdit: (a: Assignment) => void;
}) {
  return (
    <div className="space-y-5">
      {periods.map((p) => {
        const items = assignments.filter((a) => a.period_id === p.id);
        if (items.length === 0) return null;
        return <Group key={p.id} title={p.class_name || 'Untitled class'} items={items} periodById={periodById} onToggle={onToggle} onEdit={onEdit} />;
      })}
    </div>
  );
}

function Group({
  title,
  items,
  periodById,
  onToggle,
  onEdit,
  tone,
}: {
  title: string;
  items: Assignment[];
  periodById: (id: string) => Period | undefined;
  onToggle: (a: Assignment) => void;
  onEdit: (a: Assignment) => void;
  tone?: 'red';
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className={`mb-2 text-sm font-semibold ${tone === 'red' ? 'text-red-600' : 'text-ink'}`}>{title}</h2>
      <div className="space-y-2">
        {items.map((a) => (
          <AssignmentRow key={a.id} assignment={a} period={periodById(a.period_id)} onToggle={() => onToggle(a)} onEdit={() => onEdit(a)} />
        ))}
      </div>
    </section>
  );
}

function AssignmentRow({
  assignment,
  period,
  onToggle,
  onEdit,
}: {
  assignment: Assignment;
  period?: Period;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate/15 px-4 py-3">
      <input
        type="checkbox"
        checked={assignment.completed}
        onChange={onToggle}
        className="h-4 w-4 accent-teal"
        aria-label={`Mark ${assignment.name} ${assignment.completed ? 'incomplete' : 'complete'}`}
      />
      <button onClick={onEdit} className="flex-1 text-left">
        <p className={`text-sm font-medium ${assignment.completed ? 'text-slate line-through' : 'text-ink'}`}>{assignment.name}</p>
        <p className="text-xs text-slate">
          {period?.class_name ?? 'Class'} · {formatDate(parseISO(assignment.due_date))}
          {assignment.due_time && ` · ${formatTime(assignment.due_time)}`}
        </p>
      </button>
      {assignment.priority !== 'normal' && !assignment.completed && (
        <Badge tone={assignment.priority === 'high' ? 'red' : 'neutral'}>{assignment.priority}</Badge>
      )}
    </div>
  );
}
