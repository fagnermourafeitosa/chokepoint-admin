import { useEffect, useRef, useState } from 'react';
import { mcpApi, mcpError } from './api';
import type { EnvironmentScope } from '../access/environment-scope';
import type { Connection, MCPServer, Preview } from './api';
export function useMCPForm(scope: EnvironmentScope, server: MCPServer | undefined, onRefresh: () => void, onSaved: (server: MCPServer) => void) {
 const [fields, setFields] = useState<Connection>({ name: server?.name ?? '', endpoint: server?.endpoint ?? '', transport: 'streamable-http', auth_type: server?.auth_type ?? 'none' });
 const [token, setToken] = useState('');
 const [preview, setPreview] = useState<Preview>();
 const [selected, setSelected] = useState<string[]>([]);
 const [enable, setEnable] = useState(server?.enabled ?? true);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const controller = useRef<AbortController | null>(null);
 useEffect(() => () => { controller.current?.abort(); }, []);
 function update<K extends keyof Connection>(key: K, value: Connection[K]) { setFields(old => ({ ...old, [key]: value })); setPreview(undefined); setError(''); }
 async function discover() {
  const request = new AbortController(); controller.current = request; setBusy(true); setError('');
  try {
   const result = await mcpApi.discover(scope, server?.id, { ...fields, revision: server?.revision, ...(fields.auth_type === 'bearer' && token ? { token } : {}) }, request.signal);
   if (request.signal.aborted) return;
   setPreview(result); if (!result.tools.some(tool => tool.change !== 'removed')) setEnable(false); setSelected(result.tools.filter(tool => tool.selected && tool.change !== 'removed').map(tool => tool.name)); setToken(''); onRefresh();
  } catch (e) { if (!request.signal.aborted) setError(mcpError(e)); }
  finally { if (!request.signal.aborted) setBusy(false); }
 }
 async function confirm() {
  if (!preview) return;
  const request = new AbortController(); controller.current = request; setBusy(true); setError('');
  try { const result = await mcpApi.confirm(scope, server?.id, preview, selected, enable, request.signal); if (!request.signal.aborted) onSaved(result); }
  catch (e) { if (!request.signal.aborted) { setError(mcpError(e)); onRefresh(); } }
  finally { if (!request.signal.aborted) setBusy(false); }
 }
 function toggle(name: string) { setSelected(old => old.includes(name) ? old.filter(item => item !== name) : [...old, name]); }
 return { fields, update, token, setToken, preview, selected, setSelected, toggle, enable, setEnable, busy, error, discover, confirm };
}
