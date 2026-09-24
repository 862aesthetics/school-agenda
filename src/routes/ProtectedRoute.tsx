import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, initialized } = useAuthStore();

  if (!initialized) return null; // App.tsx shows a full-screen loader until init completes
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
