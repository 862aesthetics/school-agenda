import { useEffect, useState } from 'react';
import { useSyncStore } from '../../store/syncStore';
import clsx from 'clsx';

export function TopStatusBar({ compact = false }: { compact?: boolean }) {
  const { isOnline, isSyncing, pendingCount } = useSyncStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  let label = 'Synced';
  let dotClass = 'bg-emerald-500';
  if (!isOnline) {
    label = pendingCount > 0 ? `Offline · ${pendingCount} change${pendingCount === 1 ? '' : 's'} saved` : 'Offline';
    dotClass = 'bg-slate/60';
  } else if (isSyncing) {
    label = 'Syncing…';
    dotClass = 'bg-amber-500 animate-pulse';
  }

  if (compact) {
    return <span className={clsx('h-2 w-2 rounded-full', dotClass)} aria-label={label} title={label} />;
  }

  return (
    <div className="flex items-center gap-4 text-xs text-slate">
      <time dateTime={now.toISOString()} className="tabular-nums">
        {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </time>
      <div className="flex items-center gap-1.5">
        <span className={clsx('h-1.5 w-1.5 rounded-full', dotClass)} />
        {label}
      </div>
    </div>
  );
}
