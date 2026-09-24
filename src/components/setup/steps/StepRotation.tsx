import { Button } from '../../ui/primitives';
import { RotationAnchorEditor } from '../../schedule/RotationAnchorEditor';
import { useAppStore } from '../../../store/appStore';

export function StepRotation({
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
    await updateProfile({ setup_step: 7 });
    onNext();
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Rotation reference point</h2>
      <p className="mt-1.5 text-sm text-slate">
        Tell the app one date and which day it was. Every other date is calculated automatically from there — rotation
        runs Day 4 → Day 3 → Day 2 → Day 1 → Day 4, and skips weekends.
      </p>

      <div className="mt-6">
        <RotationAnchorEditor schoolYearId={schoolYearId} />
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
