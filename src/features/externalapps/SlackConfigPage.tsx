import { useQuery } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import { SlackIcon } from './BrandIcon';
import { Notice } from '../../components/ui/notice/Notice';
import { deliveredAt } from '../account/EventsExportPage';
import { SlackForm } from './SlackForm';
import { slackApi, slackErrorText, slackKey } from './api';
import './externalapps.css';
import '../identity/identity.css';

// Configure Slack, or Edit Slack when it is configured (Admin 059 Solution 5).
export function SlackConfigPage({ scope, workspace, environment, onDone }: { scope: EnvironmentScope; workspace: string; environment: string; onDone: () => void }) {
  const config = useQuery({
    queryKey: slackKey(scope),
    queryFn: async ({ signal }) => {
      try { return await slackApi.get(scope, signal); } catch (e) { if (e instanceof HttpError && e.status === 404) return null; throw e; }
    },
  });
  const configured = !!config.data;
  const lastError = config.data?.last_error;
  return <section className="identity-editor" aria-label={configured ? 'Edit Slack' : 'Configure Slack'}>
    <button type="button" className="cp-admin-button cp-admin-button--secondary trace-back ea-back" onClick={onDone}>Back to Integrations</button>
    <header className="ea-app-head"><SlackIcon size={32} color={configured} /><div><h1 className="cp-admin-title">{configured ? 'Edit Slack' : 'Configure Slack'}</h1><p className="cp-admin-muted">Send messages to one Slack channel, group message or person. The app only sends: it reads nothing in Slack.</p></div></header>
    {config.isPending ? <p role="status">Loading the Slack configuration…</p>
      : config.isError ? <div role="alert" className="cp-admin-notice cp-admin-notice--danger">Could not load the Slack configuration. <button type="button" className="cp-admin-button cp-admin-button--ghost cp-admin-button--small" onClick={() => void config.refetch()}>Retry</button></div>
        : <>
          {/* Failure notice (Admin 059 Solution 5.6, user 2026-11-15): Slack did not accept the last message. */}
          {lastError ? <Notice tone="error" title="The last message to Slack failed.">{slackErrorText(lastError)} Last delivery {deliveredAt(config.data?.last_delivery_at ?? null)}. Saving, or the next message that Slack accepts, clears this notice.</Notice> : null}
          <SlackForm scope={scope} config={config.data} workspace={workspace} environment={environment} onDone={onDone} />
        </>}
  </section>;
}
