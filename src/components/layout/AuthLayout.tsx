import type { ReactNode } from 'react';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 h-11 w-11 rounded-2xl bg-navy" aria-hidden />
          <h1 className="font-display text-[28px] leading-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate">{subtitle}</p>}
        </div>
        <div className="rounded-2xl border border-slate/15 bg-white p-6 shadow-panel">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-slate">{footer}</div>}
      </div>
    </div>
  );
}
