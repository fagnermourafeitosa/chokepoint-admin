import { useState } from 'react';
import { TracePager } from '../../../src/features/investigate/TraceUI';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/investigate/investigate.css';
import { coverage } from './data';
import './prototype.css';

// Admin 057 prototype: Review coverage with the small row action of the design system (decision 10):
// Open tool is a small ghost button under a right-aligned Actions header. Fixed data.
export function CoveragePrototype() {
  const [only, setOnly] = useState(false);
  const [page, setPage] = useState(1);
  const rows = coverage.filter(r => !only || !r.reviewed);
  return <section aria-label="Review coverage" className="mcp-registry">
    <header className="access-page-heading"><div><span className="cp-admin-label">Tool catalog</span><h1 className="cp-admin-title">Review coverage</h1></div>
      <label className="cp-admin-choice"><input type="checkbox" checked={only} onChange={e => { setOnly(e.target.checked); setPage(1); }} />Needs review only</label></header>
    <div className="cp-admin-table-scroll"><table className="cp-admin-table mcp-servers">
      <thead><tr><th>Tool</th><th>Connection</th><th>Review</th><th className="il-actions-head">Actions</th></tr></thead>
      <tbody>{rows.slice((page - 1) * 10, page * 10).map(r => <tr key={`${r.server}-${r.tool}`}>
        <td><code>{r.tool}</code></td>
        <td>{r.server}</td>
        <td><span className="mcp-badge" data-tone={r.reviewed ? 'success' : 'warning'}>{r.reviewed ? 'Reviewed' : 'Needs review'}</span></td>
        <td><div className="identity-row-actions il-row-actions"><a className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" href="/prototype/tool-review-order">Open tool</a></div></td>
      </tr>)}</tbody>
    </table></div>
    <TracePager page={page} size={10} total={rows.length} onPage={setPage} />
  </section>;
}
