import { supabase } from '../supabase';
import { getQueuedMutations, removeMutation, pendingCount, type QueuedMutation } from './db';
import { useSyncStore } from '../../store/syncStore';

let flushing = false;

/** Applies every queued mutation, in the order it was created. Last write wins by construction:
 *  we just replay each queued change against the current server row. */
export async function flushQueue(): Promise<void> {
  if (flushing) return;
  if (!navigator.onLine) return;

  flushing = true;
  useSyncStore.getState().setSyncing(true);

  try {
    const queue = await getQueuedMutations();
    for (const mutation of queue) {
      const ok = await applyMutation(mutation);
      if (ok) {
        await removeMutation(mutation.id);
      } else {
        // Stop on first failure so we don't apply later mutations out of order.
        break;
      }
    }
  } finally {
    flushing = false;
    useSyncStore.getState().setSyncing(false);
    useSyncStore.getState().setPendingCount(await pendingCount());
    useSyncStore.getState().bumpLastFlushedAt();
  }
}

async function applyMutation(mutation: QueuedMutation): Promise<boolean> {
  try {
    if (mutation.type === 'insert') {
      const { error } = await supabase.from(mutation.table).insert(mutation.payload);
      if (error) throw error;
    } else if (mutation.type === 'update') {
      const { error } = await supabase.from(mutation.table).update(mutation.payload).eq('id', mutation.matchId);
      if (error) throw error;
    } else if (mutation.type === 'delete') {
      const { error } = await supabase.from(mutation.table).delete().eq('id', mutation.matchId);
      if (error) throw error;
    }
    return true;
  } catch {
    return false;
  }
}

let listenersAttached = false;

/** Call once at app startup. Flushes on reconnect and periodically as a safety net. */
export function initSyncEngine(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  window.addEventListener('online', () => {
    useSyncStore.getState().setOnline(true);
    void flushQueue();
  });
  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnline(false);
  });

  void pendingCount().then((n) => useSyncStore.getState().setPendingCount(n));

  if (navigator.onLine) void flushQueue();
  setInterval(() => {
    if (navigator.onLine) void flushQueue();
  }, 30_000);
}
