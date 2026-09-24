import { create } from 'zustand';

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastFlushedAt: number;
  setOnline: (v: boolean) => void;
  setSyncing: (v: boolean) => void;
  setPendingCount: (n: number) => void;
  bumpLastFlushedAt: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastFlushedAt: 0,
  setOnline: (v) => set({ isOnline: v }),
  setSyncing: (v) => set({ isSyncing: v }),
  setPendingCount: (n) => set({ pendingCount: n }),
  bumpLastFlushedAt: () => set({ lastFlushedAt: Date.now() }),
}));
