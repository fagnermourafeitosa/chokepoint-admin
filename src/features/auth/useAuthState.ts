import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient, HttpError, setCSRFToken } from "../../api/http-client";
import type {
  AuthState,
  Session,
  Workspace,
  EnvironmentRecord,
} from "./AuthContext";

export function useAuthState(): AuthState {
  const client = useQueryClient();
  const [workspaceId, setWorkspaceId] = useState<string>();
  const [environmentId, setEnvironmentId] = useState<string>();
  const [logoutFailed, setLogoutFailed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const session = useQuery({
    queryKey: ["auth", "session"],
    queryFn: async ({ signal }) => {
      try {
        const next = await httpClient<Session>("/v1/auth/session", { signal });
        const previous = client.getQueryData<Session | null>([
          "auth",
          "session",
        ]);
        if (previous && previous.user.id !== next.user.id) {
          const privateQuery = (q: { queryKey: readonly unknown[] }) =>
            q.queryKey[0] !== "auth" || q.queryKey[1] !== "session";
          await client.cancelQueries({ predicate: privateQuery });
          client.removeQueries({ predicate: privateQuery });
          setWorkspaceId(undefined);
          setEnvironmentId(undefined);
        }
        return next;
      } catch (error) {
        if (error instanceof HttpError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
  });
  const userId = session.data?.user.id;
  const workspaces = useQuery({
    queryKey: ["auth", "workspaces", userId],
    enabled: !!userId && !session.isFetching && !signingOut && !logoutFailed,
    queryFn: ({ signal }) =>
      httpClient<{ items: Workspace[] }>("/v1/workspaces", { signal }),
    retry: false,
  });
  const selectedId =
    workspaceId ??
    (workspaces.data?.items.length === 1
      ? workspaces.data.items[0].tenant_id
      : undefined);
  const workspace = workspaces.data?.items.find(
    (item) => item.tenant_id === selectedId,
  );
  const environments = useQuery({
    queryKey: ["auth", "environments", userId, workspace?.tenant_id],
    enabled: !!workspace && !session.isFetching && !signingOut && !logoutFailed,
    queryFn: ({ signal }) =>
      httpClient<{ items: EnvironmentRecord[] }>(
        `/v1/workspaces/${workspace!.tenant_id}/environments`,
        { signal },
      ),
    retry: false,
  });
  const environment =
    environments.data?.items.find((item) => item.id === environmentId) ??
    (environmentId
      ? undefined
      : environments.data?.items.find((item) => item.name === "sandbox"));
  useEffect(() => {
    setCSRFToken(session.data?.csrf_token);
  }, [session.data]);
  useEffect(() => {
    const clear = () => {
      void client.cancelQueries();
      client.clear();
      setCSRFToken(undefined);
      setWorkspaceId(undefined);
      setEnvironmentId(undefined);
      client.setQueryData(["auth", "session"], null);
    };
    window.addEventListener("auth-expired", clear);
    return () => window.removeEventListener("auth-expired", clear);
  }, [client]);
  useEffect(() => {
    if (session.data === null) {
      const privateQuery = (q: { queryKey: readonly unknown[] }) =>
        q.queryKey[0] !== "auth" || q.queryKey[1] !== "session";
      void client.cancelQueries({ predicate: privateQuery });
      client.removeQueries({ predicate: privateQuery });
      setWorkspaceId(undefined);
      setEnvironmentId(undefined);
    }
  }, [session.data, client]);
  const clearPrivate = () => {
    void client.cancelQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
    client.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
  };
  function chooseWorkspace(value: Workspace) {
    if (value.tenant_id === workspace?.tenant_id) return;
    clearPrivate();
    void client.cancelQueries({ queryKey: ["auth", "environments"] });
    client.removeQueries({ queryKey: ["auth", "environments"] });
    setEnvironmentId(undefined);
    setWorkspaceId(value.tenant_id);
  }
  function chooseEnvironment(id: string) {
    if (id === environment?.id) return;
    clearPrivate();
    setEnvironmentId(id);
  }
  async function logout() {
    setSigningOut(true);
    setLogoutFailed(false);
    clearPrivate();
    const privateQuery = (q: { queryKey: readonly unknown[] }) =>
      q.queryKey[0] !== "auth" || q.queryKey[1] !== "session";
    await client.cancelQueries({ predicate: privateQuery });
    client.removeQueries({ predicate: privateQuery });
    try {
      await httpClient("/v1/auth/logout", { method: "POST" });
      await client.cancelQueries();
      client.clear();
      client.setQueryData(["auth", "session"], null);
      setCSRFToken(undefined);
      setWorkspaceId(undefined);
      setEnvironmentId(undefined);
    } catch {
      setLogoutFailed(true);
    } finally {
      setSigningOut(false);
    }
  }
  async function refreshWorkspaces() {
    await client.invalidateQueries({ queryKey: ["auth", "workspaces"] });
  }
  return {
    session: session.data,
    loading: session.isPending || session.isFetching,
    failed: session.isError,
    retry: () => {
      void session.refetch();
      void workspaces.refetch();
      if (workspace) void environments.refetch();
    },
    workspaces: workspaces.data?.items ?? [],
    workspace,
    chooseWorkspace,
    environments: environments.data?.items ?? [],
    environment,
    chooseEnvironment,
    contextLoading:
      !!userId &&
      (workspaces.isPending || (!!workspace && environments.isPending)),
    contextFailed: workspaces.isError || environments.isError,
    logout,
    logoutFailed,
    signingOut,
    refreshWorkspaces,
  };
}
