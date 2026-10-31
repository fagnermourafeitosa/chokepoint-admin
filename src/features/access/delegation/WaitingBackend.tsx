import { Tooltip } from '../../../components/ui/tooltip/Tooltip';

// Marks a prototype element whose data the backend does not serve yet. The tip says what the element is for.
export function WaitingBackend({ spec, tip }: { spec: string; tip: string }) {
  return <Tooltip content={`${tip} Backend ${spec}.`}><span className="waiting-backend">Waiting backend · {spec}</span></Tooltip>;
}

// Marks a prototype element that no backend specification defines yet. It needs a backend change first.
export function NeedsBackend({ note }: { note: string }) {
  return <Tooltip content={note}><span className="waiting-backend waiting-backend--change">Needs backend change</span></Tooltip>;
}
