import { Plug } from 'lucide-react';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';

export function IntegrationsPage() {
  return (
    <section aria-label="Integrations">
      <EmptyState icon={Plug} title="No integrations yet" />
    </section>
  );
}
