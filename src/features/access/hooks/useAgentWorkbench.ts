import { useState } from 'react';
import { useAccessData } from './useAccessData';
import type { AgentInput } from '../types';

export function useAgentWorkbench() {
  const data = useAccessData();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'new-agent' | 'review' | null>(null);
  const selectedAgent =
    data.agents.find((agent) => agent.id === selectedId) ?? data.agents[0] ?? null;
  const visibleAgents = data.agents.filter((agent) =>
    `${agent.name} ${agent.description}`.toLowerCase().includes(search.toLowerCase()),
  );

  function createAgent(input: AgentInput) {
    setSelectedId(data.createAgent(input));
    setSearch('');
    setDialog(null);
  }
  function applyPreview() {
    data.applyPreview();
    setDialog(null);
  }
  function openNewAgent() {
    setDialog('new-agent');
  }
  function openReview() {
    setDialog('review');
  }
  function toggleSelectedTool(toolId: string) {
    if (selectedAgent) data.toggleTool(selectedAgent.id, toolId);
  }
  function closeDialog() {
    setDialog(null);
  }

  return {
    ...data,
    search,
    setSearch,
    selectedAgent,
    visibleAgents,
    selectAgent: setSelectedId,
    dialog,
    openNewAgent,
    openReview,
    toggleSelectedTool,
    closeDialog,
    createAgent,
    applyPreview,
  };
}
