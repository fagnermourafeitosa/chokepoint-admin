import './tool-annotations.css';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import { toolAnnotationLabels } from '../tool-annotations';
import type { MCPToolAnnotations } from '../types';

export function ToolAnnotations({ annotations }: { annotations?: MCPToolAnnotations }) {
  const labels = toolAnnotationLabels(annotations);
  if (!labels.length) return null;
  return (
    <div className="access-tool-annotations" role="group" aria-label="MCP annotations">
      {labels.map(({ key, value, label, description }) => (
        <Tooltip key={key} content={description}>
          <span className="access-tool-tag" data-annotation={key} data-value={String(value)}>
            {label}
          </span>
        </Tooltip>
      ))}
    </div>
  );
}
