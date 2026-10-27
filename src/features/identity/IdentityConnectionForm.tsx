import { usePendingChanges } from "../auth/pending/PendingChanges";
import { useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import type { IdentityConnection, IdentityFields } from './api';
import './identity.css';
type Props = { connection?: IdentityConnection; pending: boolean; error: string; onSave: (fields: IdentityFields) => Promise<void>; onCheck: (fields: IdentityFields) => Promise<boolean>; onCancel: () => void };
export function IdentityConnectionForm({ connection, pending, error, onSave, onCheck, onCancel }: Props) {
 const auth = useAuth();
 const [name, setName] = useState(connection?.name ?? '');
 const [issuer, setIssuer] = useState(connection?.issuer ?? '');
 const [audiences, setAudiences] = useState(connection?.audiences ?? ['']);
 const [groups, setGroups] = useState(connection?.groups_claim ?? '');
 const [enabled, setEnabled] = useState(connection?.enabled ?? true);
 const currentFields = JSON.stringify({ name, issuer, audiences, groups, enabled });
 const [initialFields] = useState(currentFields);
 usePendingChanges(pending || currentFields !== initialFields);
 const [checked, setChecked] = useState(false);
 const [localError, setLocalError] = useState('');
 const environment = auth.environment?.name === 'production' ? 'Production' : 'Sandbox';
 const fields = (): IdentityFields => ({ name: name.trim(), issuer, audiences, groups_claim: groups, enabled, revision: connection?.revision ?? 0 });
 function changed() { setChecked(false); setLocalError(''); }
 async function check() {
  const input = fields();
  if (!input.name || !input.issuer || input.audiences.some(a => !a.trim())) { setLocalError('Enter a name, issuer and at least one audience before checking.'); return; }
  setChecked(await onCheck(input));
 }
 return <section className="identity-editor" aria-label={connection ? 'Edit identity provider' : 'Connect identity provider'}>
  <button className="identity-back" onClick={onCancel} disabled={pending}><ArrowLeft size={16} />Identity providers</button>
  <header><h1 className="cp-admin-title">{connection ? 'Edit identity provider' : 'Connect identity provider'}</h1><p className="cp-admin-muted">Trust an OIDC issuer for incoming MCP requests.</p></header>
  <div className="identity-editor-layout">
   <form className="cp-admin-panel identity-form" onSubmit={event => { event.preventDefault(); void onSave(fields()); }}>
    <h2>Connection details</h2>
    <fieldset disabled={pending}>
     <label className="cp-admin-field">Connection name<input className="cp-admin-input" required maxLength={80} value={name} onChange={e => { setName(e.target.value); changed(); }} autoFocus /><small>A name to identify this connection.</small></label>
     <label className="cp-admin-field">Issuer URL<input className="cp-admin-input identity-mono" type="url" required maxLength={2048} placeholder="https://sso.example.com/realms/workforce" value={issuer} onChange={e => { setIssuer(e.target.value); changed(); }} /><small>Use the exact issuer published by your identity provider.</small></label>
     <div className="identity-audiences"><span className="identity-field-label">Accepted audiences</span>{audiences.map((audience, index) => <div className="identity-audience-row" key={index}><input className="cp-admin-input identity-mono" aria-label={`Accepted audience ${index + 1}`} required maxLength={2048} value={audience} onChange={e => { setAudiences(values => values.map((value, i) => i === index ? e.target.value : value)); changed(); }} placeholder="https://gateway.example.com/mcp" /><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={audiences.length === 1} aria-label={`Remove audience ${index + 1}`} onClick={() => { setAudiences(values => values.filter((_, i) => i !== index)); changed(); }}><X size={16} /></button></div>)}<button className="identity-text-button" type="button" disabled={audiences.length >= 10} onClick={() => { setAudiences(values => [...values, '']); changed(); }}><Plus size={15} />Add audience</button><small>The resource identifiers accepted in access tokens.</small></div>
     <label className="cp-admin-field">Groups claim (optional)<input className="cp-admin-input" maxLength={128} placeholder="groups" value={groups} onChange={e => { setGroups(e.target.value); changed(); }} /><small>Read group membership from this verified token claim.</small></label>
     <label className="cp-admin-choice identity-enable"><input className="cp-admin-switch" type="checkbox" role="switch" checked={enabled} onChange={e => setEnabled(e.target.checked)} /><span className="cp-admin-choice-copy"><strong>Enable connection</strong><small>Accept valid access tokens from this issuer in {environment}.</small></span></label>
    </fieldset>
    {error || localError ? <p className="cp-admin-notice cp-admin-notice--danger" role="alert">{error || localError}</p> : null}
    {checked ? <p className="cp-admin-notice cp-admin-notice--success" role="status">Issuer metadata and public keys verified. Token audiences and user authentication were not tested.</p> : null}
    <footer className="identity-form-actions"><button className="cp-admin-button cp-admin-button--secondary" type="button" disabled={pending} onClick={() => void check()}>{pending ? 'Working…' : 'Check configuration'}</button><span /><button className="cp-admin-button cp-admin-button--ghost" type="button" disabled={pending} onClick={onCancel}>Cancel</button><button className="cp-admin-button" type="submit" disabled={pending}>{pending ? 'Working…' : connection ? 'Save changes' : 'Create connection'}</button></footer>
   </form>
   <aside className="identity-scope" aria-label="Connection scope"><span className="cp-admin-label">CONNECTION SCOPE</span><p><strong>{auth.workspace?.name}</strong><span className="mcp-badge">{environment}</span></p><p className="cp-admin-muted">This connection applies only to this environment.</p><hr /><h2>OIDC <span className="mcp-badge">Signed JWT</span></h2><p className="cp-admin-muted">Keys and issuer metadata are discovered from your provider.</p></aside>
  </div>
 </section>;
}
