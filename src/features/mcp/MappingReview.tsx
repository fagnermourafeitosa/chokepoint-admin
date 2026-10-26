import type { MappingView } from './mapping-api';
import { sourceLabel } from './mapping-fields';

// Review shows the exact current and proposed templates, including the fallback
// for removal. Confirmation sends the server revision the administrator reviewed.
export function MappingReview({ view, remove, pending, onBack, onConfirm }: { view: MappingView; remove: boolean; pending: boolean; onBack: () => void; onConfirm: () => void }) {
 const next = remove ? view.fallback : view.draft?.document;
 return <>
  <div className="mapping-heading"><div><span className="mapping-eyebrow">{remove ? 'Remove local mapping' : 'Review local mapping'}</span><h1 className="cp-admin-title">{remove ? 'Review the restored mapping' : 'Confirm the projection change'}</h1><p className="cp-admin-muted">{remove ? `This tool will return to ${sourceLabel(view.fallback_source).toLowerCase()}.` : 'Approval replaces the active projection for this tool only.'}</p></div><span className="mcp-badge">Server revision {view.server_revision}</span></div>
  <div className="mapping-review-grid"><section className="mapping-panel"><header><h2>What changes</h2></header><div className="mapping-comparison"><section><h3>Current · {sourceLabel(view.source)}</h3><pre>{JSON.stringify(view.effective, null, 2)}</pre></section><section><h3>Proposed · {remove ? sourceLabel(view.fallback_source) : 'Local mapping'}</h3><pre>{JSON.stringify(next, null, 2)}</pre></section></div></section><aside className="mapping-panel"><header><h2>Review scope</h2></header><div className="mapping-panel-body"><dl className="mapping-facts"><div><dt>Tool</dt><dd><code>{view.tool_name}</code></dd></div><div><dt>Subject identity</dt><dd>Token anchored</dd></div><div><dt>Schema</dt><dd>Revision pinned</dd></div><div><dt>CEL</dt><dd>{remove ? 'Validated at removal' : 'Syntax checked'}</dd></div><div><dt>Policy decision</dt><dd>Not evaluated</dd></div></dl><p className="cp-admin-muted">A concurrent server or schema change blocks confirmation. Backend checks are authoritative.</p></div></aside></div>
  {!remove && !view.can_approve ? <p role="alert" className="cp-admin-notice" data-tone="danger">Review and enable the current server and tool through discovery before approving this mapping.</p> : null}
  <p className="cp-admin-notice">This changes the data submitted for authorization. It does not grant tool access or enforce a policy by itself.</p>
  <div className="mapping-actions"><button type="button" className="cp-admin-button cp-admin-button--secondary" disabled={pending} onClick={onBack}>Back to mapping</button><button type="button" className="cp-admin-button" disabled={pending || !next || (!remove && !view.can_approve)} onClick={onConfirm}>{pending ? 'Saving…' : remove ? 'Confirm removal' : 'Approve mapping'}</button></div>
 </>;
}
