import { useEffect } from 'react';
import { useNavigate } from 'react-router';

// The link of a Slack message (Admin 059) survives the sign-in: a signed-out
// person who opens /inbox/<signal> returns to it after signing in. Only Inbox
// links are kept, so the stored value can never send the person off the Admin.
const key = 'cp-admin-return-link';
const inboxLink = /^\/inbox\/[A-Za-z0-9-]+(\?[A-Za-z0-9=&%._-]*)?$/;

export function keepReturnLink(path: string) {
  if (!inboxLink.test(path)) return;
  try { sessionStorage.setItem(key, path); } catch { /* the link opens the Overview after the sign-in */ }
}

// takeReturnLink returns the kept link once, then forgets it.
export function takeReturnLink(): string | undefined {
  try {
    const path = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return path && inboxLink.test(path) ? path : undefined;
  } catch { return undefined; }
}

// useReturnLink opens the kept link once the session is known.
export function useReturnLink(signedIn: boolean) {
  const navigate = useNavigate();
  useEffect(() => {
    if (!signedIn) return;
    const path = takeReturnLink();
    if (path) void navigate(path, { replace: true });
  }, [signedIn, navigate]);
}
