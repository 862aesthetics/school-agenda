import { useState } from 'react';
import { Button } from '../../ui/primitives';
import { useSupabaseTable } from '../../../hooks/useSupabaseTable';
import { useAppStore } from '../../../store/appStore';
import type { Period, RotationAnchor } from '../../../types/database';
import { DAY_LABELS } from '../../../types/database';
import { formatDate, parseDateInput } from '../../../utils/format';

export function StepConfirm({ schoolYearId, onConfirm, onBack }: { schoolYearId: string; onConfirm: () => void; onBack: () => void }) {
  const { profile, updateProfile } = useAppStore();
  const { rows: periods } = useSupabaseTable<Period>('periods', 'school_year_id', schoolYearId);
  const { rows: anchors } = useSupabaseTable<RotationAnchor>('rotation_anchors', 'school_year_id', schoolYearId);
  const anchor = anchors[0];
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    await updateProfile({ setup_completed: true });
    setSaving(false);
    onConfirm();
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Review &amp; confirm</h2>
      <p className="mt-1.5 text-sm text-slate">Everything below can be changed later in Settings.</p>

      <div className="mt-6 space-y-3">
        <SummaryRow label="Name" value={profile?.display_name ?? '—'} />
        <SummaryRow label="School" value={profile?.school_name ?? '—'} />
        <SummaryRow label="Grade" value={profile?.grade ?? '—'} />
        <SummaryRow label="Classes" value={`${periods.length} period${periods.length === 1 ? '' : 's'}`} />
        <SummaryRow
          label="Rotation"
          value={anchor ? `${formatDate(parseDateInput(anchor.reference_date))} = ${DAY_LABELS[anchor.reference_day]}` : 'Not set'}
        />
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleConfirm} disabled={saving}>
          {saving ? 'Finishing…' : 'Confirm'}
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate/10 py-2 text-sm">
      <span className="text-slate">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
