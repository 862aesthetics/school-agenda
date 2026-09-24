import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { cacheKey, readCache, writeCache, enqueueMutation, pendingCount } from '../lib/offline/db';
import { flushQueue } from '../lib/offline/syncQueue';
import { useSyncStore } from '../store/syncStore';

interface Row {
  id: string;
}

interface Options {
  orderBy?: string;
  ascending?: boolean;
  /** Set false to skip fetching (e.g. while a required parent id isn't known yet). */
  enabled?: boolean;
}

/**
 * A reusable data hook: fetches rows filtered by one column, keeps a local
 * cache for offline reads, subscribes to realtime changes for cross-device
 * sync, and queues writes made while offline so they replay once reconnected.
 */
export function useSupabaseTable<T extends Row>(
  table: string,
  filterColumn: string,
  filterValue: string | null,
  options: Options = {}
) {
  const { orderBy, ascending = true, enabled = true } = options;
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFlushedAt = useSyncStore((s) => s.lastFlushedAt);
  const rowsRef = useRef<T[]>([]);
  rowsRef.current = rows;

  const key = filterValue ? cacheKey(table, filterColumn, filterValue) : null;

  const fetchRows = useCallback(async () => {
    if (!enabled || !filterValue || !key) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from(table).select('*').eq(filterColumn, filterValue);
      if (orderBy) query = query.order(orderBy, { ascending });
      const { data, error: err } = await query;
      if (err) throw err;
      setRows((data ?? []) as T[]);
      void writeCache(key, (data ?? []) as Record<string, unknown>[]);
    } catch {
      const cached = await readCache(key);
      if (cached) {
        setRows(cached as T[]);
      } else {
        setError('Could not load this data. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filterColumn, filterValue, orderBy, ascending, enabled, key]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows, lastFlushedAt]);

  // Realtime: reflect changes made on this device or another one.
  useEffect(() => {
    if (!enabled || !filterValue) return;
    const channel = supabase
      .channel(`${table}:${filterColumn}:${filterValue}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `${filterColumn}=eq.${filterValue}` },
        (payload) => {
          setRows((current) => {
            let next = current;
            if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as Row).id;
              next = current.filter((r) => r.id !== oldId);
            } else {
              const incoming = payload.new as T;
              const exists = current.some((r) => r.id === incoming.id);
              next = exists ? current.map((r) => (r.id === incoming.id ? incoming : r)) : [...current, incoming];
            }
            if (key) void writeCache(key, next as unknown as Record<string, unknown>[]);
            return next;
          });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, filterColumn, filterValue, enabled, key]);

  const insert = useCallback(
    async (payload: Partial<T>) => {
      const id = (payload.id as string) ?? crypto.randomUUID();
      const full = { ...payload, id } as T;
      setRows((current) => {
        const next = [...current, full];
        if (key) void writeCache(key, next as unknown as Record<string, unknown>[]);
        return next;
      });
      const { error: err } = await supabase.from(table).insert(full);
      if (err) {
        await enqueueMutation({
          id: crypto.randomUUID(),
          table,
          type: 'insert',
          payload: full as unknown as Record<string, unknown>,
          matchId: id,
          createdAt: Date.now(),
        });
        useSyncStore.getState().setPendingCount(await pendingCount());
      }
      return full;
    },
    [table, key]
  );

  const update = useCallback(
    async (id: string, patch: Partial<T>) => {
      setRows((current) => {
        const next = current.map((r) => (r.id === id ? { ...r, ...patch } : r));
        if (key) void writeCache(key, next as unknown as Record<string, unknown>[]);
        return next;
      });
      // supabase-js's update() overloads can't verify a generic Partial<T> at compile
      // time; the runtime call is safe since patch always comes from a typed caller.
      const { error: err } = await supabase.from(table).update(patch as never).eq('id', id);
      if (err) {
        await enqueueMutation({
          id: crypto.randomUUID(),
          table,
          type: 'update',
          payload: patch as unknown as Record<string, unknown>,
          matchId: id,
          createdAt: Date.now(),
        });
        useSyncStore.getState().setPendingCount(await pendingCount());
      }
    },
    [table, key]
  );

  const remove = useCallback(
    async (id: string) => {
      setRows((current) => {
        const next = current.filter((r) => r.id !== id);
        if (key) void writeCache(key, next as unknown as Record<string, unknown>[]);
        return next;
      });
      const { error: err } = await supabase.from(table).delete().eq('id', id);
      if (err) {
        await enqueueMutation({
          id: crypto.randomUUID(),
          table,
          type: 'delete',
          payload: {},
          matchId: id,
          createdAt: Date.now(),
        });
        useSyncStore.getState().setPendingCount(await pendingCount());
      }
    },
    [table, key]
  );

  return { rows, loading, error, insert, update, remove, refresh: fetchRows };
}

export function triggerSyncNow(): void {
  void flushQueue();
}
