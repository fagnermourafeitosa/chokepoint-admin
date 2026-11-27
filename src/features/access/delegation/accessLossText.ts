import { denyText, exchangeShort } from '../../investigate/labels';
import type { Loss } from './accessLoss';

// The line of each loss of access (Admin 064 Solution 2). One entry per type of loss; the deny
// reasons are the texts of Investigate. More than three people read as a count and the provider.
const people = (names: string[], provider: string) => (names.length > 3 || !names.length ? `${names.length || 'The'} people of ${provider}` : names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);
const kindWord = { person: 'people', service: 'services' } as const;

type Lines = { [T in Loss['type']]: (loss: Extract<Loss, { type: T }>, agent: string) => string };

const lines: Lines = {
  'last-provider': (_, agent) => `Nobody can delegate to ${agent} after this. Every call of the agent is denied: ${exchangeShort.no_delegation}.`,
  people: (l, agent) => `${people(l.names, l.provider)} can no longer delegate to ${agent}. The calls made for them are denied: ${exchangeShort.no_delegation}.`,
  kinds: (l, agent) => `${l.provider} no longer delegates ${l.kinds.map(k => kindWord[k]).join(' and ')} to ${agent}. The calls made for them are denied: ${exchangeShort.no_delegation}.`,
  blocked: (l, agent) => `${l.name} is blocked on ${agent}. The calls made for ${l.name} are denied: ${exchangeShort.blocked}.`,
  tool: (l, agent) => `${agent} can no longer call ${l.tool} on ${l.server}. Those calls are denied: ${denyText.no_grant}`,
  value: l => `${l.server} no longer allows ${l.value} as ${l.kind}. Calls with that value are denied: ${denyText.no_resource}`,
  rule: l => `${l.before ? `A rule of ${l.tool} changed: ${l.before} → ${l.after ?? ''}` : `A rule of ${l.tool} was added: ${l.after ?? ''}`}. Calls that passed before can be denied: ${denyText.condition}`,
  expiry: l => `${l.name} stops on ${l.date}. After that, its calls are denied: ${l.relation === 'provider' ? `${exchangeShort.no_delegation}.` : denyText.no_grant}`,
};

export function lossText(loss: Loss, agent: string): string {
  return (lines[loss.type] as (l: Loss, a: string) => string)(loss, agent);
}
