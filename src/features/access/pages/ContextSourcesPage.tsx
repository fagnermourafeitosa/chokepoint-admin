import { Link } from 'lucide-react';
import { EmptyState } from '../../../components/ui/empty-state/EmptyState';

export function ContextSourcesPage() {
  return (
    <section aria-label="Context sources">
      <EmptyState icon={Link} title="No context sources yet" />
    </section>
  );
}
