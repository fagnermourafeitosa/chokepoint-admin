import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { RotateCcw, ShieldAlert, Wrench } from 'lucide-react';
import { ConfirmDialog } from '../../../components/ui/dialog/ConfirmDialog';
import { HttpError } from '../../../api/http-client';
import { mcpApi, mcpKey } from '../../mcp/api';
import { agentApi, type AgentRecord, type AgentScope, type SuspendedTool } from '../agent-api';

const utc = (at: string) => new Date(at).toLocaleString('en', { timeZone: 'UTC', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';

type Props = { scope: AgentScope; agent: AgentRecord; onRestored: () => void };

// The tools that a behavior drift response suspended for the agent (Backend 099, Admin 060 decision 10). Each shows
// Suspended with its time and a Restore action; a suspension never expires by itself, so only Restore brings the tool back.
export function SuspendedToolsNotice({ scope, agent, onRestored }: Props) {
  const tools = agent.suspended_tools ?? [];
  const serverIds = [...new Set(tools.map(t => t.server_id))];
  const servers = useQueries({ queries: serverIds.map(id => ({ queryKey: [...mcpKey(scope), 'detail', id], queryFn: ({ signal }: { signal: AbortSignal }) => mcpApi.get(scope, id, signal), retry: false, staleTime: 60_000 })) });
  const serverName = new Map(serverIds.map((id, i) => [id, servers[i]?.data?.name ?? id]));
  const [restoring, setRestoring] = useState<SuspendedTool>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  // What happened to a restore that another session ran first (Admin 060 decision 10).
  const [outcome, setOutcome] = useState<{ kind: 'already'; text: string } | { kind: 'again'; serverId: string; tool: string }>();
  async function restore(tool: SuspendedTool) {
    setBusy(true); setError(undefined); setOutcome(undefined);
    try {
      const result = await agentApi.restoreTool(scope, agent.id, tool.id);
      if (result.already_restored) setOutcome({ kind: 'already', text: `Already restored${result.restored_by ? ` by ${result.restored_by}` : ''} at ${utc(result.restored_at)}.` });
      setRestoring(undefined);
      onRestored();
    } catch (cause) {
      // The tool was restored and suspended again: show the new suspension, which needs its own review.
      if (cause instanceof HttpError && cause.status === 409) { setOutcome({ kind: 'again', serverId: tool.server_id, tool: tool.tool }); setRestoring(undefined); onRestored(); }
      else setError('Could not restore the tool. Retry when the service is available.');
    } finally { setBusy(false); }
  }
  const again = outcome?.kind === 'again' ? tools.find(t => t.server_id === outcome.serverId && t.tool === outcome.tool) : undefined;
  const outcomeText = outcome?.kind === 'already' ? outcome.text
    : outcome?.kind === 'again' ? `${outcome.tool} was suspended again${again ? ` at ${utc(again.suspended_at)}` : ''}. Review the new behavior drift before you restore it.` : undefined;
  if (!tools.length) return outcomeText ? <div className="cp-admin-notice agent-suspended-notice" role="status">{outcomeText}</div> : null;
  return <div className="cp-admin-notice cp-admin-notice--warning agent-suspended-notice" role="note">
    <ShieldAlert size={18} aria-hidden="true" />
    <div className="cp-admin-notice-body">
      <strong>{tools.length === 1 ? 'A tool is suspended for this agent' : `${tools.length} tools are suspended for this agent`}</strong>
      <span>A behavior drift response suspended {tools.length === 1 ? 'it' : 'them'}. Calls are denied until you restore {tools.length === 1 ? 'it' : 'them'}.</span>
      {outcomeText ? <span role="status">{outcomeText}</span> : null}
      <ul className="agent-suspended-list">
        {tools.map(t => <li key={t.id}>
          <Wrench size={14} aria-hidden="true" /><strong>{t.tool}</strong><span className="cp-admin-muted">{serverName.get(t.server_id)}</span>
          <span className="mcp-badge" data-tone="danger">Suspended</span><span className="cp-admin-muted">{utc(t.suspended_at)}</span>
          <button type="button" className="cp-admin-button cp-admin-button--secondary cp-admin-button--small" onClick={() => { setError(undefined); setRestoring(t); }}><RotateCcw size={14} aria-hidden="true" />Restore</button>
        </li>)}
      </ul>
    </div>
    {restoring ? <ConfirmDialog title="Restore tool" confirmLabel="Restore tool" busyLabel="Restoring…" busy={busy} error={error}
      warning="Calls of this tool by this agent run again at once." onConfirm={() => void restore(restoring)} onClose={() => { setRestoring(undefined); setError(undefined); }}>
      <p>Restore <strong>{restoring.tool}</strong> for <strong>{agent.name}</strong>? Restore it only after you reviewed the behavior drift.</p>
    </ConfirmDialog> : null}
  </div>;
}
