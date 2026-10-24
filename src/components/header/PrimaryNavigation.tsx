import { NavLink } from 'react-router';

type PrimaryNavigationProps = {
  items: readonly { path: string; label: string }[];
};

export function PrimaryNavigation({ items }: PrimaryNavigationProps) {
  return (
    <nav className="cp-admin-topbar-nav admin-primary-nav" aria-label="Primary">
      {items.map(({ path, label }) => (
        <NavLink key={path} to={path} end>{label}</NavLink>
      ))}
    </nav>
  );
}
