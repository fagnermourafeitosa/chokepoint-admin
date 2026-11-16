import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { IntegrationTabs, type IntegrationType } from './IntegrationTabs';
import { BrandIcon, SlackIcon } from './BrandIcon';
import { catalog } from './catalog';
import { slackApi, slackKey } from './api';
import './externalapps.css';

// The External apps tab of Integrations (Admin 059): the apps by category, as square cards,
// with no pager. A card opens the configuration of its app, or its edit page when it is
// configured. The logo is in color when the app is configured and in ink when it is not.
export function ExternalApps({ scope, onTab }: { scope: EnvironmentScope; onTab: (type: IntegrationType) => void }) {
  const [search, setSearch] = useState('');
  // A 404 is the normal answer before the first save: Slack is not configured.
  const slack = useQuery({
    queryKey: slackKey(scope),
    queryFn: async ({ signal }) => {
      try { return await slackApi.get(scope, signal); } catch (e) { if (e instanceof HttpError && e.status === 404) return null; throw e; }
    },
  });
  const configured = (id: string) => id === 'slack' && !!slack.data;
  // Failing: Slack did not accept the last message (Admin 059 Solution 2, user 2026-11-15).
  const failing = (id: string) => configured(id) && !!slack.data?.last_error;
  const term = search.trim().toLowerCase();
  const categories = catalog
    .map(category => ({ ...category, apps: category.apps.filter(app => !term || `${app.name} ${category.name}`.toLowerCase().includes(term)) }))
    .filter(category => category.apps.length > 0);
  return <section aria-label="Integrations" className="mcp-registry">
    <header className="access-page-heading"><div><h1 className="cp-admin-title">Integrations</h1><p className="cp-admin-muted">Connect custom MCPs, identity providers and external apps, then manage agent access.</p></div></header>
    <IntegrationTabs current="external" onTab={onTab} />
    <div className="mcp-toolbar"><label htmlFor="ea-search">Find an app</label><input id="ea-search" type="search" className="cp-admin-input" placeholder="Search by name or category" value={search} onChange={e => setSearch(e.target.value)} /></div>
    {slack.isError ? <p role="alert" className="cp-admin-notice cp-admin-notice--danger">Could not load the status of Slack. <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => void slack.refetch()}>Retry</button></p> : null}
    {categories.length === 0 ? <p className="cp-admin-muted">No app matches this search.</p> : null}
    {categories.map(category => <section key={category.name} className="ea-category" aria-labelledby={`ea-${category.name}`}>
      <div className="ea-category-head"><h2 id={`ea-${category.name}`} className="cp-admin-label">{category.name}</h2><p className="cp-admin-muted">{category.description}</p></div>
      <ul className="ea-cards">{category.apps.map(app => {
        const on = configured(app.id);
        const failed = failing(app.id);
        const status = !app.available ? 'Under construction' : slack.isPending ? 'Loading…' : failed ? 'Failing' : on ? 'Configured' : 'Not configured';
        const body = <>
          <span className="ea-card-logo">{app.id === 'slack' ? <SlackIcon size={48} color={on} /> : <BrandIcon id={app.id} size={48} />}</span>
          <strong>{app.name}</strong>
          <small>{app.description}</small>
          <span className="mcp-badge" data-tone={failed ? 'danger' : on ? 'success' : undefined}>{status}</span>
        </>;
        return <li key={app.id}>{app.available
          ? <Link className="ea-card" to={`/access/integrations?${new URLSearchParams({ type: 'external', app: app.id })}`} aria-label={`${on ? 'Edit' : 'Configure'} ${app.name}`}>{body}</Link>
          : <div className="ea-card ea-card--soon" aria-label={`${app.name}, under construction`}>{body}</div>}</li>;
      })}</ul>
    </section>)}
  </section>;
}
