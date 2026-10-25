import { useAuth } from "../../features/auth/AuthContext";
import { Check, ChevronDown } from "lucide-react";
import { Dropdown } from "../ui/dropdown/Dropdown";

export function WorkspaceSelector() {
  const a = useAuth();
  return (
    <Dropdown
      group="admin-header"
      label="Select workspace"
      triggerClassName="admin-workspace"
      trigger={
        <>
          <span className="admin-workspace-avatar" aria-hidden="true">
            W
          </span>
          <span>{a.workspace?.name}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </>
      }
    >
      {a.workspaces.map((w) => (
        <button
          key={w.tenant_id}
          type="button"
          className="admin-dropdown-option"
          aria-pressed={a.workspace?.tenant_id === w.tenant_id}
          onClick={() => a.chooseWorkspace(w)}
        >
          <span>{w.name}</span>
          {a.workspace?.tenant_id === w.tenant_id ? (
            <Check size={15} aria-hidden="true" />
          ) : null}
        </button>
      ))}
    </Dropdown>
  );
}
