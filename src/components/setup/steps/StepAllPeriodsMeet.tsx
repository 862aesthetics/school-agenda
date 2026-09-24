import { Button } from '../../ui/primitives';
import { AllPeriodsMeetManager } from '../../schedule/AllPeriodsMeetManager';
import { useAppStore } from '../../../store/appStore';

export function StepAllPeriodsMeet({
  schoolYearId,
  onNext,
  onBack,
}: {
  schoolYearId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const { updateProfile } = useAppStore();

  async function handleContinue() {
    await updateProfile({ setup_step: 6 });
    onNext();
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">All Periods Meet</h2>
      <p className="mt-1.5 text-sm text-slate">
        A separate special-day schedule, completely apart from the Day 1–4 rotation. You can leave this for later and
        assign it as a date override when you need it.
      </p>

      <div className="mt-5">
        <AllPeriodsMeetManager schoolYearId={schoolYearId} />
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>Continue</Button>
      </div>
    </div>
  );
}
