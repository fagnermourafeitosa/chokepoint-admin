import { useAuth } from "../../auth/AuthContext";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminEnvironment } from "../../../app/context/useAdminEnvironment";
import type { AccessData, AgentInput } from "../types";

export function useAccessData() {
  const environment = useAdminEnvironment();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const queryKey = [
    "access",
    "visual-preview",
    auth.session?.user.id,
    auth.workspace?.tenant_id,
    auth.environment?.id,
    environment,
  ] as const;
  const { data } = useQuery<AccessData>({
    queryKey,
    queryFn: skipToken,
    initialData: { agents: [], changes: [] },
  });

  function createAgent(input: AgentInput) {
    const agent = {
      ...input,
      id: crypto.randomUUID(),
      status: "draft" as const,
      tools: [],
      people: [],
    };
    queryClient.setQueryData<AccessData>(queryKey, (current) => ({
      agents: [...(current?.agents ?? []), agent],
      changes: [
        ...(current?.changes ?? []),
        {
          id: agent.id,
          title: `New agent: ${agent.name}`,
          detail: "Draft created in the local preview",
        },
      ],
    }));
    return agent.id;
  }

  function toggleTool(agentId: string, toolId: string) {
    queryClient.setQueryData<AccessData>(queryKey, (current) => {
      if (!current) return current;
      const id = `tool:${agentId}:${toolId}`;
      return {
        agents: current.agents.map((agent) =>
          agent.id === agentId
            ? {
                ...agent,
                tools: agent.tools.map((tool) =>
                  tool.id === toolId
                    ? { ...tool, enabled: !tool.enabled }
                    : tool,
                ),
              }
            : agent,
        ),
        changes: current.changes.some((change) => change.id === id)
          ? current.changes.filter((change) => change.id !== id)
          : [
              ...current.changes,
              { id, title: "Tool access changed", detail: toolId },
            ],
      };
    });
  }

  function applyPreview() {
    queryClient.setQueryData<AccessData>(queryKey, (current) =>
      current ? { ...current, changes: [] } : current,
    );
  }

  return {
    agents: data?.agents ?? [],
    changes: data?.changes ?? [],
    createAgent,
    toggleTool,
    applyPreview,
    environment,
  };
}
