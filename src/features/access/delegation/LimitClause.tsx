import { CircleHelp, Trash2, TriangleAlert } from 'lucide-react';
import { SelectMenu } from '../../../components/ui/dropdown/SelectMenu';
import { Tooltip } from '../../../components/ui/tooltip/Tooltip';
import type { UsageOperator } from './api';
import { clampWindow, formerlyRisk, keyHelp, ofHelp, operators, windowHelp, windowMax, type Usage, type WindowUnit } from './usage';

// Admin 054: one limit line of the rule editor. It edits one usage definition of Backend 087 and the
// comparison of its value. params are the scalar arguments of this tool with their schema types;
// tools are the other tools of the same server with theirs.
export type Param = { name: string; type: string };

function Help({ label, text }: { label: string; text: string }) {
  return <Tooltip content={text}><CircleHelp size={14} aria-label={`About ${label}`} /></Tooltip>;
}

// A new operator keeps the window and resets what the operator reads.
function withOperator(u: Usage, op: UsageOperator, params: Param[], tools: Record<string, Param[]>): Usage {
  const integers = params.filter(p => p.type === 'integer');
  const other = Object.keys(tools);
  const first = other[0];
  const reads = op === 'formerly_within' || op === 'since_within';
  return {
    id: u.id, operator: op, windowValue: u.windowValue, windowUnit: u.windowUnit, compare: u.compare, limit: u.limit,
    argument: op === 'sum' ? integers[0]?.name : op === 'count_distinct' ? params[0]?.name : undefined,
    tool: reads ? first : undefined,
    anchorTool: op === 'since_within' ? other.find(t => t !== first) ?? first : undefined,
    match: reads && first ? defaultMatch(params, tools[first] ?? []) : undefined,
  };
}

// The default pair of With the same: a parameter with the same name in both tools, else the first of each.
function defaultMatch(params: Param[], other: Param[]) {
  const same = params.find(p => other.some(o => o.name === p.name));
  return same ? { argument: same.name, toolArgument: same.name } : { argument: params[0]?.name ?? '', toolArgument: other[0]?.name ?? '' };
}

export function LimitClause({ usage, tool, params, tools, onChange, onRemove }: { usage: Usage; tool: string; params: Param[]; tools: Record<string, Param[]>; onChange: (u: Usage) => void; onRemove: () => void }) {
  const set = (patch: Partial<Usage>) => onChange({ ...usage, ...patch });
  const op = usage.operator;
  const integers = params.filter(p => p.type === 'integer');
  const keys = params.filter(p => p.type === 'string');
  const toolOptions = Object.keys(tools).map(t => ({ value: t, label: t }));
  const reads = op === 'formerly_within' || op === 'since_within';
  return <div className="rule-clause limit-clause">
    <div className="limit-grid">
      <label className="limit-field"><span>Limit</span>
        <SelectMenu block label="Operator" value={op} onChange={v => onChange(withOperator(usage, v as UsageOperator, params, tools))} options={operators.map(o => ({ value: o.id, label: o.id }))} />
        <small className="cp-admin-muted">{operators.find(o => o.id === op)!.help}</small>
      </label>

      {op === 'sum' || op === 'count_distinct' ? <label className="limit-field"><span>Of{op === 'sum' ? <Help label="Of" text={ofHelp} /> : null}</span>
        <SelectMenu block label="Parameter" value={usage.argument ?? ''} onChange={v => set({ argument: v })} options={(op === 'sum' ? integers : params).map(p => ({ value: p.name, label: `${p.name} · ${p.type}` }))} />
      </label> : null}

      {op === 'sum' || op === 'count_calls' ? <label className="limit-field"><span>Per <Help label="per" text={keyHelp} /></span>
        <SelectMenu block label="Per" value={usage.key ?? ''} onChange={v => set({ key: v || undefined })} options={[{ value: '', label: 'All calls' }, ...keys.map(p => ({ value: p.name, label: p.name }))]} />
      </label> : null}

      {reads ? <>
        {op === 'since_within' ? <label className="limit-field"><span>Since</span>
          <SelectMenu block label="Anchor tool" value={usage.anchorTool ?? ''} onChange={v => set({ anchorTool: v })} options={toolOptions} />
        </label> : null}
        <label className="limit-field"><span>{op === 'since_within' ? 'No call of' : 'Tool'}</span>
          <SelectMenu block label="Tool" value={usage.tool ?? ''} onChange={v => set({ tool: v, match: defaultMatch(params, tools[v] ?? []) })} options={toolOptions} />
        </label>
        <div className="limit-field"><span>With the same</span><div className="limit-match">
          <SelectMenu block label={`Parameter of ${tool}`} value={usage.match?.argument ?? ''} onChange={v => set({ match: { argument: v, toolArgument: usage.match?.toolArgument ?? '' } })} options={params.map(p => ({ value: p.name, label: `${tool}.${p.name}` }))} />
          <span aria-hidden="true">=</span>
          <SelectMenu block label={`Parameter of ${usage.tool ?? 'the tool'}`} value={usage.match?.toolArgument ?? ''} onChange={v => set({ match: { argument: usage.match?.argument ?? '', toolArgument: v } })} options={(usage.tool ? tools[usage.tool] ?? [] : []).map(p => ({ value: p.name, label: `${usage.tool}.${p.name}` }))} />
        </div></div>
      </> : null}

      <div className="limit-field"><span>In the last <Help label="the window" text={windowHelp} /></span><div className="limit-window">
        <input className="cp-admin-input" aria-label="Window" type="number" min={1} max={windowMax(usage.windowUnit)} value={usage.windowValue || ''} onChange={e => set({ windowValue: clampWindow(Number(e.target.value), usage.windowUnit) })} />
        <SelectMenu block label="Unit" value={usage.windowUnit} onChange={v => { const unit = v as WindowUnit; set({ windowUnit: unit, windowValue: clampWindow(usage.windowValue, unit) }); }} options={[{ value: 'minutes', label: 'minutes' }, { value: 'hours', label: 'hours' }]} />
      </div></div>

      {op === 'sum' || op === 'count_calls' || op === 'count_distinct' ? <div className="limit-field"><span>Is</span><div className="limit-window">
        <SelectMenu block label="Comparison" value={usage.compare ?? 'le'} onChange={v => set({ compare: v as Usage['compare'] })} options={[{ value: 'le', label: 'at most' }, { value: 'lt', label: 'less than' }]} />
        <input className="cp-admin-input" aria-label="Limit" type="number" min={1} step={1} value={usage.limit ?? ''} placeholder="value" onChange={e => set({ limit: e.target.value })} />
      </div></div> : null}
    </div>

    {op === 'formerly_within' ? <p className="cp-admin-notice cp-admin-notice--warning limit-risk" role="note"><TriangleAlert size={16} aria-hidden="true" /><span><strong>Checks the call, not its result</strong>{formerlyRisk(usage.tool ?? 'the tool', usage.match?.argument ?? 'argument')}</span></p> : null}

    <button type="button" className="relation-icon-button" aria-label="Remove this limit" onClick={onRemove}><Trash2 size={14} /></button>
  </div>;
}
