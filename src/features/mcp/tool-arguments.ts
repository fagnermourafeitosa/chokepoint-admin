import type { ManagedTool } from './api';

// The top-level arguments of a tool, read from its input schema. The Access catalog reads them
// for the rules of each tool (Admin 050 kept only this part of the old resource API).
export type ToolArgument = { name: string; type: string; required: boolean; usable: boolean };

const argumentName = /^[A-Za-z_][A-Za-z0-9_]*$/;
const object = (value: unknown): Record<string, unknown> | undefined => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

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
