import { NavLink, Route, Routes } from 'react-router';
import { HarnessAccessPage } from './harness/HarnessAccessPage';
import { HarnessLoginPages } from './harness/HarnessLoginPages';
import './prototype.css';

// Layout prototypes: fixed data, never connected to the backend (docs/design-system/visual-specification.md).
// A real screen replaces its prototype page. Add a page here, with a NavLink and a Route under
// /prototype/<page>, for the next screen that is specified.
function Index() {
  return <section aria-label="Prototypes" className="prototype-page">
    <header className="access-page-heading"><div><span className="cp-admin-label">LAYOUT PROTOTYPES</span><h1 className="cp-admin-title">Layout prototypes</h1></div></header>
    <ul><li><NavLink to="harness-access">Harness access (Admin 036)</NavLink></li><li><NavLink to="harness-login">Harness login pages (authorization server, Admin 036 and Backend 045)</NavLink></li></ul>
  </section>;
}

export function PrototypePage() {
  return <Routes>
    <Route index element={<Index />} />
    <Route path="harness-access" element={<HarnessAccessPage />} />
    <Route path="harness-login" element={<HarnessLoginPages />} />
  </Routes>;
}
