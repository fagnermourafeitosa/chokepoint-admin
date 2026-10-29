import { useRef } from 'react';
import { AttentionCounters } from './AttentionCounters';
import { AttentionInbox } from './AttentionInbox';
import { useDeniedToday, useInbox, useToolsWithoutReview } from './useAttention';
import type { EnvironmentScope } from '../access/environment-scope';
import './attention.css';

// AttentionOverview is the body of the Overview page: three counters and the Inbox.
export function AttentionOverview({ scope }: { scope: EnvironmentScope }) {
  const inbox = useInbox(scope);
  const tools = useToolsWithoutReview(scope);
  const denied = useDeniedToday(scope);
  const anchor = useRef<HTMLDivElement>(null);
  const showInbox = () => anchor.current?.scrollIntoView({ behavior: 'smooth' });
  return (
    <>
      <AttentionCounters
        pending={inbox.counts.data}
        deniedToday={denied.data}
        toolsWithoutReview={tools.data}
        onShowInbox={() => { inbox.setType('all'); showInbox(); }}
        onShowDenied={() => { inbox.setType('requests-denied'); showInbox(); }}
      />
      <div ref={anchor}><AttentionInbox inbox={inbox} headingId="attention-inbox-heading" /></div>
    </>
  );
}
