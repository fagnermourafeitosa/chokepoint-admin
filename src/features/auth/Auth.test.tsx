import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { App } from "../../app/App";

afterEach(() => vi.unstubAllGlobals());
it("shows login without private content when the server returns 401", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
  );
  window.history.replaceState(null, "", "/access");
  render(<App />);
  expect(screen.queryByRole("navigation", { name: "Primary" })).toBeNull();
  expect(
    await screen.findByRole("heading", { name: "Sign in to Chokepoint" }),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Continue to sign in" }).closest("form"),
  ).toHaveAttribute("action", "/api/v1/auth/login");
});
it("shows a retry state for service failure without redirecting to provider", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("{}", { status: 503 })),
  );
  window.history.replaceState(null, "", "/access");
  render(<App />);
  expect(
    await screen.findByRole("button", { name: "Try again" }),
  ).toBeVisible();
  await waitFor(() => expect(window.location.pathname).toBe("/access"));
});
it("discards private drafts before a workspace switch finishes", async () => {
  const { default: userEvent } = await import("@testing-library/user-event");
  const user = userEvent.setup();
  let finishB: (value: Response) => void = () => {};
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      if (path.endsWith("/auth/session"))
        return new Response(
          JSON.stringify({
            user: { id: "user", display_name: "Administrator" },
            csrf_token: "csrf",
          }),
        );
      if (path.endsWith("/workspaces"))
        return new Response(
          JSON.stringify({
            items: [
              { tenant_id: "a", name: "Workspace A" },
              { tenant_id: "b", name: "Workspace B" },
            ],
          }),
        );
      if (path.includes("/workspaces/b/"))
        return new Promise<Response>((resolve) => {
          finishB = resolve;
        });
      return new Response(
        JSON.stringify({ items: [{ id: "sandbox-a", name: "sandbox" }] }),
      );
    }),
  );
  window.history.replaceState(null, "", "/workspaces");
  render(<App />);
  await user.click(await screen.findByRole("button", { name: "Workspace A" }));
  await user.click(await screen.findByRole("link", { name: "Access" }));
  await user.click(await screen.findByRole("button", { name: "New agent" }));
  await user.type(
    screen.getByRole("textbox", { name: "Agent name" }),
    "Private Draft A",
  );
  await user.click(screen.getByRole("button", { name: "Create agent" }));
  expect(
    await screen.findByRole("heading", { name: "Private Draft A" }),
  ).toBeVisible();
  await user.click(screen.getByLabelText("Select workspace"));
  await user.click(screen.getByRole("button", { name: "Workspace A" }));
  await user.click(screen.getByRole("link", { name: "Overview" }));
  await user.click(screen.getByRole("link", { name: "Access" }));
  expect(
    screen.getByRole("heading", { name: "Private Draft A" }),
  ).toBeVisible();
  await user.click(screen.getByLabelText("Select workspace"));
  await user.click(screen.getByRole("button", { name: "Workspace B" }));
  expect(screen.queryByRole("heading", { name: "Private Draft A" })).toBeNull();
  finishB(
    new Response(
      JSON.stringify({ items: [{ id: "sandbox-b", name: "sandbox" }] }),
    ),
  );
  expect(await screen.findByText("No agents yet")).toBeVisible();
});
it("removes private drafts when the server session changes identity", async () => {
  const { default: userEvent } = await import("@testing-library/user-event");
  const { QueryClientProvider } = await import("@tanstack/react-query");
  const { createQueryClient } = await import(
    "../../app/providers/query-client"
  );
  const { AppRoutes } = await import("../../app/AppRoutes");
  const user = userEvent.setup();
  const client = createQueryClient();
  let actor = "a";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const path = String(input);
      let body: unknown;
      if (path.endsWith("/auth/session"))
        body = { user: { id: actor, display_name: actor }, csrf_token: "csrf" };
      else if (path.endsWith("/workspaces"))
        body = { items: [{ tenant_id: actor, name: `Workspace ${actor}` }] };
      else body = { items: [{ id: `sandbox-${actor}`, name: "sandbox" }] };
      return new Response(JSON.stringify(body));
    }),
  );
  window.history.replaceState(null, "", "/access");
  render(
    <QueryClientProvider client={client}>
      <AppRoutes />
    </QueryClientProvider>,
  );
  await user.click(await screen.findByRole("button", { name: "New agent" }));
  await user.type(
    screen.getByRole("textbox", { name: "Agent name" }),
    "Private Identity A",
  );
  await user.click(screen.getByRole("button", { name: "Create agent" }));
  expect(
    await screen.findByRole("heading", { name: "Private Identity A" }),
  ).toBeVisible();
  actor = "b";
  await client.invalidateQueries({ queryKey: ["auth", "session"] });
  await waitFor(() =>
    expect(screen.getByLabelText("Select workspace")).toHaveTextContent(
      "Workspace b",
    ),
  );
  actor = "a";
  await client.invalidateQueries({ queryKey: ["auth", "session"] });
  await waitFor(() =>
    expect(screen.getByLabelText("Select workspace")).toHaveTextContent(
      "Workspace a",
    ),
  );
  expect(
    screen.queryByRole("heading", { name: "Private Identity A" }),
  ).toBeNull();
});
