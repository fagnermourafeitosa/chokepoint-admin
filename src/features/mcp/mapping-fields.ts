import type { MappingDocument } from './mapping-api';

// Basic editing preserves fields it does not display. Advanced envelopes remain
// in JSON mode so switching editors cannot silently discard evaluations.
export const object = (value: unknown): MappingDocument | undefined => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as MappingDocument : undefined;
export function parseMapping(text: string): MappingDocument {
 const parsed = object(JSON.parse(text));
 if (!parsed) throw new Error('Use a mapping JSON object.');
 return parsed;
}
export function basicFields(text: string) {
 try {
  const body = object(parseMapping(text).evaluation);
  const action = object(body?.action);
  const resource = object(body?.resource);
  const context = body?.context === undefined ? {} : object(body.context);
  if (!body || !action || !resource || !context || typeof action.name !== 'string' || typeof resource.type !== 'string' || typeof resource.id !== 'string') return undefined;
  return { action: action.name, resourceType: resource.type, resourceId: resource.id, context: Object.entries(context) };
 } catch { return undefined; }
}
export function updateBasic(text: string, field: 'action' | 'resourceType' | 'resourceId', value: string) {
 const root = parseMapping(text);
 const body = object(root.evaluation)!;
 const target = field === 'action' ? 'action' : 'resource';
 const key = field === 'action' ? 'name' : field === 'resourceType' ? 'type' : 'id';
 return JSON.stringify({ ...root, evaluation: { ...body, [target]: { ...object(body[target]), [key]: value } } }, null, 2);
}
export const sourceLabel = (source: string) => source === 'local' ? 'Local mapping' : source === 'server' ? 'Server declaration' : 'COAZ default';
