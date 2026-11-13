import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { Building2, Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { ConfirmDialog } from '../../components/ui/dialog/ConfirmDialog';
import { Notice } from '../../components/ui/notice/Notice';
import { OneTimeSecret } from '../../components/ui/secret/OneTimeSecret';
import { TracePager } from '../investigate/TraceUI';
import '../investigate/investigate.css';
import { useAuth } from '../auth/AuthContext';
import { AccountTabs } from './AccountLayout';
import { deliveredAt, DeleteDestinationDialog, environmentLabel } from './EventsExportPage';
import { destinationsKey, eventsExportApi, type Destination, type DestinationInput, type DestinationType, type ExportEnvironment, type OTLPProtocol, type TestResult } from './events-export-api';
import './events-export.css';

const workspacePageSize = 20;
const environments: ExportEnvironment[] = ['production', 'sandbox'];

// Admin 053, items 5 to 11: one destination, new or saved.
export function EventsExportFormPage() {
  const { id } = useParams();
  const auth = useAuth();
  const isNew = id === undefined;
  const destination = useQuery({ queryKey: [...destinationsKey, 'item', id], queryFn: ({ signal }) => eventsExportApi.get(id ?? '', signal), enabled: !isNew });
  if (!isNew && destination.isPending) return <main id="main-content" className="admin-page cp-admin-container"><AccountTabs /><p role="status">Loading the destination…</p></main>;
  if (!isNew && destination.isError) {
    return <main id="main-content" className="admin-page cp-admin-container"><AccountTabs />
      <div className="cp-admin-notice" role="alert">Could not load the destination. <button type="button" className="cp-admin-button cp-admin-button--ghost" onClick={() => void destination.refetch()}>Retry</button></div></main>;
  }
  if (auth.contextLoading) return <main id="main-content" className="admin-page cp-admin-container"><AccountTabs /><p role="status">Loading your workspaces…</p></main>;
  return <DestinationForm key={destination.data?.id ?? 'new'} destination={destination.data} />;
}

type HeaderRow = { name: string; value: string; stored: boolean };

function initialExports(destination?: Destination) {
  const result: Record<string, ExportEnvironment[]> = {};
  for (const item of destination?.exports ?? []) result[item.tenant_id] = [...(result[item.tenant_id] ?? []), item.environment];
  return result;
}

function errorText(e: unknown) {
  if (e instanceof HttpError && e.code === 'endpoint_not_allowed') return 'This endpoint is not allowed. Use an https address that resolves to a public address.';
  if (e instanceof HttpError && e.status === 400) return 'Check the fields: the name, the endpoint and every header need a valid value.';
  if (e instanceof HttpError && e.status === 403 && e.code === 'Forbidden') return 'You can export only the workspaces where you are Admin.';
  // A 403 with no code comes from the WAF in front of the API, for example for an endpoint written as an IP address.
  if (e instanceof HttpError && e.status === 403) return 'The request was refused. If the endpoint is an IP address, use its hostname.';
  if (e instanceof HttpError && e.status === 404) return 'This destination no longer exists.';
  return 'The destination could not be saved. Try again.';
}

function DestinationForm({ destination }: { destination?: Destination }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const location = useLocation();
  const back = () => navigate('/account/events-export');
  const [enabled, setEnabled] = useState(destination?.enabled ?? true);
  const [name, setName] = useState(destination?.name ?? '');
  const [type, setType] = useState<DestinationType>(destination?.type ?? 'otlp');
  const [endpoint, setEndpoint] = useState(destination?.endpoint ?? '');
  const [protocol, setProtocol] = useState<OTLPProtocol>(destination?.otlp_protocol ?? 'http');
  const [headers, setHeaders] = useState<HeaderRow[]>(destination?.headers.map(h => ({ name: h.name, value: '', stored: true })) ?? []);
  const [exports, setExports] = useState<Record<string, ExportEnvironment[]>>(() => initialExports(destination));
  const [workspacePage, setWorkspacePage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tested, setTested] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [secret, setSecret] = useState<string>(() => (location.state as { secret?: string } | null)?.secret ?? '');
  const workspaces = auth.workspaces.filter(w => (w.role ?? 'admin') === 'admin');
  const shown = workspaces.slice((workspacePage - 1) * workspacePageSize, workspacePage * workspacePageSize);

  function input(): DestinationInput {
    return {
      name: name.trim(), type, endpoint: endpoint.trim(), otlp_protocol: type === 'otlp' ? protocol : '', enabled,
      headers: headers.filter(h => h.name.trim() !== '' || h.value !== '').map(h => ({ name: h.name.trim(), value: h.value })),
      exports: workspaces.flatMap(w => (exports[w.tenant_id] ?? []).map(environment => ({ tenant_id: w.tenant_id, environment }))),
    };
  }
  function switchEnvironment(tenantId: string, environment: ExportEnvironment, on: boolean) {
    const current = exports[tenantId] ?? [];
    setExports({ ...exports, [tenantId]: on ? [...current, environment] : current.filter(item => item !== environment) });
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const saved = destination ? await eventsExportApi.update(destination.id, input()) : await eventsExportApi.create(input());
      await client.invalidateQueries({ queryKey: destinationsKey });
      if (saved.secret) navigate(`/account/events-export/${saved.id}`, { replace: true, state: { secret: saved.secret } });
      else back();
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  }
  async function test() {
    setTested(null);
    setTestError('');
    setBusy(true);
    try {
      setTested(await eventsExportApi.test({ ...input(), ...(destination ? { destination_id: destination.id } : {}) }));
    } catch (e) {
      setTestError(errorText(e).replace('could not be saved', 'could not be tested'));
    } finally {
      setBusy(false);
    }
  }
  async function rotate() {
    if (!destination) return;
    setBusy(true);
    try {
      const result = await eventsExportApi.rotateSecret(destination.id);
      setSecret(result.secret);
      setRotating(false);
    } catch {
      setError('The secret could not be replaced. Try again.');
      setRotating(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main id="main-content" className="admin-page cp-admin-container" aria-label={destination?.name ?? 'New destination'} tabIndex={-1}>
      <AccountTabs />
      <header className="access-page-heading">
        <div>
          <h1 className="cp-admin-title">{destination?.name ?? 'New destination'}</h1>
          <p className="cp-admin-muted">Where the calls go, how they are sent and which workspaces send them.</p>
        </div>
        <button type="button" className="cp-admin-button cp-admin-button--secondary access-primary-action" onClick={back}>Back to destinations</button>
      </header>
      {secret ? <OneTimeSecret value={secret} title="Copy the signing secret now. You will not see it again." className="events-export-notice" /> : null}
      {destination?.status === 'failing' ? (
        <Notice tone="error" title="The last deliveries failed." className="events-export-notice">
          {destination.last_error}. Last delivery {deliveredAt(destination.last_delivery_at)}. Calls are kept and sent again for 72 hours.{destination.dropped > 0 ? ` ${destination.dropped} older ${destination.dropped === 1 ? 'call was' : 'calls were'} dropped.` : ''}
        </Notice>
      ) : null}
      <form className="events-export-form" onSubmit={event => void save(event)}>
        <label className="cp-admin-choice"><input className="cp-admin-switch" type="checkbox" role="switch" checked={enabled} disabled={busy} onChange={event => setEnabled(event.target.checked)} /><span className="cp-admin-choice-copy"><strong>Enable destination</strong><small>Send the calls of the chosen workspaces to this destination.</small></span></label>

        <section className="events-export-section" aria-labelledby="destination-connection-title">
          <h2 id="destination-connection-title">Connection</h2>
          <p className="cp-admin-muted">The address of your collector, SIEM or webhook receiver, and how it authenticates the calls.</p>
          <label className="cp-admin-field events-export-field">Destination name<input className="cp-admin-input" value={name} required maxLength={80} disabled={busy} placeholder="Splunk security" onChange={event => setName(event.target.value)} /></label>
          <label className="cp-admin-field events-export-field">Type<SelectMenu block label="Type" value={type} disabled={busy} onChange={value => setType(value as DestinationType)} options={[
            { value: 'otlp', label: 'OpenTelemetry (OTLP) · log records to a collector or a vendor endpoint' },
            { value: 'webhook', label: 'Webhook · a signed JSON POST to your URL' },
          ]} /></label>
          {type === 'otlp' ? (
            <div className="events-export-pair">
              <label className="cp-admin-field">Endpoint URL<input className="cp-admin-input" type="url" required value={endpoint} disabled={busy} placeholder="https://otel-collector.example.com:4318" onChange={event => setEndpoint(event.target.value)} /><small>HTTPS only. The base URL of the OTLP receiver; logs go to its logs path.</small></label>
              <label className="cp-admin-field">Protocol<SelectMenu block label="Protocol" value={protocol} disabled={busy} onChange={value => setProtocol(value as OTLPProtocol)} options={[
                { value: 'http', label: 'HTTP/protobuf · port 4318' },
                { value: 'grpc', label: 'gRPC · port 4317' },
              ]} /></label>
            </div>
          ) : (
            <>
              <label className="cp-admin-field events-export-field">Webhook URL<input className="cp-admin-input" type="url" required value={endpoint} disabled={busy} placeholder="https://hooks.example.com/agent-calls" onChange={event => setEndpoint(event.target.value)} /><small>HTTPS only. Each call is one POST with a JSON body.</small></label>
              <div className="events-export-secret-row">
                <label className="cp-admin-field events-export-field">Signing secret<input className="cp-admin-input account-mono" readOnly value={destination?.type === 'webhook' ? 'whsec_••••••••••••••••' : 'Created when you save. You see it once.'} /></label>
                {destination?.type === 'webhook' ? <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={() => setRotating(true)}>Rotate secret</button> : null}
              </div>
              <small className="cp-admin-muted">Each request has an HMAC-SHA256 signature of its body in a header. Check it to accept only calls sent by this destination.</small>
            </>
          )}
          <h3>Headers</h3>
          <p className="cp-admin-muted">Sent with every request, for example the token your SIEM asks for. Values are stored encrypted and never shown again.</p>
          <div className="events-export-headers">
            {headers.map((header, index) => (
              <div key={index} className="events-export-header-row">
                <label className="cp-admin-field">Header name<input className="cp-admin-input" value={header.name} disabled={busy} placeholder="Authorization" onChange={event => setHeaders(headers.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))} /></label>
                <label className="cp-admin-field">Value<input className="cp-admin-input" type="password" autoComplete="new-password" value={header.value} disabled={busy} required={!header.stored} placeholder={header.stored ? 'Saved value. Leave blank to retain.' : ''} onChange={event => setHeaders(headers.map((item, i) => (i === index ? { ...item, value: event.target.value } : item)))} /></label>
                <button type="button" className="cp-admin-button cp-admin-button--danger-soft" disabled={busy} onClick={() => setHeaders(headers.filter((_, i) => i !== index))}>Remove</button>
              </div>
            ))}
            <button type="button" className="cp-admin-button cp-admin-button--secondary events-export-add" disabled={busy || headers.length >= 20} onClick={() => setHeaders([...headers, { name: '', value: '', stored: false }])}><Plus size={16} aria-hidden="true" />Add header</button>
          </div>
        </section>

        <section className="events-export-section" aria-labelledby="destination-scope-title">
          <h2 id="destination-scope-title">What is exported</h2>
          <p className="cp-admin-muted">Each allowed and denied call of these workspaces and environments, with the agent, the person, the tool, the result and the Reference code.</p>
          <div className="cp-admin-table-scroll cp-admin-switch-table" role="region" aria-label="Workspaces and environments" tabIndex={0}>
            <table className="cp-admin-table">
              <thead><tr><th scope="col">Workspace</th><th scope="col">Production</th><th scope="col">Sandbox</th></tr></thead>
              <tbody>{shown.map(workspace => (
                <tr key={workspace.tenant_id}>
                  <td><div className="account-name"><Building2 size={20} aria-hidden="true" /><span><strong>{workspace.name}</strong><small>{workspace.tenant_id}</small></span></div></td>
                  {environments.map(environment => (
                    <td key={environment}><input className="cp-admin-switch" type="checkbox" role="switch" disabled={busy} aria-label={`Export ${workspace.name} ${environmentLabel(environment)}`} checked={(exports[workspace.tenant_id] ?? []).includes(environment)} onChange={event => switchEnvironment(workspace.tenant_id, environment, event.target.checked)} /></td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="events-export-scope-pager"><TracePager page={workspacePage} size={workspacePageSize} total={workspaces.length} onPage={setWorkspacePage} /></div>
          <small className="cp-admin-muted">The workspaces of your account. A workspace with both switches off sends nothing.</small>
        </section>

        <section className="events-export-section" aria-labelledby="destination-test-title">
          <h2 id="destination-test-title">Test</h2>
          <p className="cp-admin-muted">Sends one sample call, marked as a test, to check the address and the credentials before you save.</p>
          <div><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={busy || endpoint.trim() === '' || name.trim() === ''} onClick={() => void test()}>Send test event</button></div>
          {tested?.delivered ? <Notice tone="info">Delivered. The destination answered{tested.status_code ? ` ${tested.status_code}` : ''} in {tested.duration_ms} ms.</Notice> : null}
          {tested && !tested.delivered ? <Notice tone="error">Not delivered: {tested.error}.</Notice> : null}
          {testError ? <Notice tone="error">{testError}</Notice> : null}
        </section>

        {error ? <Notice tone="error">{error}</Notice> : null}
        <div className="account-actions">
          <button type="submit" className="cp-admin-button" disabled={busy}>{busy ? 'Saving…' : 'Save destination'}</button>
          <span>
            <button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={busy} onClick={back}>Cancel</button>
            {destination ? <button type="button" className="cp-admin-button cp-admin-button--danger-soft" disabled={busy} onClick={() => setDeleting(true)}>Delete destination</button> : null}
          </span>
        </div>
      </form>
      {deleting && destination ? <DeleteDestinationDialog destination={destination} onClose={() => setDeleting(false)} onDeleted={() => { void client.invalidateQueries({ queryKey: destinationsKey }); back(); }} /> : null}
      {rotating ? (
        <ConfirmDialog title="Rotate secret" confirmLabel="Rotate secret" busyLabel="Rotating…" busy={busy} onConfirm={() => void rotate()} onClose={() => setRotating(false)}
          warning={<>Requests signed with the current secret stop passing your check at once. Update your receiver with the new secret.</>}>
          <p>Replace the signing secret of <strong>{destination?.name}</strong>?</p>
        </ConfirmDialog>
      ) : null}
    </main>
  );
}
