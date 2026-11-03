import { Route, Routes } from 'react-router';
import './prototype.css';

// Layout prototypes: fixed data, never connected to the backend (docs/design-system/visual-specification.md).
// A real screen replaces its prototype page. Add a page here, with a link and a Route under
// /prototype/<page>, for the next screen that is specified.
function Index() {
  return <section aria-label="Prototypes" className="prototype-page">
    <header className="access-page-heading"><div><span className="cp-admin-label">LAYOUT PROTOTYPES</span><h1 className="cp-admin-title">Layout prototypes</h1></div></header>
    <p className="cp-admin-muted">No layout prototype now.</p>
  </section>;
}

export function PrototypePage() {
  return <Routes>
    <Route index element={<Index />} />
  </Routes>;
}
