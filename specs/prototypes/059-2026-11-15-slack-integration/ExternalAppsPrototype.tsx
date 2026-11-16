import { Blocks, Server, Users } from 'lucide-react';
import { WaitingBackend } from '../../../src/features/access/delegation/WaitingBackend';
import { AccessNavigation } from '../../../src/features/access/components/AccessNavigation';
import '../../../src/features/access/access.css';
import '../../../src/features/mcp/mcp.css';
import '../../../src/features/identity/identity.css';
import { SlackIcon } from './SlackIcon';
import { BrandIcon } from './BrandIcon';
import { TourButton } from './TourButton';
import { categories, isConfigured } from './data';
import './prototype.css';

// Admin 059 prototype: the External apps tab of Integrations. Each category shows its apps as square cards,
// with no pager: there will be many apps, not so many that they need pages (user, 2026-11-15). A click on
// a card opens its configuration, or its edit page when it is configured. The logo is in its colors when the
// app is configured and in ink when it is not. ?configured=1 shows the configured state. Fixed data.

const logo = (id: string, name: string, color: boolean) => id === 'slack' ? <SlackIcon size={48} color={color} /> : <BrandIcon id={id} label={name} size={48} />;

export function ExternalAppsPrototype() {
  const configured = isConfigured();
  return <main id="main-content" className="admin-page cp-admin-container access-page" aria-label="Access" tabIndex={-1}><AccessNavigation /><section aria-label="Integrations" className="mcp-registry">
    <header className="access-page-heading"><div><h1 className="cp-admin-title">Integrations</h1><p className="cp-admin-muted">Connect custom MCPs, identity providers and external apps, then manage agent access.</p></div></header>
    <div className="mcp-types" role="group" aria-label="Integration type">
      <button aria-pressed={false}><Server size={17} />Custom MCPs</button>
      <button aria-pressed={false}><Users size={17} />Identity providers</button>
      <button aria-pressed><Blocks size={17} />External apps</button>
    </div>
    <div className="mcp-toolbar"><label htmlFor="ea-search">Find an app</label><input id="ea-search" type="search" className="cp-admin-input" placeholder="Search by name or category" /></div>
    {categories.map(category => <section key={category.name} className="ea-category" aria-labelledby={`ea-${category.name}`}>
      <div className="ea-category-head"><h2 id={`ea-${category.name}`} className="cp-admin-label">{category.name}</h2><p className="cp-admin-muted">{category.description}</p></div>
      <ul className="ea-cards">{category.apps.map(app => {
        const soon = app.status === 'under-construction';
        const on = !soon && (configured || app.status === 'configured');
        const body = <>
          <span className="ea-card-logo">{logo(app.id, app.name, on)}</span>
          <strong>{app.name}</strong>
          <small>{app.description}</small>
          <span className="mcp-badge" data-tone={on ? 'success' : undefined}>{soon ? 'Under construction' : on ? 'Configured' : 'Not configured'}</span>
        </>;
        return <li key={app.id}>{soon
          ? <div className="ea-card ea-card--soon" aria-label={`${app.name}, under construction`}>{body}</div>
          : <a className="ea-card" href={`${app.page}${on ? '?configured=1' : ''}`} aria-label={`${on ? 'Edit' : 'Configure'} ${app.name}`}>{body}</a>}</li>;
      })}</ul>
    </section>)}
    <p className="ea-row"><WaitingBackend spec="098" tip="Whether this environment has each app configured, which sets the logo color, the status and whether a click opens the configuration or the edit page." /></p>
    <TourButton />
  </section></main>;
}
