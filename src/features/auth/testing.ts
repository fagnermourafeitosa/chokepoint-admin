import { vi } from "vitest";
export function mockAuthorizedAPI() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      let body: unknown = {};
      if (path.endsWith("/auth/session"))
        body = {
          user: { id: "test-user", display_name: "teste@chokpoint.dev" },
          csrf_token: "test-csrf",
        };
      else if (path.endsWith("/workspaces"))
        body = { items: [{ tenant_id: "test-tenant", name: "Workspace" }] };
      else if (path.endsWith("/environments"))
        body = {
          items: [
            { id: "sandbox", name: "sandbox" },
            { id: "production", name: "production" },
          ],
        };
      return new Response(JSON.stringify(body), { status: 200 });
    }),
  );
}
