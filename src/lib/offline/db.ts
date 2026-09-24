import { openDB, type IDBPDatabase } from 'idb';

export interface QueuedMutation {
  id: string; // also doubles as the record's own id for inserts
  table: string;
  type: 'insert' | 'update' | 'delete';
  payload: Record<string, unknown>;
  matchId: string; // the row id this mutation targets (== id for inserts)
  createdAt: number;
}

interface CacheEntry {
  key: string; // `${table}::${filterColumn}::${filterValue}`
  rows: Record<string, unknown>[];
  savedAt: number;
}

const DB_NAME = 'school-agenda-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('outbox')) {
          const store = db.createObjectStore('outbox', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

export function cacheKey(table: string, filterColumn: string, filterValue: string | null): string {
  return `${table}::${filterColumn}::${filterValue ?? 'none'}`;
}

export async function readCache(key: string): Promise<Record<string, unknown>[] | null> {
  try {
    const db = await getDb();
    const entry = (await db.get('cache', key)) as CacheEntry | undefined;
    return entry?.rows ?? null;
  } catch {
    return null;
  }
}

export async function writeCache(key: string, rows: Record<string, unknown>[]): Promise<void> {
  try {
    const db = await getDb();
    await db.put('cache', { key, rows, savedAt: Date.now() } satisfies CacheEntry);
  } catch {
    // Best-effort. A cache miss just means the next online fetch repopulates it.
  }
}

export async function enqueueMutation(mutation: QueuedMutation): Promise<void> {
  const db = await getDb();
  await db.put('outbox', mutation);
}

export async function getQueuedMutations(): Promise<QueuedMutation[]> {
  const db = await getDb();
  return (await db.getAllFromIndex('outbox', 'createdAt')) as QueuedMutation[];
}

export async function removeMutation(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('outbox', id);
}

export async function pendingCount(): Promise<number> {
  const db = await getDb();
  return db.count('outbox');
}
