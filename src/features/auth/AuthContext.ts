import { createContext, useContext } from "react";
export type Workspace = { tenant_id: string; name: string };
export type EnvironmentRecord = { id: string; name: "sandbox" | "production" };
export type Session = {
  user: { id: string; display_name: string; can_create_workspace?: boolean };
  csrf_token: string;
};
export type AuthState = {
  session: Session | null | undefined;
  loading: boolean;
  failed: boolean;
  retry: () => void;
  workspaces: Workspace[];
  workspace: Workspace | undefined;
  chooseWorkspace: (workspace: Workspace) => void;
  environments: EnvironmentRecord[];
  environment: EnvironmentRecord | undefined;
  chooseEnvironment: (id: string) => void;
  contextLoading: boolean;
  contextFailed: boolean;
  logout: () => Promise<void>;
  logoutFailed: boolean;
  signingOut: boolean;
  refreshWorkspaces: () => Promise<void>;
};
export const AuthContext = createContext<AuthState | null>(null);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Authentication context required");
  return value;
}
