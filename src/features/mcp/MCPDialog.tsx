import { useEffect, useRef } from 'react';
import { SelectMenu } from '../../components/ui/dropdown/SelectMenu';
import { X } from 'lucide-react';
import { useDialog } from '../../components/ui/dialog/useDialog';
import type { EnvironmentScope } from '../access/environment-scope';
import type { MCPServer } from './api';
import { useMCPForm } from './useMCPForm';
import { ToolRows } from './ToolRows';
import '../../components/ui/dialog/dialog.css';
export function MCPDialog({ scope, server, onClose, onRefresh, onSaved }: { scope: EnvironmentScope; server?: MCPServer; onClose: () => void; onRefresh: () => void; onSaved: (server: MCPServer) => void }) {
 const { ref, titleId } = useDialog();
 const form = useMCPForm(scope, server, onRefresh, onSaved);
 const available = form.preview?.tools.filter(tool => tool.change !== 'removed') ?? [];
 const selectAll = useRef<HTMLInputElement>(null);
 const all = available.length > 0 && form.selected.length === available.length;
 useEffect(() => { if (selectAll.current) selectAll.current.indeterminate = form.selected.length > 0 && !all; }, [form.selected.length, all]);
 const noTools = form.preview && available.length === 0;
 const requiresToken = form.fields.auth_type === 'bearer' && (!server?.token_configured || form.fields.endpoint !== server.endpoint);
 return <dialog ref={ref} className="cp-admin-dialog admin-dialog mcp-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!form.busy) onClose(); }}>
  <div className="admin-dialog-header"><div><h2 id={titleId}>{form.preview ? 'Review discovered tools' : server ? 'Edit MCP server' : 'Connect MCP server'}</h2><p className="cp-admin-muted">{form.preview ? form.fields.name : 'Saved to the current workspace and environment.'}</p></div><button className="admin-dialog-close" aria-label="Close dialog" disabled={form.busy} onClick={onClose}><X size={18} /></button></div>
  <form onSubmit={event => { event.preventDefault(); void (form.preview ? form.confirm() : form.discover()); }} aria-busy={form.busy}>
   <div className="admin-dialog-body">
   {!form.preview ? <>
    <label>Server name<input className="cp-admin-input" name="name" required maxLength={80} value={form.fields.name} disabled={form.busy} onChange={e => form.update('name', e.target.value)} placeholder="e.g. Inventory MCP" /></label>
    <label>MCP endpoint<input className="cp-admin-input" name="endpoint" type="url" required maxLength={2048} value={form.fields.endpoint} disabled={form.busy} onChange={e => form.update('endpoint', e.target.value)} placeholder="https://mcp.example.com/mcp" /></label>
    <label>Transport<SelectMenu block label="Transport" value={form.fields.transport} disabled={form.busy} onChange={v => form.update('transport', v)} options={[{ value: 'streamable-http', label: 'Streamable HTTP' }, { value: 'stdio', label: 'stdio — unsupported', disabled: true }]} /></label>
    <p className="cp-admin-muted">stdio is not supported. Chokepoint connects to an HTTP endpoint.</p>
    <label>Authentication<SelectMenu block label="Authentication" value={form.fields.auth_type} disabled={form.busy} onChange={v => form.update('auth_type', v as 'none' | 'bearer')} options={[{ value: 'none', label: 'None' }, { value: 'bearer', label: 'Bearer token' }]} /></label>
    {form.fields.auth_type === 'bearer' ? <label>{server?.token_configured ? 'Replacement Bearer token' : 'Bearer token'}<input className="cp-admin-input" name="token" type="password" autoComplete="off" required={requiresToken} maxLength={4096} value={form.token} disabled={form.busy} onChange={e => form.setToken(e.target.value)} /><small className="cp-admin-muted">{server?.token_configured && !requiresToken ? 'Leave blank to retain the saved token.' : 'Required for this connection. Tokens are never returned in server details.'}</small></label> : null}
   </> : <>
    <div className="mcp-preview-summary"><strong>{available.length} available tools</strong><span>{form.selected.length} selected</span></div>
    {server ? <p className="cp-admin-notice">New, changed, and removed rows are highlighted. Changed and removed tools stay disabled until reviewed. Unchanged settings are retained.</p> : <p>Select the tools to place under Chokepoint management. All available tools start selected.</p>}
    {noTools ? <p role="status" className="cp-admin-notice">No tools available. {server ? 'Missing tools are retained and disabled. This server cannot be re-enabled.' : 'This server cannot be registered.'}</p> : <label className="mcp-select-all"><input ref={selectAll} type="checkbox" checked={all} disabled={form.busy} onChange={e => form.setSelected(e.target.checked ? available.map(tool => tool.name) : [])} />Select all available tools</label>}
    <ToolRows tools={form.preview.tools} selected={form.selected} onToggle={form.toggle} disabled={form.busy} />
    {server ? <label className="mcp-select-all"><input type="checkbox" checked={form.enable} disabled={form.busy || Boolean(noTools)} onChange={e => form.setEnable(e.target.checked)} />Enable server after review</label> : null}
    <details className="mcp-contract"><summary>Server discovery metadata</summary><pre>{JSON.stringify(form.preview.server_info, null, 2)}</pre></details>
    <p className="cp-admin-muted">Preview expires at {new Date(form.preview.expires_at).toLocaleTimeString()}.</p>
   </>}
   {form.error ? <p role="alert" className="cp-admin-notice" data-tone="danger">{form.error}</p> : null}
   </div>
   <div className="admin-dialog-actions"><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={form.busy} onClick={onClose}>Cancel</button><button className="cp-admin-button" type="submit" disabled={form.busy || Boolean(form.preview && ((!server || form.enable) && form.selected.length === 0))}>{form.busy ? form.preview ? 'Saving…' : 'Discovering…' : form.preview ? server ? 'Confirm review' : 'Register server' : 'Discover tools'}</button></div>
  </form>
 </dialog>;
}
