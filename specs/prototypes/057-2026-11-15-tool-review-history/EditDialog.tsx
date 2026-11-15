import { X } from 'lucide-react';
import { useDialog } from '../../../src/components/ui/dialog/useDialog';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { ChokepointTokenSetup, typedAudience } from '../../../src/features/mcp/ChokepointTokenSetup';
import '../../../src/components/ui/dialog/dialog.css';
import type { ListedServer } from './data';

// Admin 057 prototype: Edit connection opens the dialog of src/features/mcp/MCPDialog.tsx with the
// stored connection. Discover tools opens the review page. Fixed trust values.
const issuer = 'https://app.xokepoint.localhost/as/11111111-1111-4111-8111-111111111111/8f6b36fc-cdb0-4c0c-a10f-fb07cbed5a24';

export function EditDialog({ server, onClose }: { server: ListedServer; onClose: () => void }) {
  const { ref, titleId } = useDialog();
  return <dialog ref={ref} className="cp-admin-dialog admin-dialog mcp-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="admin-dialog-header"><div><h2 id={titleId}>Edit MCP server</h2><p className="cp-admin-muted">Saved to the current workspace and environment.</p></div><button className="admin-dialog-close" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></div>
    <form onSubmit={event => { event.preventDefault(); window.location.assign('/prototype/tool-review-order'); }}>
      <div className="admin-dialog-body">
        <label>Server name<input className="cp-admin-input" name="name" required defaultValue={server.name} /></label>
        <label>MCP endpoint<input className="cp-admin-input" name="endpoint" type="url" required defaultValue={server.endpoint} /></label>
        <label>Transport<SelectMenu block label="Transport" value={server.transport} onChange={() => undefined} options={[{ value: 'streamable-http', label: 'Streamable HTTP' }, { value: 'http-sse', label: 'HTTP+SSE' }, { value: 'stdio', label: 'stdio — unsupported', disabled: true }]} /></label>
        <p className="cp-admin-muted">stdio is not supported. Xokepoint connects to an HTTP endpoint.</p>
        <ChokepointTokenSetup compact issuer={issuer} jwksUri={`${issuer}/jwks`} audience={typedAudience(server.endpoint)} />
      </div>
      <div className="admin-dialog-actions"><button type="button" className="cp-admin-button cp-admin-button--secondary" onClick={onClose}>Cancel</button><button className="cp-admin-button" type="submit">Discover tools</button></div>
    </form>
  </dialog>;
}
