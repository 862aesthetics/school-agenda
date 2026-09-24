import { useState } from 'react';
import { Button, ErrorText, Input, Label, Select, Textarea } from '../ui/primitives';
import { ConfirmDialog } from '../ui/Modal';
import type { Assignment, Period, Priority } from '../../types/database';

export function AssignmentForm({
  periods,
  initial,
  onSave,
  onDelete,
  onCancel,
}: {
  periods: Period[];
  initial?: Assignment;
  onSave: (values: {
    name: string;
    period_id: string;
    due_date: string;
    due_time: string | null;
    description: string | null;
    priority: Priority;
  }) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [periodId, setPeriodId] = useState(initial?.period_id ?? periods[0]?.id ?? '');
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '');
  const [dueTime, setDueTime] = useState(initial?.due_time?.slice(0, 5) ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'normal');
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function submit() {
    if (!name.trim()) return setError('Give the assignment a name.');
    if (!periodId) return setError('Choose a class.');
    if (!dueDate) return setError('Pick a due date.');
    setError(null);
    onSave({
      name: name.trim(),
      period_id: periodId,
      due_date: dueDate,
      due_time: dueTime ? `${dueTime}:00` : null,
      description: description.trim() || null,
      priority,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="aName">Assignment name</Label>
        <Input id="aName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Chapter 6 problem set" />
      </div>
      <div>
        <Label htmlFor="aClass">Class</Label>
        <Select id="aClass" value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
          {periods.length === 0 && <option value="">Add a class first</option>}
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.class_name || 'Untitled class'}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="aDate">Due date</Label>
          <input
            id="aDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-slate/30 px-3.5 py-2.5 text-[15px] focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
          />
        </div>
        <div>
          <Label htmlFor="aTime">Due time (optional)</Label>
          <input
            id="aTime"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="w-full rounded-lg border border-slate/30 px-3.5 py-2.5 text-[15px] focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="aDesc">Description (optional)</Label>
        <Textarea id="aDesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <Label>Priority</Label>
        <div className="flex gap-2">
          {(['low', 'normal', 'high'] as Priority[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`rounded-lg border px-3.5 py-1.5 text-sm capitalize ${
                priority === p ? 'border-teal bg-teal/10 text-teal' : 'border-slate/25 text-slate'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <ErrorText>{error}</ErrorText>

      <div className="flex items-center justify-between pt-1">
        {onDelete ? (
          <button onClick={() => setConfirmingDelete(true)} className="text-sm font-medium text-red-600 hover:underline">
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={submit}>Save</Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => onDelete?.()}
        title="Delete this assignment?"
        description="This can't be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
