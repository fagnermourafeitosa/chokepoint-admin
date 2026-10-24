// MCP ToolAnnotations: optional server-provided hints, not access decisions.
export type MCPToolAnnotations = {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
};

export type ToolSummary = {
  id: string;
  name: string;
  server: string;
  description: string;
  annotations?: MCPToolAnnotations;
  enabled: boolean;
};

export type PersonSummary = { id: string; name: string; email: string; assigned: boolean };
export type AgentSummary = {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft';
  tools: readonly ToolSummary[];
  people: readonly PersonSummary[];
};
export type AgentInput = { name: string; description: string };
export type PreviewChange = { id: string; title: string; detail: string };
export type AccessData = { agents: readonly AgentSummary[]; changes: readonly PreviewChange[] };
