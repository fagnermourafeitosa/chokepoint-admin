// MCP ToolAnnotations: optional server-provided hints, not access decisions.
export type MCPToolAnnotations = {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
};
