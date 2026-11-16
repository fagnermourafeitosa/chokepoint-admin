import type { ReactNode } from 'react';

// Design system Loader (Admin 058): the canonical wait of a whole content area, centered in it,
// with no border or surface. Three ink squares light up in turn; the text says what is loading.
export function Loader({ children }: { children: ReactNode }) {
  return <div className="cp-admin-loader" role="status">
    <span className="cp-admin-loader-mark" aria-hidden="true"><span /><span /><span /></span>
    <p className="cp-admin-loader-text">{children}</p>
  </div>;
}
