import { HttpError } from '../../../api/http-client';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccessData } from './useAccessData';
import { agentApi, agentKey } from '../agent-api';
import type { AgentRecord, AgentScope } from '../agent-api';
import { agentError } from './useAgentForm';

export function useAgentWorkbench(scope: AgentScope, requestedId?: string, contextual = false, candidateIds: string[] = []) {
  const data = useAccessData(scope);
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'new-agent' | 'edit-agent' | 'delete-agent' | 'review' | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const alive = useRef(true);
  const removing = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const currentId = requestedId ?? selectedId ?? (contextual ? undefined : data.agents[0]?.id);
  const details = useQuery({ queryKey: [...agentKey(scope), 'detail', currentId], queryFn: ({ signal }) => agentApi.get(scope, currentId!, signal), enabled: !!currentId, retry: false });
  const selectedAgent = details.data;
  const railAgents = selectedAgent && !data.agents.some(a => a.id === selectedAgent.id) ? [selectedAgent, ...data.agents] : data.agents;
  const visibleAgents = railAgents.filter(agent => (!candidateIds.length || candidateIds.includes(agent.id) || agent.id === currentId)).filter(agent => `${agent.name} ${agent.description}`.toLowerCase().includes(search.toLowerCase()));

  function persisted(agent: AgentRecord) {
    if (!alive.current) return;
    client.setQueryData([...agentKey(scope), 'detail', agent.id], agent);
    void data.refresh();
  }
  function saved(agent: AgentRecord) {
    if (!alive.current) return;
    persisted(agent); setSelectedId(agent.id); setSearch(''); setDialog(null);
  }
  async function remove() {
    if (!selectedAgent || removing.current) return false;
    removing.current = true; setDeleting(true); setError('');
    try {
      await agentApi.remove(scope, selectedAgent.id, selectedAgent.revision);
      if (!alive.current) return false;
      client.removeQueries({ queryKey: [...agentKey(scope), 'detail', selectedAgent.id] });
      client.removeQueries({ queryKey: [...agentKey(scope), 'image', selectedAgent.id] });
      setSelectedId(null); setDialog(null); await data.refresh(); return true;
    } catch (reason) {
      if (!alive.current) return false;
      // Backend 038: a stale revision changes nothing; a failed revocation keeps the agent (Admin 032 section 6).
      if (reason instanceof HttpError && reason.status === 409) { setError('This agent changed in another session. It was reloaded; check it and delete again.'); await data.refresh(); }
      else if (reason instanceof HttpError && reason.status >= 500) setError('The access of this agent could not be removed, so it was not deleted. Try again.');
      else setError(agentError(reason));
      return false;
    }
    finally { removing.current = false; if (alive.current) setDeleting(false); }
  }
  return { ...data, details, visibleAgents, selectedAgent, search, setSearch, selectAgent: setSelectedId, dialog, setDialog, persisted, saved, remove, error, deleting };
}
