const TOTAL_STEPS = 7;

const STEP_LABELS = [
  'Profile',
  'Welcome Screen',
  'Classes',
  'Day 1–4 Schedule',
  'All Periods Meet',
  'Rotation',
  'Confirm',
];

export function SetupProgress({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate">
        <span>
          Step {step} of {TOTAL_STEPS}
        </span>
        <span>{STEP_LABELS[step - 1]}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-teal' : 'bg-slate/15'}`}
          />
        ))}
      </div>
    </div>
  );
}

export { TOTAL_STEPS };
