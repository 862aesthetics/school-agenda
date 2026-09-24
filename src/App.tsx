import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useAppStore } from './store/appStore';
import { initSyncEngine } from './lib/offline/syncQueue';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Setup from './pages/Setup';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import SchedulePage from './pages/Schedule';
import AssignmentsPage from './pages/Assignments';
import CalendarPage from './pages/Calendar';
import GradesPage from './pages/Grades';
import NotesPage from './pages/Notes';
import SettingsPage from './pages/settings/Settings';

import { ProtectedRoute } from './routes/ProtectedRoute';
import { SetupGuard, RequireIncompleteSetup } from './routes/SetupGuard';
import { AppShell } from './components/layout/AppShell';

function AppRoutes() {
  const { session, initialized, init } = useAuthStore();
  const { loadForUser, reset } = useAppStore();

  useEffect(() => {
    void init();
    initSyncEngine();
  }, [init]);

  useEffect(() => {
    if (session?.user) {
      void loadForUser(session.user.id);
    } else if (initialized) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, initialized]);

  if (!initialized) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate/20 border-t-teal" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <RequireIncompleteSetup>
              <Setup />
            </RequireIncompleteSetup>
          </ProtectedRoute>
        }
      />

      <Route
        path="/welcome"
        element={
          <ProtectedRoute>
            <SetupGuard>
              <Welcome />
            </SetupGuard>
          </ProtectedRoute>
        }
      />

      {(
        [
          ['/dashboard', Dashboard],
          ['/schedule', SchedulePage],
          ['/assignments', AssignmentsPage],
          ['/calendar', CalendarPage],
          ['/grades', GradesPage],
          ['/notes', NotesPage],
          ['/settings', SettingsPage],
        ] as const
      ).map(([path, Component]) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <SetupGuard>
                <AppShell>
                  <Component />
                </AppShell>
              </SetupGuard>
            </ProtectedRoute>
          }
        />
      ))}

      <Route path="/" element={<Gateway />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Decides where "/" sends a visitor: login, setup, the Welcome gate, or straight to the dashboard. */
function Gateway() {
  const { session } = useAuthStore();
  const { profile, loading } = useAppStore();

  if (!session) return <Navigate to="/login" replace />;
  if (loading) return null;
  if (profile && !profile.setup_completed) return <Navigate to="/setup" replace />;

  const seenWelcome = sessionStorage.getItem('welcomeSeen') === '1';
  return <Navigate to={seenWelcome ? '/dashboard' : '/welcome'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
