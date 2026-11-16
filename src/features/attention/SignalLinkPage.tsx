import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { HttpError } from '../../api/http-client';
import { useAuth } from '../auth/AuthContext';
import { AuthFrame, AuthStatus } from '../auth/AuthPages';
import { attentionApi } from './api';
import { targetPath } from './targets';

// The link of a Slack message (Admin 059, Backend 098 Messages 3):
// /inbox/<signal>?workspace=<tenant>&environment=<environment>. It opens the workspace
// and the environment of the signal, then the target of the signal, as the Inbox does,
// or the Overview when the signal has no target. It needs a session, not a chosen
// workspace: a link opened in a new tab has none.
export function SignalLinkPage() {
  const { signalId = '' } = useParams();
  const [params] = useSearchParams();
  const auth = useAuth();
  const tenantId = params.get('workspace') ?? '';
  const environmentId = params.get('environment') ?? '';
  const workspace = auth.workspaces.find(w => w.tenant_id === tenantId);
  const inScope = auth.workspace?.tenant_id === tenantId && auth.environment?.id === environmentId;
  const [refused, setRefused] = useState(false);
  useEffect(() => {
    if (workspace && !inScope && !refused && !auth.openWorkspace(workspace, environmentId)) setRefused(true);
  }, [workspace, inScope, refused, auth, environmentId]);
  const scope = auth.session && inScope ? { userId: auth.session.user.id, tenantId, environmentId } : undefined;
  const signal = useQuery({
    enabled: !!scope,
    queryKey: ['attention-signals', 'link', scope?.userId, tenantId, environmentId, signalId],
    queryFn: ({ signal: abort }) => attentionApi.get(scope!, signalId, abort),
    retry: false,
  });
  const message = (text: string) => <AuthFrame><p role="status">{text}</p><Link className="cp-admin-button" to="/">Open the Overview</Link></AuthFrame>;
  if (auth.contextFailed) return <AuthStatus />;
  if (!auth.contextLoading && !workspace) return message('This link is for a workspace that you cannot open.');
  if (refused) return message('The workspace of this link was not opened.');
  if (signal.isError) return message(signal.error instanceof HttpError && signal.error.status === 404 ? 'This signal no longer exists.' : 'Could not load this signal.');
  if (signal.data) return <Navigate replace to={targetPath(signal.data) ?? '/'} />;
  return <AuthFrame><p role="status">Opening the signal…</p></AuthFrame>;
}
