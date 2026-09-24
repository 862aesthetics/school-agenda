import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useSupabaseTable } from '../../hooks/useSupabaseTable';
import { PeriodsManager } from '../../components/schedule/PeriodsManager';
import { Modal } from '../../components/ui/Modal';
import { Badge, Button, EmptyState, Input } from '../../components/ui/primitives';
import type { SchoolYear } from '../../types/database';

export function SchoolYearsSettings() {
  const user = useAuthStore((s) => s.user);
  const { activeSchoolYear, updateProfile, setActiveSchoolYear } = useAppStore();
  const { rows: years, insert, update } = useSupabaseTable<SchoolYear>('school_years', 'user_id', user?.id ?? null);

  const [newYearOpen, setNewYearOpen] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [viewing, setViewing] = useState<SchoolYear | null>(null);

  const current = years.filter((y) => !y.archived);
  const archived = years
    .filter((y) => y.archived)
    .filter((y) => y.name.toLowerCase().includes(archiveSearch.toLowerCase()));

  async function createYear() {
    if (!newYearName.trim() || !user) return;
    await insert({ user_id: user.id, name: newYearName.trim(), is_active: false, archived: false });
    setNewYearName('');
    setNewYearOpen(false);
  }

  async function makeActive(year: SchoolYear) {
    if (activeSchoolYear && activeSchoolYear.id !== year.id) {
      await update(activeSchoolYear.id, { is_active: false, archived: true });
    }
    await update(year.id, { is_active: true, archived: false });
    await updateProfile({ active_school_year_id: year.id });
    setActiveSchoolYear({ ...year, is_active: true, archived: false });
  }

  return (
    <div className="max-w-md space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink">Current</h2>
        <div className="space-y-2">
          {current.map((y) => (
            <div key={y.id} className="flex items-center justify-between rounded-xl border border-slate/15 px-4 py-3">
              <span className="text-sm font-medium text-ink">{y.name}</span>
              {y.id === activeSchoolYear?.id ? (
                <Badge tone="teal">Active</Badge>
              ) : (
                <button onClick={() => makeActive(y)} className="text-xs font-medium text-teal hover:underline">
                  Make active
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={() => setNewYearOpen(true)}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate/30 py-2.5 text-sm font-medium text-teal hover:border-teal hover:bg-teal/5"
        >
          <Plus size={15} /> New school year
        </button>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Archived</h2>
        <Input
          value={archiveSearch}
          onChange={(e) => setArchiveSearch(e.target.value)}
          placeholder="Search archived years"
          className="mb-3"
        />
        {archived.length === 0 ? (
          <EmptyState title="No archived school years yet." />
        ) : (
          <div className="space-y-2">
            {archived.map((y) => (
              <div key={y.id} className="flex items-center justify-between rounded-xl border border-slate/15 px-4 py-3">
                <span className="text-sm font-medium text-ink">{y.name}</span>
                <button onClick={() => setViewing(y)} className="text-xs font-medium text-teal hover:underline">
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal open={newYearOpen} onClose={() => setNewYearOpen(false)} title="New school year" width="sm">
        <p className="mb-3 text-sm text-slate">It starts completely blank — nothing carries over from your other years.</p>
        <Input value={newYearName} onChange={(e) => setNewYearName(e.target.value)} placeholder="2027–2028" autoFocus />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setNewYearOpen(false)}>
            Cancel
          </Button>
          <Button onClick={createYear}>Create</Button>
        </div>
      </Modal>

      {viewing && (
        <Modal open onClose={() => setViewing(null)} title={`${viewing.name} (archived, read-only)`} width="lg">
          <PeriodsManager schoolYearId={viewing.id} readOnly />
        </Modal>
      )}
    </div>
  );
}
