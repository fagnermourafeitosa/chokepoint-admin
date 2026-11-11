import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import { useAuth } from '../auth/AuthContext';
import { AccountTabs } from './AccountLayout';
import { DeleteAccountDialog } from './dialogs';
import { accountApi, accountKey, previewKey, type Account } from './api';

// Admin 051, items 14 to 17: the profile and the deletion of the account.
export function AccountInfoPage() {
  const auth = useAuth();
  const account = useQuery({ queryKey: [...accountKey, auth.session?.user.id], queryFn: ({ signal }) => accountApi.get(signal) });
  return (
    <main id="main-content" className="admin-page cp-admin-container" aria-label="Account info" tabIndex={-1}>
      <AccountTabs />
      <header className="access-page-heading">
        <div>
          <h1 className="cp-admin-title">Account info</h1>
          <p className="cp-admin-muted">Your name and the email you sign in with.</p>
        </div>
      </header>
      {account.isPending ? <p role="status">Loading your account…</p>
        : account.isError ? <div className="cp-admin-notice" role="alert">Could not load your account. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void account.refetch()}>Retry</button></div>
          : <AccountForm key={account.data.display_name} account={account.data} />}
    </main>
  );
}

function AccountForm({ account }: { account: Account }) {
  const auth = useAuth();
  const client = useQueryClient();
  const [name, setName] = useState(account.display_name);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; text: string }>();
  const [deleting, setDeleting] = useState(false);
  const preview = useQuery({ queryKey: [...previewKey, auth.session?.user.id], queryFn: ({ signal }) => accountApi.preview(signal), enabled: deleting });
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice(undefined);
    try {
      const saved = await accountApi.rename(name.trim());
      setName(saved.display_name);
      setNotice({ tone: 'success', text: 'Your name is saved.' });
      void client.invalidateQueries({ queryKey: ['auth', 'session'] });
    } catch (e) {
      setNotice({ tone: 'danger', text: e instanceof HttpError && e.status === 400 ? 'Use a name of 1 to 100 characters.' : 'Your name could not be saved. Try again.' });
    } finally {
      setBusy(false);
    }
  }
  return <>
    <form className="account-form" onSubmit={event => void save(event)}>
      <section className="account-section" aria-labelledby="account-profile-title">
        <h2 id="account-profile-title">Profile</h2>
        <p className="cp-admin-muted">People of your workspaces see this name in the revision history and the Inbox.</p>
        <label className="cp-admin-field account-name-field">Name<input className="cp-admin-input" value={name} required maxLength={100} disabled={busy} onChange={event => setName(event.target.value)} /></label>
        <label className="cp-admin-field account-name-field">Email<input className="cp-admin-input" value={account.email} readOnly /></label>
        <small className="cp-admin-muted">You sign in with this email.</small>
        {notice ? <p role={notice.tone === 'danger' ? 'alert' : 'status'} className={`cp-admin-notice cp-admin-notice--${notice.tone}`}>{notice.text}</p> : null}
      </section>
      <div className="account-actions">
        <button type="submit" className="cp-admin-button" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>
    <section className="account-section account-danger" aria-labelledby="account-delete-title">
      <h2 id="account-delete-title">Delete account</h2>
      <p className="cp-admin-muted">Deletes your account and your access to every workspace.</p>
      <button type="button" className="cp-admin-button cp-admin-button--danger-soft" onClick={() => setDeleting(true)}>Delete account</button>
    </section>
    {deleting ? <DeleteAccountDialog email={account.email} preview={preview.data?.workspaces} previewFailed={preview.isError} onClose={() => setDeleting(false)} onDeleted={() => window.dispatchEvent(new Event('auth-expired'))} /> : null}
  </>;
}
