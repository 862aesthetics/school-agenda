import { useState } from 'react';
import { Button, ErrorText } from '../../ui/primitives';
import { PeriodsManager } from '../../schedule/PeriodsManager';
import { useSupabaseTable } from '../../../hooks/useSupabaseTable';
import { useAppStore } from '../../../store/appStore';
import type { Period } from '../../../types/database';

export function StepPeriods({ schoolYearId, onNext, onBack }: { schoolYearId: string; onNext: () => void; onBack: () => void }) {
  const { rows: periods } = useSupabaseTable<Period>('periods', 'school_year_id', schoolYearId);
  const { updateProfile } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (periods.length === 0) {
      setError('Add at least one class before continuing.');
      return;
    }
    if (periods.some((p) => !p.class_name.trim())) {
      setError('Give every period a class name.');
      return;
    }
    setError(null);
    await updateProfile({ setup_step: 4 });
    onNext();
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Your classes</h2>
      <p className="mt-1.5 text-sm text-slate">
        Each period is one permanent class — it'll be the same class all year, referenced by your rotating schedule.
      </p>

      <div className="mt-6">
        <PeriodsManager schoolYearId={schoolYearId} />
      </div>

      <ErrorText>{error}</ErrorText>
      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>Continue</Button>
      </div>
    </div>
  );
}
