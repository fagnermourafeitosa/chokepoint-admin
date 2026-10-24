import './tools.css';
import { Server } from 'lucide-react';
import { ToolRow } from './ToolRow';
import type { ToolSummary } from '../types';

type ToolGroupProps = {
  server: string;
  tools: readonly ToolSummary[];
  onToggle: (id: string) => void;
};

export function ToolGroup({ server, tools, onToggle }: ToolGroupProps) {
  return (
    <section className="access-tool-group" aria-label={server}>
      <div className="access-tool-group-heading">
        <Server size={16} aria-hidden="true" />
        <strong>{server}</strong>
        <span>
          {tools.filter((tool) => tool.enabled).length} of {tools.length} enabled
        </span>
      </div>
      <ul>
        {tools.map((tool) => (
          <ToolRow key={tool.id} tool={tool} onToggle={onToggle} />
        ))}
      </ul>
    </section>
  );
}
