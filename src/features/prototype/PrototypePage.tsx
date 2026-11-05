import { useEffect, useState, type ReactElement } from 'react';
import { Link, Route, Routes } from 'react-router';
import { loadPrototypeCatalog, type PrototypeEntry, type PrototypeState } from './catalog';
import './prototype.css';

// Layout prototypes: fixed data, never connected to the backend (docs/design-system/visual-specification.md).
// The prototypes are in specs/prototypes/<specification>/ (see specs/prototypes/README.md).
// Register each Active prototype here: its specification ID, its path under /prototype/<page> and
// its page. When its real screen is implemented, remove the entry and mark the prototype Archived.
const pages: Record<string, { path: string; element: ReactElement }> = {};

// The index notes are Markdown: show `code` spans as code, the rest as text.
function inlineCode(text: string) {
  return text.split('`').map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}

function Index() {
  const [tab, setTab] = useState<PrototypeState>('Active');
  const [catalog, setCatalog] = useState<PrototypeEntry[] | undefined>();
  useEffect(() => { void loadPrototypeCatalog().then(setCatalog, () => setCatalog([])); }, []);
  const count = (state: PrototypeState) => catalog?.filter(entry => entry.state === state).length ?? 0;
  const rows = catalog?.filter(entry => entry.state === tab) ?? [];
  return <section aria-label="Prototypes" className="prototype-page">
    <header className="access-page-heading"><div><span className="cp-admin-label">LAYOUT PROTOTYPES</span><h1 className="cp-admin-title">Layout prototypes</h1></div></header>
    <p className="cp-admin-muted prototype-intro">Each prototype belongs to one specification and one date. Archived prototypes are records of how a layout evolved, not the current Admin.</p>
    <div className="cp-admin-segmented prototype-tabs" role="radiogroup" aria-label="Prototype state">
      {(['Active', 'Archived'] as const).map(state => <label key={state} className="cp-admin-segment"><input type="radio" name="prototype-state" value={state} checked={tab === state} onChange={() => setTab(state)} /><span>{state} ({count(state)})</span></label>)}
    </div>
    {catalog === undefined ? <p role="status" className="cp-admin-muted">Loading prototypes…</p>
      : rows.length === 0 ? <p className="cp-admin-muted">{tab === 'Active' ? 'No layout prototype now.' : 'No archived prototype.'}</p>
      : <div className="cp-admin-table-scroll"><table className="cp-admin-table prototype-table">
        <thead><tr><th scope="col">Specification</th><th scope="col">Summary</th><th scope="col">Specification status</th><th scope="col">{tab === 'Active' ? 'Page' : 'Record'}</th></tr></thead>
        <tbody>{rows.map(entry => <tr key={entry.id}>
          <td><strong>{entry.id}</strong> · {entry.title}</td>
          <td>{entry.summary}</td>
          <td>{entry.specStatus ?? '—'}</td>
          <td>{tab === 'Active' && pages[entry.id]
            ? <Link to={pages[entry.id].path}>Open /prototype/{pages[entry.id].path}</Link>
            : <><code>specs/prototypes/{entry.folder}/</code>{entry.notes ? <small className="prototype-notes">{inlineCode(entry.notes)}</small> : null}</>}</td>
        </tr>)}</tbody>
      </table></div>}
  </section>;
}

export function PrototypePage() {
  return <Routes>
    <Route index element={<Index />} />
    {Object.values(pages).map(page => <Route key={page.path} path={page.path} element={page.element} />)}
  </Routes>;
}
