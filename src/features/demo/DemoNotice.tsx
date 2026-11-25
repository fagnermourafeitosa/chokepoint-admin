import { Eye } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { isDemoSession } from "./demo";
import "./demo-notice.css";

// Admin 066: the demo session only reads. The notice says so on every screen, before a visitor
// tries a change that the backend refuses.
export function DemoNotice() {
  const a = useAuth();
  if (!isDemoSession(a.session)) return null;
  return (
    <div className="demo-notice-slot">
      <div className="cp-admin-notice demo-notice" role="status">
        <Eye size={18} aria-hidden="true" />
        <div>
          <strong>Read-only demo</strong>
          <span>Open every screen and every call. Changes are not saved.</span>
        </div>
      </div>
    </div>
  );
}
