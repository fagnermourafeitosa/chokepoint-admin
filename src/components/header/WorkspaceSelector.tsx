import { Check, ChevronDown } from 'lucide-react';
import { Dropdown } from '../ui/dropdown/Dropdown';

export function WorkspaceSelector() {
  return (
    <Dropdown
      group="admin-header"
      label="Select workspace"
      triggerClassName="admin-workspace"
      trigger={
        <>
          <span className="admin-workspace-avatar" aria-hidden="true">W</span>
          <span>Workspace</span>
          <ChevronDown size={14} aria-hidden="true" />
        </>
      }
    >
      <button type="button" className="admin-dropdown-option" aria-pressed="true">
        <span>Workspace</span>
        <Check size={15} aria-hidden="true" />
      </button>
    </Dropdown>
  );
}
