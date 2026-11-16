import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { Notice } from '../../components/ui/notice/Notice';
import type { EnvironmentScope } from '../access/environment-scope';
import { SlackGuide } from './SlackGuide';
import { appName, neverRequested, signalChoices, slackScopes } from './slackManifest';
import { saveErrors, slackApi, slackErrorText, slackKey, type DestinationKind, type SlackConfig, type SlackInput } from './api';

const kinds: { value: DestinationKind; label: string; field: string; placeholder: string; help: string }[] = [
  { value: 'channel', label: 'Channel · public or private', field: 'Channel ID', placeholder: 'C08K2M4QF1A', help: 'In Slack, open the channel, click its name and copy the Channel ID at the bottom.' },
  { value: 'group', label: 'Group message · up to 8 people', field: 'Member IDs', placeholder: 'U07AB12CD3E, U07FG45HI6J', help: 'Separate the IDs with commas. In Slack, open each profile, click the three dots and choose Copy member ID.' },
  { value: 'person', label: 'Person · direct message', field: 'Member ID', placeholder: 'U07AB12CD3E', help: 'In Slack, open the profile, click the three dots and choose Copy member ID. The message arrives in the direct message with the app.' },
];

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="identity-section-heading"><h2>{title}</h2><p>{description}</p></div>;
}

// The ID text of the stored destination, as the field shows it.
const idsOf = (c: SlackConfig | null) => !c ? '' : c.destination.kind === 'channel' ? c.destination.channel_id ?? '' : (c.destination.member_ids ?? []).join(', ');

export function SlackForm({ scope, config, workspace, environment, onDone }: { scope: EnvironmentScope; config: SlackConfig | null; workspace: string; environment: string; onDone: () => void }) {
  const client = useQueryClient();
  const name = appName(workspace);
  const [kind, setKind] = useState<DestinationKind>(config?.destination.kind ?? 'channel');
  const [ids, setIds] = useState(idsOf(config));
  const [types, setTypes] = useState<string[]>(config?.signal_types ?? signalChoices.filter(s => s.on).map(s => s.type));
  const [token, setToken] = useState('');
  const [changingToken, setChangingToken] = useState(!config?.token_configured);
  const [busy, setBusy] = useState<'save' | 'test'>();
  const [error, setError] = useState<string>();
  const [test, setTest] = useState<{ ok: boolean; text: string }>();
  const destination = kinds.find(k => k.value === kind) ?? kinds[0];
  const input = (): SlackInput => {
    const values = ids.split(',').map(v => v.trim()).filter(Boolean);
    return {
      destination: kind === 'channel' ? { kind, channel_id: values[0] ?? '' } : { kind, member_ids: values },
      signal_types: signalChoices.map(s => s.type).filter(t => types.includes(t)),
      token: changingToken ? token.trim() : undefined,
    };
  };
  const failed = (e: unknown) => setError(e instanceof HttpError && e.code && saveErrors[e.code] ? saveErrors[e.code] : 'Could not reach the server. Try again.');
  const sendTest = async () => {
    setBusy('test'); setError(undefined); setTest(undefined);
    try {
      const result = await slackApi.test(scope, input());
      setTest(result.delivered ? { ok: true, text: 'The test message arrived in Slack.' } : { ok: false, text: slackErrorText(result.error) });
    } catch (e) { failed(e); } finally { setBusy(undefined); }
  };
  const save = async () => {
    setBusy('save'); setError(undefined);
    try {
      client.setQueryData(slackKey(scope), await slackApi.save(scope, input()));
      onDone();
    } catch (e) { failed(e); setBusy(undefined); }
  };
  return <form className="cp-admin-panel identity-form identity-form-redesign" onSubmit={e => { e.preventDefault(); void save(); }}>
    <SlackGuide name={name} />
    <div className="identity-form-section">
      <SectionHeading title="What the app can do in Slack" description="The manifest asks Slack for these two scopes and no other. Your Slack admin sees the same list when approving the app." />
      <div className="identity-form-fields">
        <div className="cp-admin-table-scroll" role="region" aria-label="Slack scopes" tabIndex={0}><table className="cp-admin-table ea-scopes">
          <thead><tr><th>Scope</th><th>Allows</th></tr></thead>
          <tbody>{slackScopes.map(s => <tr key={s.scope}><td><code>{s.scope}</code></td><td>{s.allows}</td></tr>)}</tbody>
        </table></div>
        <p className="ea-not-requested"><strong>Never requested:</strong> {neverRequested}</p>
        <Notice tone="info" title="Nothing is retained">The messages are sent to Slack and not kept here. Nothing is read from Slack, so nothing from Slack is stored.</Notice>
      </div>
    </div>
    <div className="identity-form-section">
      <SectionHeading title="Where messages go" description="One destination for this environment." />
      <div className="identity-form-fields">
        <small className="cp-admin-muted">{workspace} / {environment}</small>
        <label className="cp-admin-field">Send to<SelectMenu block label="Send to" value={kind} disabled={!!busy} onChange={v => { setKind(v as DestinationKind); setIds(''); setTest(undefined); }} options={kinds.map(k => ({ value: k.value, label: k.label }))} /></label>
        <label className="cp-admin-field">{destination.field}<input className="cp-admin-input identity-mono" required placeholder={destination.placeholder} value={ids} disabled={!!busy} onChange={e => { setIds(e.target.value); setTest(undefined); }} /><small>{destination.help}</small></label>
        {kind === 'channel' ? <Notice tone="warning" title="Add the app to this channel in Slack"><span>Choosing the channel here does not add the app to it, and Slack lets the app post only in channels it is a member of. In the channel, type <code>/invite @{name}</code>. Without it, Slack rejects every message to the channel.</span></Notice> : null}
      </div>
    </div>
    <div className="identity-form-section">
      <SectionHeading title="What to send" description="Choose which Inbox signals become a Slack message. Each new signal sends one message with a link to it." />
      <div className="identity-form-fields ea-signals">
        {signalChoices.map(s => <label key={s.type} className="cp-admin-choice"><input className="cp-admin-switch" type="checkbox" role="switch" checked={types.includes(s.type)} disabled={!!busy} onChange={e => setTypes(current => e.target.checked ? [...current, s.type] : current.filter(t => t !== s.type))} /><span className="cp-admin-choice-copy"><strong>{s.label}</strong><small>{s.description}</small></span></label>)}
      </div>
    </div>
    <div className="identity-form-section ea-credentials">
      <SectionHeading title="App credentials" description="The token of the Slack app that sends the messages." />
      <div className="identity-form-fields">
        <label className="cp-admin-field">Bot User OAuth Token{changingToken
          ? <input className="cp-admin-input" type="password" autoComplete="new-password" required={!config?.token_configured} placeholder="xoxb-…" value={token} disabled={!!busy} onChange={e => { setToken(e.target.value); setTest(undefined); }} />
          : <span className="identity-secret-row"><input className="cp-admin-input" type="password" disabled value="••••••••••••" aria-label="Stored token" /><button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => setChangingToken(true)}>Change</button></span>}
          <small>OAuth &amp; Permissions, OAuth Tokens. Stored encrypted. It cannot be displayed after you save.</small></label>
        <div className="identity-inline-check"><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={!!busy || !ids.trim() || (changingToken && !token.trim())} onClick={() => void sendTest()}>{busy === 'test' ? 'Sending…' : 'Send test message'}</button></div>
        {test ? <Notice tone={test.ok ? 'info' : 'warning'}>{test.text}</Notice> : null}
      </div>
    </div>
    {error ? <Notice tone="error">{error}</Notice> : null}
    {/* An editor of one item: Cancel and Save on the right (docs/design-system/layouts.md). */}
    <footer className="identity-form-actions ea-footer"><span /><button type="button" className="cp-admin-button cp-admin-button--ghost" disabled={busy === 'save'} onClick={onDone}>Cancel</button><button className="cp-admin-button" type="submit" disabled={!!busy}>{busy === 'save' ? 'Saving…' : 'Save'}</button></footer>
  </form>;
}
