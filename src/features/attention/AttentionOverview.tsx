import { useRef } from 'react';
import { AttentionCounters } from './AttentionCounters';
import { AttentionInbox } from './AttentionInbox';
import { useInbox, useToolsWithoutReview } from './useAttention';
import type { EnvironmentScope } from '../access/environment-scope';
import './attention.css';

// AttentionOverview is the body of the Overview page: two counters and the Inbox.
export function AttentionOverview({ scope }: { scope: EnvironmentScope }) {
  const inbox = useInbox(scope);
  const tools = useToolsWithoutReview(scope);
  const anchor = useRef<HTMLDivElement>(null);
  return (
    <>
      <AttentionCounters pending={inbox.counts.data} toolsWithoutReview={tools.data} onShowInbox={() => anchor.current?.scrollIntoView({ behavior: 'smooth' })} />
      <div ref={anchor}><AttentionInbox inbox={inbox} headingId="attention-inbox-heading" /></div>
    </>
  );
}
