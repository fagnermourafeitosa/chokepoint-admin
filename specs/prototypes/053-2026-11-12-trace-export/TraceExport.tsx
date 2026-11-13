import { useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router';
import { Building2, Plus, Send, TriangleAlert, UserRound } from 'lucide-react';
import '../../../src/layouts/admin-layout.css';
import '../../../src/components/header/admin-header.css';
import '../../../src/features/investigate/investigate.css';
import { Wordmark } from '../../../src/components/brand/Wordmark';
import { Dropdown } from '../../../src/components/ui/dropdown/Dropdown';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { ConfirmDialog } from '../../../src/components/ui/dialog/ConfirmDialog';
import { TracePager } from '../../../src/features/investigate/TraceUI';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import { account, destinations, workspaces, type Destination, type DestinationStatus, type DestinationType, type Environment, type Header } from './data';
import './trace-export.css';

// Admin 053 prototype: the Events export tab of the account area (Admin 051 layout).
// Fixed data; no API call writes data.
const base = '/prototype/account/events-export';

const typeLabel: Record<DestinationType, string> = { otlp: 'OTLP', webhook: 'Webhook' };
const statusBadge: Record<DestinationStatus, { label: string; tone?: string }> = {
  delivering: { label: 'Delivering', tone: 'success' },
  failing: { label: 'Failing', tone: 'danger' },
  disabled: { label: 'Disabled' },
};
const workspaceName = (tenantId: string) => workspaces.find(item => item.tenantId === tenantId)?.name ?? tenantId;
const exported = (destination: Destination) => Object.entries(destination.exports).flatMap(([tenantId, environments]) => environments.map(environment => [tenantId, environment] as const));
const environmentName = (environment: string) => (environment === 'sandbox' ? 'Sandbox' : 'Production');

function AccountHeader() {
  return (
    <header className="cp-admin-topbar">
      <div className="cp-admin-topbar-inner admin-topbar-inner">
        <Link className="cp-admin-brand" to="/account/workspaces" aria-label="Account home"><Wordmark /></Link>
        <span className="admin-nav-divider" aria-hidden="true" />
        <span className="trace-export-topbar-title">Account</span>
        <div className="admin-nav-actions">
          <Dropdown group="account-header" label="Open profile" triggerClassName="admin-account" trigger={account.email.charAt(0).toUpperCase()}>
            <div className="admin-profile"><strong>Account</strong><span>{account.email}</span></div>
            <button type="button" className="admin-dropdown-option">Sign out</button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

// The account area tabs, with Events export between Workspaces and Account info.
function AccountTabs() {
  const navigate = useNavigate();
  return (
    <div className="cp-admin-inner-tabs trace-export-tabs" role="group" aria-label="Account sections">
      <button type="button" onClick={() => navigate('/account/workspaces')}><Building2 size={17} aria-hidden="true" />Workspaces</button>
      <button type="button" aria-current="page" onClick={() => navigate(base)}><Send size={17} aria-hidden="true" />Events export</button>
      <button type="button" onClick={() => navigate('/account/info')}><UserRound size={17} aria-hidden="true" />Account info</button>
    </div>
  );
}

function DeleteDestinationDialog({ destination, onClose }: { destination: Destination; onClose: () => void }) {
  return (
    <ConfirmDialog title="Delete destination" confirmLabel="Delete destination" onConfirm={onClose} onClose={onClose}
      warning={<>Calls of {Object.keys(destination.exports).map(workspaceName).join(', ')} stop going to {destination.endpoint} at once. Events not delivered yet are dropped.</>}>
      <p>Delete <strong>{destination.name}</strong>? This removes its settings and its credentials.</p>
    </ConfirmDialog>
  );
}

function DestinationList() {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState<Destination | null>(null);
  return (
    <main id="main-content" className="admin-page cp-admin-container" aria-label="Events export" tabIndex={-1}>
      <AccountTabs />
      <header className="access-page-heading">
        <div>
          <h1 className="cp-admin-title">Events export</h1>
          <p className="cp-admin-muted">Send each allowed and denied call of your workspaces to your SIEM or observability tool, by OpenTelemetry (OTLP) or webhook.</p>
        </div>
        <span className="trace-export-cell-chip">
          <WaitingBackend spec="086" tip="Creates a destination that receives the calls of the workspaces you choose." />
          <button type="button" className="cp-admin-button access-primary-action" onClick={() => navigate(`${base}/new`)}><Plus size={16} aria-hidden="true" />Add destination</button>
        </span>
      </header>
      <div className="cp-admin-table-scroll" role="region" aria-label="Destinations" tabIndex={0}>
        <table className="cp-admin-table trace-export-table">
          <thead><tr>
            <th scope="col">Destination</th>
            <th scope="col">Type</th>
            <th scope="col"><span className="trace-export-cell-chip">Workspaces<WaitingBackend spec="086" tip="The workspaces and environments whose calls this destination receives. Only workspaces of your account." /></span></th>
            <th scope="col"><span className="trace-export-cell-chip">Status<WaitingBackend spec="086" tip="Whether the last deliveries reached the destination, and when the last one did." /></span></th>
            <th scope="col">Actions</th>
          </tr></thead>
          <tbody>{destinations.map(destination => (
            <tr key={destination.id}>
              <td><div className="trace-export-name"><Send size={20} aria-hidden="true" /><span><strong>{destination.name}</strong><small>{destination.endpoint}</small></span></div></td>
              <td><span className="mcp-badge">{typeLabel[destination.type]}</span></td>
              <td><div className="trace-export-badges">{exported(destination).map(([tenantId, environment]) => <span key={`${tenantId}-${environment}`} className="mcp-badge">{workspaceName(tenantId)} · {environmentName(environment)}</span>)}</div></td>
              <td><div className="trace-export-status"><span className="mcp-badge" data-tone={statusBadge[destination.status].tone}>{statusBadge[destination.status].label}</span><small>Last delivery {destination.lastDelivery}</small></div></td>
              <td><div className="trace-export-row-actions">
                <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => navigate(`${base}/${destination.id}`)}>Edit</button>
                <button type="button" className="cp-admin-button cp-admin-button--danger-soft cp-admin-button--small" onClick={() => setDeleting(destination)}>Delete</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <TracePager page={1} size={20} total={destinations.length} onPage={() => undefined} />
      {deleting ? <DeleteDestinationDialog destination={deleting} onClose={() => setDeleting(null)} /> : null}
    </main>
  );
}

function HeaderRows({ headers, onChange }: { headers: Header[]; onChange: (headers: Header[]) => void }) {
  return (
    <div className="trace-export-headers">
      {headers.map((header, index) => (
        <div key={index} className="trace-export-header-row">
          <label className="cp-admin-field">Header name<input className="cp-admin-input" value={header.name} placeholder="Authorization" onChange={event => onChange(headers.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))} /></label>
          <label className="cp-admin-field">Value<input className="cp-admin-input" type="password" autoComplete="new-password" value={header.value} placeholder="Saved value. Leave blank to retain." onChange={event => onChange(headers.map((item, i) => (i === index ? { ...item, value: event.target.value } : item)))} /></label>
          <button type="button" className="cp-admin-button cp-admin-button--danger-soft" onClick={() => onChange(headers.filter((_, i) => i !== index))}>Remove</button>
        </div>
      ))}
      <button type="button" className="cp-admin-button cp-admin-button--secondary trace-export-add" onClick={() => onChange([...headers, { name: '', value: '' }])}><Plus size={16} aria-hidden="true" />Add header</button>
    </div>
  );
}

function DestinationForm({ destination }: { destination?: Destination }) {
  const navigate = useNavigate();
  const back = () => navigate(base);
  const [enabled, setEnabled] = useState(destination ? destination.status !== 'disabled' : true);
  const [name, setName] = useState(destination?.name ?? '');
  const [type, setType] = useState<DestinationType>(destination?.type ?? 'otlp');
  const [endpoint, setEndpoint] = useState(destination?.endpoint ?? '');
  const [protocol, setProtocol] = useState(destination?.otlpProtocol ?? 'http');
  const [headers, setHeaders] = useState<Header[]>(destination?.headers ?? []);
  const [exports, setExports] = useState<Record<string, Environment[]>>(destination?.exports ?? {});
  const switchEnvironment = (tenantId: string, environment: Environment, on: boolean) => {
    const current = exports[tenantId] ?? [];
    setExports({ ...exports, [tenantId]: on ? [...current, environment] : current.filter(item => item !== environment) });
  };
  const [tested, setTested] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      {destination?.status === 'failing' ? (
        <div className="cp-admin-notice cp-admin-notice--danger trace-export-notice" role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          <div className="cp-admin-notice-body">
            <strong>The last deliveries failed.</strong>
            <span>{destination.lastError}. Last delivery {destination.lastDelivery}. Calls are kept and sent again for 72 hours.</span>
          </div>
          <WaitingBackend spec="086" tip="The last delivery error of this destination and how long undelivered calls are kept." />
        </div>
      ) : null}
      <form className="trace-export-form" onSubmit={event => { event.preventDefault(); back(); }}>
        <label className="cp-admin-choice"><input className="cp-admin-switch" type="checkbox" role="switch" checked={enabled} onChange={event => setEnabled(event.target.checked)} /><span className="cp-admin-choice-copy"><strong>Enable destination</strong><small>Send the calls of the chosen workspaces to this destination.</small></span></label>

        <section className="trace-export-section" aria-labelledby="destination-connection-title">
          <h2 id="destination-connection-title">Connection</h2>
          <p className="cp-admin-muted">The address of your collector, SIEM or webhook receiver, and how it authenticates the calls.</p>
          <label className="cp-admin-field trace-export-field">Destination name<input className="cp-admin-input" value={name} required maxLength={80} placeholder="Splunk security" onChange={event => setName(event.target.value)} /></label>
          <div className="trace-export-cell-chip">
            <label className="cp-admin-field trace-export-field">Type<SelectMenu block label="Type" value={type} onChange={value => setType(value as DestinationType)} options={[
              { value: 'otlp', label: 'OpenTelemetry (OTLP) · log records to a collector or a vendor endpoint' },
              { value: 'webhook', label: 'Webhook · a signed JSON POST to your URL' },
            ]} /></label>
            <WaitingBackend spec="086" tip="The delivery protocol of the destination: OTLP log records or a signed webhook." />
          </div>
          {type === 'otlp' ? (
            <div className="trace-export-pair">
              <label className="cp-admin-field">Endpoint URL<input className="cp-admin-input" type="url" required value={endpoint} placeholder="https://otel-collector.example.com:4318" onChange={event => setEndpoint(event.target.value)} /><small>HTTPS only. The base URL of the OTLP receiver; logs go to its logs path.</small></label>
              <label className="cp-admin-field">Protocol<SelectMenu block label="Protocol" value={protocol} onChange={value => setProtocol(value as 'grpc' | 'http')} options={[
                { value: 'http', label: 'HTTP/protobuf · port 4318' },
                { value: 'grpc', label: 'gRPC · port 4317' },
              ]} /></label>
            </div>
          ) : (
            <>
              <label className="cp-admin-field trace-export-field">Webhook URL<input className="cp-admin-input" type="url" required value={endpoint} placeholder="https://hooks.example.com/agent-calls" onChange={event => setEndpoint(event.target.value)} /><small>HTTPS only. Each call is one POST with a JSON body.</small></label>
              <div className="trace-export-cell-chip">
                <label className="cp-admin-field trace-export-field">Signing secret<input className="cp-admin-input trace-export-mono" readOnly value={destination ? 'whsec_••••••••••••••••' : 'Created when you save. You see it once.'} /><small>Each request has an HMAC-SHA256 signature of its body in a header. Check it to accept only calls sent by this destination.</small></label>
                {destination ? <button type="button" className="cp-admin-button cp-admin-button--secondary">Rotate secret</button> : null}
                <WaitingBackend spec="086" tip="The secret that signs each webhook request, shown once when it is created or rotated." />
              </div>
            </>
          )}
          <h3>Headers</h3>
          <p className="cp-admin-muted">Sent with every request, for example the token your SIEM asks for. Values are stored encrypted and never shown again.</p>
          <HeaderRows headers={headers} onChange={setHeaders} />
        </section>

        <section className="trace-export-section" aria-labelledby="destination-scope-title">
          <h2 id="destination-scope-title">What is exported</h2>
          <p className="cp-admin-muted">Each allowed and denied call of these workspaces and environments, with the agent, the person, the tool, the result and the Reference code.</p>
          <div className="cp-admin-table-scroll trace-export-scope" role="region" aria-label="Workspaces and environments" tabIndex={0}>
            <table className="cp-admin-table">
              <thead><tr><th scope="col">Workspace</th><th scope="col">Production</th><th scope="col">Sandbox</th></tr></thead>
              <tbody>{workspaces.map(workspace => (
                <tr key={workspace.tenantId}>
                  <td><div className="trace-export-name"><Building2 size={20} aria-hidden="true" /><span><strong>{workspace.name}</strong><small>{workspace.tenantId}</small></span></div></td>
                  {(['production', 'sandbox'] as const).map(environment => (
                    <td key={environment}><input className="cp-admin-switch" type="checkbox" role="switch" aria-label={`Export ${workspace.name} ${environmentName(environment)}`} checked={(exports[workspace.tenantId] ?? []).includes(environment)} onChange={event => switchEnvironment(workspace.tenantId, environment, event.target.checked)} /></td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="trace-export-scope-pager"><TracePager page={1} size={20} total={workspaces.length} onPage={() => undefined} /></div>
          <small className="cp-admin-muted">The workspaces of your account. A workspace with both switches off sends nothing.</small>
        </section>

        <section className="trace-export-section" aria-labelledby="destination-test-title">
          <h2 id="destination-test-title">Test</h2>
          <p className="cp-admin-muted">Sends one sample call, marked as a test, to check the address and the credentials before you save.</p>
          <div className="trace-export-cell-chip">
            <button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={() => setTested(true)}>Send test event</button>
            <WaitingBackend spec="086" tip="Sends one sample event to the destination with the settings of this form and returns the response." />
          </div>
          {tested ? <div className="cp-admin-notice cp-admin-notice--success" role="status">Delivered. The destination answered 200 OK in 182 ms.</div> : null}
        </section>

        <div className="trace-export-actions">
          <button type="submit" className="cp-admin-button">Save destination</button>
          <span>
            <button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={back}>Cancel</button>
            {destination ? <button type="button" className="cp-admin-button cp-admin-button--danger-soft" onClick={() => setDeleting(true)}>Delete destination</button> : null}
          </span>
        </div>
      </form>
      {deleting && destination ? <DeleteDestinationDialog destination={destination} onClose={() => setDeleting(false)} /> : null}
    </main>
  );
}

function DestinationRoute() {
  const { id } = useParams();
  const destination = destinations.find(item => item.id === id);
  return <DestinationForm key={id} destination={destination} />;
}

export function TraceExportPrototype() {
  return (
    <div className="admin-layout">
      <title>Events export | Account | Xokepoint</title>
      <a className="admin-skip-link" href="#main-content">Skip to content</a>
      <AccountHeader />
      <Routes>
        <Route index element={<DestinationList />} />
        <Route path="new" element={<DestinationForm />} />
        <Route path=":id" element={<DestinationRoute />} />
      </Routes>
    </div>
  );
}
