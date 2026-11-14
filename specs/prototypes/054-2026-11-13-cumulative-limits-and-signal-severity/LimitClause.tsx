import { CircleHelp, Trash2, TriangleAlert } from 'lucide-react';
import { SelectMenu } from '../../../src/components/ui/dropdown/SelectMenu';
import { Tooltip } from '../../../src/components/ui/tooltip/Tooltip';
import { formerlyRisk, keyHelp, ofHelp, operators, params, serverTools, tool, windowHelp, type Operator, type Usage } from './data';

// Admin 054 prototype: one limit line of the rule editor. It reads earlier calls of this agent
// (Backend 087 usage definition). The operator names are the Dogwood names, written with _.

// The window is at most 24 hours (Backend 087): the field keeps its value within it.
export const windowMax = (unit: Usage['windowUnit']) => (unit === 'hours' ? 24 : 1440);
const clampWindow = (value: number, unit: Usage['windowUnit']) => (Number.isFinite(value) && value > 0 ? Math.min(Math.round(value), windowMax(unit)) : 0);
export const windowValid = (u: Usage) => u.windowValue >= 1 && u.windowValue <= windowMax(u.windowUnit);

const numeric = (op: Operator) => op === 'sum' || op === 'count_calls' || op === 'count_distinct';
const unit = (u: Usage) => (u.windowValue === 1 ? u.windowUnit.slice(0, -1) : u.windowUnit);

// The "Reads as" part of one limit line.
export function limitSentence(u: Usage) {
  const window = `in the last ${u.windowValue} ${unit(u)}`;
  const per = u.key ? ` per ${u.key}` : '';
  const same = u.match ? ` with the same ${u.match.argument}` : '';
  switch (u.operator) {
    case 'sum': return `sum of ${u.argument ?? '…'}${per} ${window} is ${u.compare === 'lt' ? 'less than' : 'at most'} ${u.limit || '…'}`;
    case 'count_calls': return `count_calls of ${tool}${per} ${window} is ${u.compare === 'lt' ? 'less than' : 'at most'} ${u.limit || '…'}`;
    case 'count_distinct': return `count_distinct of ${u.argument ?? '…'} ${window} is ${u.compare === 'lt' ? 'less than' : 'at most'} ${u.limit || '…'}`;
    case 'formerly_within': return `formerly_within ${u.tool ?? '…'} ${window}${same}`;
    case 'since_within': return `no ${u.tool ?? '…'} since ${u.anchorTool ?? '…'} ${window}${same}`;
  }
}

function Help({ label, text }: { label: string; text: string }) {
  return <Tooltip content={text}><CircleHelp size={14} aria-label={`About ${label}`} /></Tooltip>;
}

export function LimitClause({ usage, onChange, onRemove }: { usage: Usage; onChange: (u: Usage) => void; onRemove: () => void }) {
  const set = (patch: Partial<Usage>) => onChange({ ...usage, ...patch });
  const op = usage.operator;
  const integers = params.filter(p => p.type === 'integer');
  const otherTools = Object.keys(serverTools);
  const matchParams = (name?: string) => (name ? serverTools[name] ?? [] : []);
  return <div className="rule-clause limit-clause">
    <div className="limit-grid">
      <label className="limit-field"><span>Limit</span>
        <SelectMenu block label="Operator" value={op} onChange={v => set({ operator: v as Operator, argument: v === 'sum' ? integers[0]?.name : v === 'count_distinct' ? 'customer_id' : undefined, tool: v === 'formerly_within' || v === 'since_within' ? otherTools[0] : undefined, anchorTool: v === 'since_within' ? otherTools[1] : undefined, match: v === 'formerly_within' || v === 'since_within' ? { argument: 'order_id', toolArgument: 'order_id' } : undefined })} options={operators.map(o => ({ value: o.id, label: o.id }))} />
        <small className="cp-admin-muted">{operators.find(o => o.id === op)!.help}</small>
      </label>

      {op === 'sum' || op === 'count_distinct' ? <label className="limit-field"><span>Of{op === 'sum' ? <Help label="Of" text={ofHelp} /> : null}</span>
        <SelectMenu block label="Parameter" value={usage.argument ?? ''} onChange={v => set({ argument: v })} options={(op === 'sum' ? integers : params).map(p => ({ value: p.name, label: `${p.name} · ${p.type}` }))} />
      </label> : null}

      {op === 'sum' || op === 'count_calls' ? <label className="limit-field"><span>Per <Help label="per" text={keyHelp} /></span>
        <SelectMenu block label="Per" value={usage.key ?? ''} onChange={v => set({ key: v || undefined })} options={[{ value: '', label: 'All calls' }, ...params.filter(p => p.type === 'string').map(p => ({ value: p.name, label: p.name }))]} />
      </label> : null}

      {op === 'formerly_within' || op === 'since_within' ? <>
        {op === 'since_within' ? <label className="limit-field"><span>Since</span>
          <SelectMenu block label="Anchor tool" value={usage.anchorTool ?? ''} onChange={v => set({ anchorTool: v })} options={otherTools.map(t => ({ value: t, label: t }))} />
        </label> : null}
        <label className="limit-field"><span>{op === 'since_within' ? 'No call of' : 'Tool'}</span>
          <SelectMenu block label="Tool" value={usage.tool ?? ''} onChange={v => set({ tool: v })} options={otherTools.map(t => ({ value: t, label: t }))} />
        </label>
        <div className="limit-field"><span>With the same</span><div className="limit-match">
          <SelectMenu block label={`Parameter of ${tool}`} value={usage.match?.argument ?? ''} onChange={v => set({ match: { argument: v, toolArgument: usage.match?.toolArgument ?? v } })} options={params.map(p => ({ value: p.name, label: `${tool}.${p.name}` }))} />
          <span aria-hidden="true">=</span>
          <SelectMenu block label={`Parameter of ${usage.tool}`} value={usage.match?.toolArgument ?? ''} onChange={v => set({ match: { argument: usage.match?.argument ?? v, toolArgument: v } })} options={matchParams(usage.tool).map(p => ({ value: p.name, label: `${usage.tool}.${p.name}` }))} />
        </div></div>
      </> : null}

      <div className="limit-field"><span>In the last <Help label="the window" text={windowHelp} /></span><div className="limit-window">
        <input className="cp-admin-input" aria-label="Window" type="number" min={1} max={windowMax(usage.windowUnit)} value={usage.windowValue || ''} onChange={e => set({ windowValue: clampWindow(Number(e.target.value), usage.windowUnit) })} />
        <SelectMenu block label="Unit" value={usage.windowUnit} onChange={v => { const u = v as Usage['windowUnit']; set({ windowUnit: u, windowValue: clampWindow(usage.windowValue, u) }); }} options={[{ value: 'minutes', label: 'minutes' }, { value: 'hours', label: 'hours' }]} />
      </div></div>

      {numeric(op) ? <div className="limit-field"><span>Is</span><div className="limit-window">
        <SelectMenu block label="Comparison" value={usage.compare ?? 'le'} onChange={v => set({ compare: v as Usage['compare'] })} options={[{ value: 'le', label: 'at most' }, { value: 'lt', label: 'less than' }]} />
        <input className="cp-admin-input" aria-label="Limit" type="number" min={1} value={usage.limit ?? ''} placeholder="value" onChange={e => set({ limit: e.target.value })} />
      </div></div> : null}
    </div>

    {op === 'formerly_within' ? <p className="cp-admin-notice cp-admin-notice--warning limit-risk" role="note"><TriangleAlert size={16} aria-hidden="true" /><span><strong>Checks the call, not its result</strong>{formerlyRisk.replace('get_order', usage.tool ?? 'the tool').replace('order_id', usage.match?.argument ?? 'the argument')} A call that returned a refusal still counts.</span></p> : null}

    <button type="button" className="relation-icon-button" aria-label="Remove this limit" onClick={onRemove}><Trash2 size={14} /></button>
  </div>;
}
