import type { MCPToolAnnotations } from './types';

type AnnotationFlag = Exclude<keyof MCPToolAnnotations, 'title'>;
const flags: readonly { key: AnnotationFlag; yes: string; no: string }[] = [
  { key: 'readOnlyHint', yes: 'Read-only', no: 'Can modify' },
  { key: 'destructiveHint', yes: 'Destructive', no: 'Additive' },
  { key: 'idempotentHint', yes: 'Idempotent', no: 'Not idempotent' },
  { key: 'openWorldHint', yes: 'Open world', no: 'Closed world' },
];

const explanations: Record<AnnotationFlag, { yes: string; no: string }> = {
  readOnlyHint: {
    yes: 'The server describes this tool as not changing its environment.',
    no: 'The server reports that this tool may change its environment.',
  },
  destructiveHint: {
    yes: 'The server reports that this tool may perform destructive updates.',
    no: 'The server describes additive changes rather than destructive updates.',
  },
  idempotentHint: {
    yes: 'Repeating the call with the same arguments is described as having no additional effect.',
    no: 'Repeating the same call may have additional effects.',
  },
  openWorldHint: {
    yes: 'The tool may interact with external entities beyond a closed domain.',
    no: 'Interaction is described as limited to a closed domain.',
  },
};

export function toolAnnotationLabels(annotations?: MCPToolAnnotations) {
  if (!annotations) return [];
  return flags.flatMap(({ key, yes, no }) => {
    if (
      annotations.readOnlyHint === true &&
      (key === 'destructiveHint' || key === 'idempotentHint')
    )
      return [];
    const value = annotations[key];
    if (typeof value !== 'boolean') return [];
    return [
      {
        key,
        value,
        label: value ? yes : no,
        description: `${explanations[key][value ? 'yes' : 'no']} (${key}: ${value})`,
      },
    ];
  });
}
