import { useState, type FormEvent } from 'react';
import type { IdentityConnection } from '../identity/api';
import type { Member } from './api';

export function PeopleEditor({ members, identities, disabled, onChange }: { members: Member[]; identities: IdentityConnection[]; disabled: boolean; onChange: (members: Member[]) => void }) {
  const [issuer, setIssuer] = useState(''), [subject, setSubject] = useState(''), [editing, setEditing] = useState<number>();
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (members.some((m, index) => index !== editing && m.issuer === issuer && m.subject === subject)) { setError('This user is already associated.'); return; }
    onChange(editing === undefined ? [...members, { issuer, subject }] : members.map((m, index) => index === editing ? { issuer, subject } : m));
    setSubject(''); setEditing(undefined); setError('');
  }
  return <section aria-label="User associations"><h3>Users in this permission group</h3><p className="cp-admin-muted">Match the exact issuer and subject from the user's access token. Each user keeps their own attributes.</p>
    <form className="permission-member-form" onSubmit={submit}><label>Identity provider<select className="cp-admin-input" required disabled={disabled} value={issuer} onChange={e => setIssuer(e.target.value)}><option value="">Select a configured issuer</option>{identities.filter(i => i.enabled).map(i => <option key={i.id} value={i.issuer}>{i.name} · {i.issuer}</option>)}{issuer && !identities.some(i => i.issuer === issuer && i.enabled) ? <option value={issuer}>{issuer} · unavailable</option> : null}</select></label>
      <label>User subject (sub)<input className="cp-admin-input" required maxLength={512} value={subject} disabled={disabled} onChange={e => setSubject(e.target.value)} autoComplete="off" /></label>
      <button className="cp-admin-button" disabled={disabled || !issuer || !subject}>{editing === undefined ? 'Associate user' : 'Update association'}</button>{editing !== undefined ? <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => { setEditing(undefined); setSubject(''); }}>Cancel edit</button> : null}
    </form>{error ? <p role="alert">{error}</p> : null}
    <div className="cp-admin-table-scroll"><table className="cp-admin-table"><thead><tr><th>Subject</th><th>Issuer</th><th>Actions</th></tr></thead><tbody>{members.map((m, index) => <tr key={`${m.issuer}:${m.subject}`}><td><code>{m.subject}</code></td><td>{m.issuer}</td><td className="permission-row-actions"><button className="cp-admin-button cp-admin-button--ghost" disabled={disabled} onClick={() => { setIssuer(m.issuer); setSubject(m.subject); setEditing(index); }}>Edit</button><button className="cp-admin-button cp-admin-button--ghost" disabled={disabled} onClick={() => { onChange(members.filter((_, i) => i !== index)); setEditing(undefined); }}>Remove</button></td></tr>)}</tbody></table></div>
    {!members.length ? <p>No users associated. This grouping grants no user access until its associations are published.</p> : null}
  </section>;
}
