import { useEffect, useId, useRef, useState } from 'react';
import { Ellipsis } from 'lucide-react';
import { agentIcons } from '../agent-icons';
import type { AgentIconKey } from '../agent-icons';
import type { AgentRecord, AgentScope } from '../agent-api';
import { AgentVisual } from './AgentVisual';

export type Appearance = { mode: 'icon' | 'image'; icon: AgentIconKey; file: File | null };
type Props = { value: Appearance; onChange: (value: Appearance) => void; agent?: AgentRecord; scope: AgentScope; disabled: boolean; hint: string; onFile: (file: File) => Promise<void> };
export function AgentAppearance({ value, onChange, agent, scope, disabled, hint, onFile }: Props) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  useEffect(() => {
    if (!value.file) return;
    const url = URL.createObjectURL(value.file);
    setPreview({ file: value.file, url });
    return () => URL.revokeObjectURL(url);
  }, [value.file]);
  useEffect(() => { if (disabled) layer.current?.hidePopover(); }, [disabled]);

  function toggle() {
    const rect = trigger.current!.getBoundingClientRect();
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - 272)), top: Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 280)) });
    layer.current?.togglePopover();
  }
  const Icon = agentIcons[value.icon];
  return <div className="agent-appearance">
    <button ref={trigger} className="agent-appearance-trigger" type="button" disabled={disabled} aria-label="Choose agent icon or upload image" aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={toggle}>
      {value.mode === 'image' && value.file && preview?.file === value.file ? <img src={preview.url} alt="" /> : value.mode === 'image' && agent?.visual_kind === 'image' ? <AgentVisual agent={agent} scope={scope} /> : <Icon size={25} aria-hidden="true" />}
    </button>
    <input ref={fileInput} type="file" accept="image/png,image/jpeg" hidden onChange={event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file) void onFile(file);
    }} />
    <div ref={layer} id={id} popover="auto" role="dialog" aria-label="Choose agent appearance" className="agent-icon-layer" style={position} onToggle={() => setOpen(layer.current?.matches(':popover-open') ?? false)}>
      <div className="agent-icon-options">
        <button className="agent-icon-option agent-icon-upload" type="button" aria-label="Upload image" title={`Upload image — ${hint}`} onClick={() => { layer.current?.hidePopover(); fileInput.current?.click(); }}><Ellipsis size={22} aria-hidden="true" /></button>
        {(Object.keys(agentIcons) as AgentIconKey[]).map(key => {
          const Option = agentIcons[key];
          return <button key={key} className="agent-icon-option" type="button" aria-label={key} title={key} aria-pressed={value.mode === 'icon' && value.icon === key} onClick={() => { onChange({ mode: 'icon', icon: key, file: null }); layer.current?.hidePopover(); trigger.current?.focus(); }}><Option size={22} aria-hidden="true" /></button>;
        })}
      </div>
      <p className="agent-icon-upload-hint">PNG/JPEG · 256 KiB · 512 × 512</p>
    </div>
  </div>;
}
