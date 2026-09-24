import { Button } from '../../ui/primitives';
import { DayTemplateBuilder } from '../../schedule/DayTemplateBuilder';
import { useAppStore } from '../../../store/appStore';

export function StepDayTemplates({
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
    await updateProfile({ setup_step: 5 });
    onNext();
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Day 1–4 schedule</h2>
      <p className="mt-1.5 text-sm text-slate">
        Blocks stay in the same order every day — only which period fills each block changes.
      </p>

      <DayTemplateBuilder schoolYearId={schoolYearId} />

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>Continue</Button>
      </div>
    </div>
  );
}
