import './access-navigation.css';
import { NavLink } from 'react-router';
import { accessNavigation } from '../navigation';
import { QuickIncident } from '../../../components/quick-incident/QuickIncident';

export function AccessNavigation() {
  return (
    <nav className="access-navigation" aria-label="Access">
      <div className="access-navigation-links">
        {accessNavigation.map(({ path, label, Icon }) => (
          <NavLink key={path} to={path} end>
            <Icon size={16} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </div>
      <QuickIncident />
    </nav>
  );
}
