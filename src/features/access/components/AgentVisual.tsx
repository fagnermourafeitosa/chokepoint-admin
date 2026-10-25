import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { agentApi, agentKey } from '../agent-api';
import type { AgentRecord, AgentScope } from '../agent-api';
import { agentIcons } from '../agent-icons';
import './agent-visual.css';

export function AgentVisual({ agent, scope }: { agent: AgentRecord; scope: AgentScope }) {
  const query = useQuery({
    queryKey: [...agentKey(scope), 'image', agent.id, agent.image_revision],
    queryFn: ({ signal }) => agentApi.image(scope, agent.id, signal),
    enabled: agent.visual_kind === 'image',
    retry: false,
    gcTime: 0,
  });
  const [preview, setPreview] = useState<{ blob: Blob; url: string } | null>(null);
  useEffect(() => {
    if (!query.data) return;
    const url = URL.createObjectURL(query.data);
    setPreview({ blob: query.data, url });
    return () => URL.revokeObjectURL(url);
  }, [query.data]);
  const Icon = agent.icon_key && agentIcons[agent.icon_key] || agentIcons.bot;
  const url = preview?.blob === query.data ? preview?.url : undefined;
  return <span className="agent-visual" aria-hidden="true">
    {agent.visual_kind === 'icon' ? <Icon size={20} /> : url ? <img src={url} alt="" /> : <ImageOff size={20} />}
  </span>;
}
