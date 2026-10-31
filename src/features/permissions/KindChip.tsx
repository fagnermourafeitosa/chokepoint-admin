import type { MemberKind } from './api';

const labels: Record<MemberKind, string> = { person: 'Person', service: 'Service' };

// The kind is always text, so it never relies on color alone.
export function KindChip({ kind }: { kind: MemberKind }) {
 return <span className="people-kind-chip" data-kind={kind}>{labels[kind]}</span>;
}
