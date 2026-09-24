import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';
import type { AvatarShape } from '../../types/database';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none';
  const variants: Record<string, string> = {
    primary: 'bg-teal text-white hover:bg-navy active:bg-navy',
    secondary: 'bg-white text-teal border border-slate/30 hover:border-teal',
    ghost: 'text-slate hover:text-teal hover:bg-slate/10',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  };
  const sizes: Record<string, string> = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3',
  };
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-lg border border-slate/30 bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-slate/60',
        'focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-lg border border-slate/30 bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-slate/60',
        'focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20',
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        'w-full rounded-lg border border-slate/30 bg-white px-3.5 py-2.5 text-[15px] text-ink',
        'focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-red-600">{children}</p>;
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
export function Avatar({
  url,
  name,
  shape = 'circle',
  size = 40,
}: {
  url?: string | null;
  name?: string | null;
  shape?: AvatarShape;
  size?: number;
}) {
  const radius = shape === 'circle' ? '9999px' : shape === 'rounded' ? '10px' : '0px';
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden bg-teal text-white font-medium"
      style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.4 }}
    >
      {url ? (
        <img src={url} alt={name ?? 'Profile'} className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton rounded-md', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate/15 p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate/25 px-5 py-8 text-center">
      <p className="text-sm font-medium text-slate">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate/70">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge (priority, sync state, etc.)
// ---------------------------------------------------------------------------
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'teal' | 'amber' | 'red' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-slate/10 text-slate',
    teal: 'bg-teal/10 text-teal',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  );
}
