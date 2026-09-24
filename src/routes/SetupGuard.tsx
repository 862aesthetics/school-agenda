import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

/** Wraps the main app (Welcome, Dashboard, Schedule, etc.) — sends first-time users to setup. */
export function SetupGuard({ children }: { children: ReactNode }) {
  const { profile, loading } = useAppStore();
  if (loading) return null;
  if (profile && !profile.setup_completed) return <Navigate to="/setup" replace />;
  return <>{children}</>;
}

/** Wraps /setup itself — once setup is done, there's no reason to re-enter the wizard. */
export function RequireIncompleteSetup({ children }: { children: ReactNode }) {
  const { profile, loading } = useAppStore();
  if (loading) return null;
  if (profile?.setup_completed) return <Navigate to="/" replace />;
  return <>{children}</>;
}
