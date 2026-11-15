import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { X } from 'lucide-react';
import { useDialog } from '../../components/ui/dialog/useDialog';
import { usePendingChanges } from '../auth/pending/PendingChanges';
import type { EnvironmentScope } from '../access/environment-scope';
import type { Connection, MCPServer } from './api';
import { ChokepointTokenSetup, typedAudience } from './ChokepointTokenSetup';
import { agentClientApi, authorizationServerKey } from '../access/agent-client-api';
import '../../components/ui/dialog/dialog.css';

// The connection of a Custom MCP: name, endpoint and transport. Discover tools opens the review page
// (Admin 055), which runs the discovery and the review; the dialog no longer has a preview step.
export function MCPDialog({ scope, server, onClose, onReview }: { scope: EnvironmentScope; server?: MCPServer; onClose: () => void; onReview: (connection: Connection) => void }) {
 const { ref, titleId } = useDialog();
 const [fields, setFields] = useState<Connection>({ name: server?.name ?? '', endpoint: server?.endpoint ?? '', transport: 'streamable-http', auth_type: 'chokepoint_token' });
 const [initial] = useState(() => JSON.stringify(fields));
 usePendingChanges(JSON.stringify(fields) !== initial);
 const update = <K extends keyof Connection>(key: K, value: Connection[K]) => setFields(old => ({ ...old, [key]: value }));
 // The server must trust these values before its first discovery, which already sends a Xokepoint token (Backend 040).
 const trust = useQuery({ queryKey: authorizationServerKey(scope), queryFn: ({ signal }) => agentClientApi.authorizationServer(scope, signal), retry: false, staleTime: Infinity });
 return <dialog ref={ref} className="cp-admin-dialog admin-dialog mcp-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}>
  <div className="admin-dialog-header"><div><h2 id={titleId}>{server ? 'Edit MCP server' : 'Connect MCP server'}</h2><p className="cp-admin-muted">Saved to the current workspace and environment.</p></div><button className="admin-dialog-close" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></div>
  <form onSubmit={event => { event.preventDefault(); onReview({ ...fields, ...(server ? { revision: server.revision } : {}) }); }}>
   <div className="admin-dialog-body">
    <label>Server name<input className="cp-admin-input" name="name" required maxLength={80} value={fields.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Inventory MCP" /></label>
    <label>MCP endpoint<input className="cp-admin-input" name="endpoint" type="url" required maxLength={2048} value={fields.endpoint} onChange={e => update('endpoint', e.target.value)} placeholder="https://mcp.example.com/mcp" /></label>
    <label>Transport<SelectMenu block label="Transport" value={fields.transport} onChange={v => update('transport', v)} options={[{ value: 'streamable-http', label: 'Streamable HTTP' }, { value: 'stdio', label: 'stdio — unsupported', disabled: true }]} /></label>
    <p className="cp-admin-muted">stdio is not supported. Xokepoint connects to an HTTP endpoint.</p>
    <ChokepointTokenSetup issuer={trust.data?.issuer} jwksUri={trust.data?.jwks_uri} audience={typedAudience(fields.endpoint)} unavailable={trust.isError} />
   </div>
   <div className="admin-dialog-actions"><button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>Cancel</button><button className="cp-admin-button" type="submit">Discover tools</button></div>
  </form>
 </dialog>;
}
