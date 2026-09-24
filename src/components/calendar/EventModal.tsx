import { useState } from 'react';
import { Modal, ConfirmDialog } from '../ui/Modal';
import { Button, ErrorText, Input, Label, Textarea } from '../ui/primitives';
import type { CalendarEvent } from '../../types/database';

export function EventModal({
  open,
  date,
  initial,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  date: string;
  initial?: CalendarEvent;
  onClose: () => void;
  onSave: (values: { title: string; date: string; time: string | null; description: string | null }) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [eventDate, setEventDate] = useState(initial?.date ?? date);
  const [time, setTime] = useState(initial?.time?.slice(0, 5) ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function submit() {
    if (!title.trim()) return setError('Give the event a title.');
    setError(null);
    onSave({ title: title.trim(), date: eventDate, time: time ? `${time}:00` : null, description: description.trim() || null });
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit event' : 'New event'} width="sm">
      <div className="space-y-4">
        <div>
          <Label htmlFor="eTitle">Title</Label>
          <Input id="eTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Club meeting" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="eDate">Date</Label>
            <input
              id="eDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full rounded-lg border border-slate/30 px-3.5 py-2.5 text-[15px] focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
          </div>
          <div>
            <Label htmlFor="eTime">Time (optional)</Label>
            <input
              id="eTime"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-slate/30 px-3.5 py-2.5 text-[15px] focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="eDesc">Description (optional)</Label>
          <Textarea id="eDesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
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
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit}>Save</Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={() => onDelete?.()}
        title="Delete this event?"
        description="This can't be undone."
        confirmLabel="Delete"
        danger
      />
    </Modal>
  );
}
