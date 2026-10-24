import { Filter, Wrench } from 'lucide-react';
import { ToolAnnotations } from './ToolAnnotations';
import type { ToolSummary } from '../types';

type ToolRowProps = { tool: ToolSummary; onToggle: (id: string) => void };

export function ToolRow({ tool, onToggle }: ToolRowProps) {
  return (
    <li className="access-tool-row">
      <span className="access-tool-icon">
        <Wrench size={16} aria-hidden="true" />
      </span>
      <div className="access-tool-copy">
        <code>{tool.name}</code>
        <small>{tool.description}</small>
        <ToolAnnotations annotations={tool.annotations} />
      </div>

      <button
        className="cp-admin-button cp-admin-button--secondary cp-admin-button--small"
        type="button"
        disabled
      >
        <Filter size={13} aria-hidden="true" />
        Conditions
      </button>
      <button
        className="access-tool-switch"
        type="button"
        role="switch"
        aria-checked={tool.enabled}
        aria-label={`Enable ${tool.name}`}
        onClick={() => onToggle(tool.id)}
      >
        <span />
      </button>
    </li>
  );
}
