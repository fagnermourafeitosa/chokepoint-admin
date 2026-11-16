import { Blocks, Server, Users } from 'lucide-react';

export type IntegrationType = 'custom' | 'identity' | 'external';

// The type tabs of Integrations: Custom MCPs, Identity providers and External apps (Admin 059).
export function IntegrationTabs({ current, onTab }: { current: IntegrationType; onTab: (type: IntegrationType) => void }) {
  const tab = (type: IntegrationType, icon: React.ReactNode, label: string) =>
    <button type="button" aria-pressed={current === type} onClick={() => { if (current !== type) onTab(type); }}>{icon}{label}</button>;
  return <div className="mcp-types" role="group" aria-label="Integration type">
    {tab('custom', <Server size={17} />, 'Custom MCPs')}
    {tab('identity', <Users size={17} />, 'Identity providers')}
    {tab('external', <Blocks size={17} />, 'External apps')}
  </div>;
}
