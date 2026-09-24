import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/primitives';
import { ConfirmDialog } from '../../components/ui/Modal';

export function AccountSecurity() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [resetSent, setResetSent] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  async function handleSendReset() {
    if (!user?.email) return;
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetSent(true);
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const { error: err } = await supabase.rpc('delete_user_account');
    if (err) {
      setDeleting(false);
      setError('Something went wrong. Please try again.');
      return;
    }
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="max-w-md space-y-8">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Account</h2>
        <p className="text-sm text-slate">{user?.email}</p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Password</h2>
        {resetSent ? (
          <p className="text-sm text-slate">Check your email for a reset link.</p>
        ) : (
          <Button variant="secondary" onClick={handleSendReset}>
            Send password reset email
          </Button>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ink">Session</h2>
        <Button variant="secondary" onClick={handleLogout}>
          Log out
        </Button>
      </section>

      <section className="rounded-xl border border-red-200 p-4">
        <h2 className="mb-1 text-sm font-semibold text-red-700">Delete account</h2>
        <p className="mb-3 text-sm text-slate">
          This permanently deletes your account and every class, schedule, assignment, grade, and note tied to it.
          This can't be undone.
        </p>
        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
        <Button variant="danger" onClick={() => setConfirmingDelete(true)} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete my account'}
        </Button>
      </section>

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
        title="Delete your account?"
        description="Type DELETE to confirm. This permanently removes your account and all of its data."
        confirmLabel="Delete permanently"
        danger
        requireTypedWord="DELETE"
      />
    </div>
  );
}
