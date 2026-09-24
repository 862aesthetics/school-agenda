import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, Plus, Search, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSupabaseTable } from '../hooks/useSupabaseTable';
import { RichTextEditor } from '../components/notes/RichTextEditor';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { Button, EmptyState, Input, Select, SkeletonList } from '../components/ui/primitives';
import type { Note, NoteType, Period } from '../types/database';

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ');
}

export default function NotesPage() {
  const { profile, activeSchoolYear } = useAppStore();
  const schoolYearId = activeSchoolYear?.id ?? null;
  const { rows: periods } = useSupabaseTable<Period>('periods', 'school_year_id', schoolYearId, { orderBy: 'order_index' });
  const { rows: notes, loading, insert, update, remove } = useSupabaseTable<Note>('notes', 'school_year_id', schoolYearId);

  const [tab, setTab] = useState<NoteType>('class');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Note | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  const effectivePeriodId = selectedPeriodId || periods[0]?.id || '';

  const searching = search.trim().length > 0;
  const searchResults = useMemo(() => {
    if (!searching) return [];
    const q = search.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(q) || stripHtml(n.content).toLowerCase().includes(q));
  }, [notes, search, searching]);

  const visibleNotes = searching
    ? searchResults
    : notes
        .filter((n) => (tab === 'class' ? n.type === 'class' && n.period_id === effectivePeriodId : n.type === 'general'))
        .sort((a, b) => a.order_index - b.order_index);

  async function createNote() {
    if (tab === 'class' && !effectivePeriodId) return;
    const scopeNotes = notes.filter((n) => (tab === 'class' ? n.period_id === effectivePeriodId : n.type === 'general'));
    const note = await insert({
      user_id: profile!.id,
      school_year_id: schoolYearId!,
      type: tab,
      period_id: tab === 'class' ? effectivePeriodId : null,
      title: 'Untitled',
      content: '',
      order_index: scopeNotes.length,
    });
    setEditing(note);
  }

  async function move(note: Note, dir: -1 | 1) {
    const scope = notes
      .filter((n) => (n.type === 'class' ? n.period_id === note.period_id : n.type === 'general') && n.type === note.type)
      .sort((a, b) => a.order_index - b.order_index);
    const index = scope.findIndex((n) => n.id === note.id);
    const target = index + dir;
    if (target < 0 || target >= scope.length) return;
    const a = scope[index];
    const b = scope[target];
    await update(a.id, { order_index: b.order_index });
    await update(b.id, { order_index: a.order_index });
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-xl text-ink">Notes</h1>
        <button
          onClick={createNote}
          className="flex items-center gap-1.5 rounded-lg bg-teal px-3.5 py-2 text-sm font-medium text-white hover:bg-navy"
        >
          <Plus size={16} /> New
        </button>
      </header>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate/50" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes" className="pl-9" />
      </div>

      {!searching && (
        <>
          <div className="flex gap-1.5 rounded-lg bg-slate/10 p-1">
            {(['class', 'general'] as NoteType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium capitalize transition-colors ${
                  tab === t ? 'bg-white text-teal shadow-sm' : 'text-slate'
                }`}
              >
                {t === 'class' ? 'Class Notes' : 'General Notes'}
              </button>
            ))}
          </div>

          {tab === 'class' && periods.length > 0 && (
            <Select value={effectivePeriodId} onChange={(e) => setSelectedPeriodId(e.target.value)}>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.class_name || 'Untitled class'}
                </option>
              ))}
            </Select>
          )}
        </>
      )}

      {loading ? (
        <SkeletonList rows={3} />
      ) : visibleNotes.length === 0 ? (
        <EmptyState title={searching ? 'No notes match your search.' : 'No notes yet.'} />
      ) : (
        <div className="space-y-2">
          {visibleNotes.map((note, i) => (
            <div key={note.id} className="flex items-center gap-2 rounded-xl border border-slate/15 px-4 py-3">
              <button onClick={() => setEditing(note)} className="flex-1 text-left">
                <p className="text-sm font-medium text-ink">{note.title || 'Untitled'}</p>
                <p className="truncate text-xs text-slate">{stripHtml(note.content).slice(0, 90) || 'No content yet'}</p>
              </button>
              {!searching && (
                <div className="flex items-center gap-0.5">
                  <button onClick={() => move(note, -1)} disabled={i === 0} className="rounded p-1 text-slate hover:bg-slate/10 disabled:opacity-30">
                    <ChevronUp size={15} />
                  </button>
                  <button
                    onClick={() => move(note, 1)}
                    disabled={i === visibleNotes.length - 1}
                    className="rounded p-1 text-slate hover:bg-slate/10 disabled:opacity-30"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>
              )}
              <button onClick={() => setPendingDelete(note)} className="rounded p-1 text-red-500 hover:bg-red-50">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal open onClose={() => setEditing(null)} title="Note" width="lg">
          <Input
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            onBlur={() => update(editing.id, { title: editing.title })}
            placeholder="Untitled"
            className="mb-3 text-base font-medium"
          />
          <RichTextEditor content={editing.content} onChange={(html) => update(editing.id, { content: html })} />
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setEditing(null)}>Done</Button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove(pendingDelete.id)}
        title="Delete this note?"
        description="This can't be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
