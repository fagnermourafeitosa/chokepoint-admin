import './prototype.css';

// Layout prototypes: fixed data, never connected to the backend (docs/design-system/visual-specification.md).
// A real screen replaces its prototype page; Admin 029 removed the last pages. Add a page here,
// with a NavLink and a Route under /prototype/<page>, for the next screen that is specified.
export function PrototypePage() {
  return <section aria-label="Prototypes" className="prototype-page">
    <header className="access-page-heading"><div><span className="cp-admin-label">LAYOUT PROTOTYPES</span><h1 className="cp-admin-title">Layout prototypes</h1><p className="cp-admin-muted">No layout prototype is open. Every specified screen is implemented.</p></div></header>
  </section>;
}
