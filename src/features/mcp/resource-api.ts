import { httpClient } from '../../api/http-client';
import type { EnvironmentScope } from '../access/environment-scope';
import type { MappingDocument } from './mapping-api';
import { object } from './mapping-fields';
import type { ManagedTool } from './api';

// The Resource block of Admin 027: the `resource` of the COAZ mapping of one tool.
// The backend validates and owns the mapping; these helpers only read and write the form.
export type ResourceMap = { argument: string; type: string };
export type ResourceRead = { editable: boolean; resource?: ResourceMap; custom?: string };
export type ResourceAgent = { agent_id: string; name: string; values: number };
export type ToolArgument = { name: string; type: string; required: boolean; usable: boolean };

export const resourceTypePattern = /^[a-z][a-z0-9_]{1,79}$/;
const argumentName = /^[A-Za-z_][A-Za-z0-9_]*$/;
const argumentId = /^\$params\.arguments\.([A-Za-z_][A-Za-z0-9_]*)$/;
// The COAZ-MCP default: no resource check (Backend 029).
const noResource = { type: 'tool', id: '$params.name' };

export const propose = (tool: string, argument: string) => `${tool}_${argument}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
export const showResource = (r?: ResourceMap) => (r ? `/${r.argument} → ${r.type}` : 'None');

// Only the single `evaluation` envelope is edited here; other forms stay in Configure mapping.
export function readResource(document?: MappingDocument): ResourceRead {
  const resource = object(object(document?.evaluation)?.resource);
  if (!resource || typeof resource.type !== 'string' || typeof resource.id !== 'string') return { editable: false };
  if (resource.type === noResource.type) return { editable: true };
  const argument = argumentId.exec(resource.id)?.[1];
  return argument ? { editable: true, resource: { argument, type: resource.type } } : { editable: false, custom: `${resource.id} → ${resource.type}` };
}

export function writeResource(document: MappingDocument, resource?: ResourceMap): MappingDocument {
  const evaluation = object(document.evaluation) ?? {};
  return { ...document, evaluation: { ...evaluation, resource: resource ? { type: resource.type, id: `$params.arguments.${resource.argument}` } : noResource } };
}

// The type shown for an argument; a union such as anyOf string and null shows as "string | null".
function schemaType(property?: Record<string, unknown>): string {
  if (typeof property?.type === 'string') return property.type;
  if (Array.isArray(property?.type)) return property.type.join(' | ');
  const union = Array.isArray(property?.anyOf) ? property.anyOf : Array.isArray(property?.oneOf) ? property.oneOf : undefined;
  const types = union?.map(v => object(v)?.type).filter((t): t is string => typeof t === 'string');
  return types?.length ? types.join(' | ') : 'unknown';
}

export function toolArguments(tool: ManagedTool): ToolArgument[] {
  const schema = object(tool.contract.inputSchema);
  const properties = object(schema?.properties) ?? {};
  const required = Array.isArray(schema?.required) ? schema.required : [];
  return Object.entries(properties).map(([name, p]) => {
    const type = schemaType(object(p));
    return { name, type, required: required.includes(name), usable: type === 'string' && argumentName.test(name) };
  });
}

const agentsPath = (s: EnvironmentScope): `/v1/${string}` => `/v1/workspaces/${s.tenantId}/environments/${s.environmentId}/resource-types/agents`;
export const resourceAgentsKey = (s: EnvironmentScope, serverId: string, type: string) => ['resource-type-agents', s.userId, s.tenantId, s.environmentId, serverId, type] as const;

// Agents with published values of one resource type (Backend 033 Admin contract 3).
export const resourceApi = {
  agents: (s: EnvironmentScope, serverId: string, type: string, signal: AbortSignal) => httpClient<{ items: ResourceAgent[] }>(`${agentsPath(s)}?${new URLSearchParams({ server_id: serverId, type })}`, { signal }),
};
