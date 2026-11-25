import type { Session } from "../auth/AuthContext";

// Admin 066: the public demo of the site (Backend 107). Its Admin login signs in as this fixed
// owner, set by a backend migration, and its session only reads: the backend refuses every
// write with 403 demo_read_only. Everything the Admin does for the demo is in this folder.
const DEMO_OWNER_ID = "00000000-0000-4000-8000-00000000d3e0";

export function isDemoSession(session: Session | null | undefined): boolean {
  return session?.user.id === DEMO_OWNER_ID;
}
