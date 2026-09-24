const SWATCHES = [
  { hex: '#FFFFFF', name: 'Paper' },
  { hex: '#242424', name: 'Ink' },
  { hex: '#5C7C89', name: 'Slate' },
  { hex: '#1F4959', name: 'Teal' },
  { hex: '#011425', name: 'Navy' },
];

export function AppearanceSettings() {
  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-slate">
        The look of the app is the same for every account and can't be customized — this keeps the experience
        consistent and focused.
      </p>
      <div className="grid grid-cols-5 gap-2">
        {SWATCHES.map((s) => (
          <div key={s.hex} className="text-center">
            <div className="h-12 w-full rounded-lg border border-slate/15" style={{ backgroundColor: s.hex }} />
            <p className="mt-1 text-[10px] text-slate">{s.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
