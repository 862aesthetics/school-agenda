export function StandardizedNotice({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate/25 px-5 py-8 text-center text-sm text-slate">{text}</div>
  );
}
