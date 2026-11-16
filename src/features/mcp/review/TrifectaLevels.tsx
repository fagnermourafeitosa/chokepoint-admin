import { useState } from 'react';
import { Search } from 'lucide-react';
import { Notice } from '../../../components/ui/notice/Notice';
import { SelectMenu } from '../../../components/ui/dropdown/SelectMenu';
import type { ManagedTool, TrifectaLeg, TrifectaLevel } from '../api';
import { effectiveLevels, legs, levelName, levelTone, type ToolCorrections } from '../trifecta';

// Admin 058: the lethal trifecta levels of a tool in the review (Backend 097). A model set them from
// the tool text; the reviewer corrects a wrong one through "Model is wrong?". When the model failed,
// the reviewer sets them, and the block says so. A correction stays in the
// review and travels with Confirm review. Only the result of the three legs together asks for attention.

const levelOptions = (['none', 'low', 'high'] as const).map(value => ({ value, label: levelName[value] }));

export function TrifectaLevels({ tool, corrections, onCorrect }: { tool: ManagedTool; corrections: ToolCorrections; onCorrect: (leg: TrifectaLeg, level: TrifectaLevel | null) => void }) {
  const [editing, setEditing] = useState(false);
  const label = tool.trifecta;
  if (!label) return null;
  const levels = effectiveLevels(label, corrections);
  const failed = label.state === 'failed' && legs.some(l => !levels[l.key]);
  const high = legs.filter(l => levels[l.key] === 'high').length;
  const corrected = (leg: TrifectaLeg) => leg in corrections ? corrections[leg] !== null && corrections[leg] !== label.model?.[leg] : !!label.operator?.[leg];
  // Changing a level back to the model's removes the correction.
  const pick = (leg: TrifectaLeg, level: TrifectaLevel) => onCorrect(leg, level === label.model?.[leg] ? null : level);
  return <section className="tl-section" aria-label="Lethal trifecta">
    <h3 className="cp-admin-label tl-head"><Search size={14} aria-hidden="true" />Lethal trifecta</h3>
    {failed && !editing ? <p className="tl-failed"><span className="mcp-badge" data-tone="danger">Failed</span>The model could not set the levels of this tool. The session check ignores it until its levels are set.</p>
      : <ul className="tl-legs">
        {legs.map(leg => {
          const level = levels[leg.key];
          return <li key={leg.key}>
            <div className="tl-leg-head">
              <span>{leg.label}</span>
              {editing
                ? <SelectMenu label={`${leg.label} level of ${tool.name}`} value={level ?? ''} options={levelOptions} onChange={v => pick(leg.key, v as TrifectaLevel)} />
                : level ? <span className="mcp-badge" data-tone={levelTone[level]}>{levelName[level]}</span> : <span className="mcp-badge" data-tone="danger">Failed</span>}
            </div>
            {level ? <p className="tl-means">{leg.means[level]}</p> : null}
            {corrected(leg.key) ? label.model
              ? <small className="tl-means">Corrected{editing ? <> · <button type="button" className="tl-link" onClick={() => onCorrect(leg.key, null)}>Undo</button></> : null}</small>
              : editing ? <small className="tl-means"><button type="button" className="tl-link" onClick={() => onCorrect(leg.key, null)}>Undo</button></small> : null
              : null}
          </li>;
        })}
      </ul>}
    <p className="tl-why">{editing
      ? <>Pick the level that the text of this tool supports. Your level replaces the model's for this version of the tool and is kept in the review history; when the server changes the tool, the model labels it again. <button type="button" className="tl-link" onClick={() => setEditing(false)}>Done</button></>
      : failed ? <button type="button" className="tl-link" onClick={() => setEditing(true)}>Set the levels</button>
      : !label.model ? <>You set these levels; the model could not. <button type="button" className="tl-link" onClick={() => setEditing(true)}>Change</button></>
      : <>A model read the tool text and set these levels. <button type="button" className="tl-link" onClick={() => setEditing(true)}>Model is wrong?</button></>}</p>
    {high === 3 ? <Notice tone="warning">This tool reads private data, brings untrusted content and sends data out. Every call to it closes the lethal trifecta and raises a High signal in the Inbox.</Notice>
      : high === 2 ? <Notice tone="warning">Two legs are High. In a session where another tool brings the third leg, the call that closes it raises a High signal in the Inbox.</Notice> : null}
  </section>;
}
