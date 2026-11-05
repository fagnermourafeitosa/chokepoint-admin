import { Route, Routes } from 'react-router';
import './prototype.css';

// Layout prototypes: fixed data, never connected to the backend (docs/design-system/visual-specification.md).
// The prototypes are in specs/prototypes/<specification>/ (see specs/prototypes/README.md).
// Register each Active prototype here, with a link and a Route under /prototype/<page>.
// When its real screen is implemented, remove the Route and mark the prototype Archived.
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
