import { useState } from 'react';
import type { AgentSummary } from '../types';

export function useAgentDetails(agent: Pick<AgentSummary, 'tools' | 'people'>) {
  const [tab, setTab] = useState<'tools' | 'people'>('tools');
  const [search, setSearch] = useState('');
  const visibleTools = agent.tools.filter((tool) =>
    `${tool.name} ${tool.description} ${tool.server}`.toLowerCase().includes(search.toLowerCase()),
  );
  const groups = [...new Set(visibleTools.map((tool) => tool.server))].map((server) => ({
    server,
    tools: visibleTools.filter((tool) => tool.server === server),
  }));
  return {
    tab,
    setTab,
    search,
    setSearch,
    groups,
    enabledTools: agent.tools.filter((tool) => tool.enabled).length,
    assignedPeople: agent.people.filter((person) => person.assigned).length,
  };
}
