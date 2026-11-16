import { httpClient } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';

// The Slack configuration of one workspace environment (Admin 059, Backend 098 API).
// The token is write-only: the read says only whether one is stored.
export type DestinationKind = 'channel' | 'group' | 'person';
export type SlackDestination = { kind: DestinationKind; channel_id?: string; member_ids?: string[] };
export type SlackConfig = { destination: SlackDestination; signal_types: string[]; token_configured: boolean; last_delivery_at: string | null; last_error: string | null };
// A blank token keeps the stored one.
export type SlackInput = { destination: SlackDestination; signal_types: string[]; token?: string };
export type TestResult = { delivered: boolean; error: string; duration_ms: number };

export const slackKey = (s: EnvironmentScope) => ['external-apps', 'slack', s.userId, s.tenantId, s.environmentId] as const;
const path = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${encodeURIComponent(s.tenantId)}/environments/${encodeURIComponent(s.environmentId)}/external-apps/slack`;

export const slackApi = {
  get: (s: EnvironmentScope, signal: AbortSignal) => httpClient<SlackConfig>(path(s), { signal }),
  save: (s: EnvironmentScope, input: SlackInput) => httpClient<SlackConfig>(path(s), { method: 'PUT', json: input }),
  test: (s: EnvironmentScope, input: SlackInput) => httpClient<TestResult>(`${path(s)}/test`, { method: 'POST', json: input }),
};

// The messages of the backend error codes (Backend 098 API).
export const saveErrors: Record<string, string> = {
  invalid_slack_destination: 'Check the Slack IDs: a channel ID starts with C or G, a member ID with U or W, in capital letters and digits.',
  invalid_signal_type: 'Choose the signals again.',
  invalid_slack_token: 'Paste the Bot User OAuth Token. It starts with xoxb-.',
  slack_token_required: 'Paste the Bot User OAuth Token.',
};

// The Slack answers to a test message, in words. Other codes show as they are.
export const testErrors: Record<string, string> = {
  invalid_auth: 'Slack refused the token. Copy the Bot User OAuth Token again.',
  token_revoked: 'The token was revoked. Reinstall the app and copy the new token.',
  account_inactive: 'The app or its workspace is inactive.',
  channel_not_found: 'Slack did not find this channel. Check the Channel ID.',
  not_in_channel: 'The app is not in this channel. In the channel, type /invite and the name of the app.',
  is_archived: 'This channel is archived.',
  messages_tab_disabled: 'The Messages tab of the app is off. Create the app from the manifest, or turn it on in App Home.',
  missing_scope: 'The app is missing a scope. Create it from the manifest.',
  ratelimited: 'Slack is limiting the messages. Try again in a minute.',
  user_not_found: 'Slack did not find one of the member IDs.',
  unreachable: 'Slack did not answer. Try again.',
};

// slackErrorText says in words why Slack did not accept a message: the test answer or the
// last_error of a delivery (Backend 098). An unknown code shows as it is.
export function slackErrorText(code: string) {
  if (code === 'stored_token_unreadable') return 'The stored token could not be read. Paste the token again and save.';
  const status = /^http_(\d{3})$/.exec(code);
  if (status) return `Slack answered HTTP ${status[1]}.`;
  return testErrors[code] ?? `Slack answered ${code}.`;
}
