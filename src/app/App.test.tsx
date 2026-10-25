import { mockAuthorizedAPI } from "../features/auth/testing";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

beforeEach(mockAuthorizedAPI);
afterEach(() => vi.unstubAllGlobals());

describe("Access navigation", () => {
  it("opens each Access section while keeping Access active in the header", async () => {
    window.history.replaceState(null, "", "/access");
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("navigation", { name: "Primary" });

    const navigation = screen.getByRole("navigation", { name: "Access" });
    expect(
      within(navigation).getByRole("link", { name: "Permissions" }),
    ).toHaveAttribute("aria-current", "page");
    await user.click(
      within(navigation).getByRole("link", { name: "Integrations" }),
    );
    expect(window.location.pathname).toBe("/access/integrations");
    expect(
      screen.getByRole("region", { name: "Integrations" }),
    ).toHaveTextContent("No integrations yet");
    const header = screen.getByRole("navigation", { name: "Primary" });
    expect(
      within(header).getByRole("link", { name: "Access" }),
    ).toHaveAttribute("aria-current", "page");

    await user.click(
      within(navigation).getByRole("link", { name: "Context sources" }),
    );
    expect(window.location.pathname).toBe("/access/context-sources");
    expect(
      screen.getByRole("region", { name: "Context sources" }),
    ).toHaveTextContent("No context sources yet");
  });
});

describe("Access content", () => {
  it("shows placeholders for empty collections and agent details", async () => {
    window.history.replaceState(null, "", "/access");
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("navigation", { name: "Primary" });
    const main = screen.getByRole("main", { name: "Access" });
    const agents = screen.getByRole("list", { name: "Agents" });
    expect(within(agents).queryAllByRole("listitem")).toHaveLength(0);
    await user.type(
      screen.getByRole("searchbox", { name: "Find agent" }),
      "Finance",
    );
    expect(screen.getByRole("searchbox", { name: "Find agent" })).toHaveValue(
      "Finance",
    );
    expect(within(agents).queryAllByRole("listitem")).toHaveLength(0);
    expect(
      screen.getByRole("region", { name: "Selected agent" }),
    ).toHaveTextContent("No agents available");
    expect(screen.getByText("No agents yet")).toBeVisible();
    expect(screen.getByLabelText("0 agents")).toBeVisible();
    expect(screen.getByRole("button", { name: "New agent" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Review changes" }),
    ).toBeEnabled();
    for (const removed of [
      "AGENT TYPES",
      "EVALUATION LAB",
      "Identity provider connected",
      "Capabilities",
    ]) {
      expect(main).not.toHaveTextContent(removed);
    }
    expect(
      within(main).queryByRole("link", { name: "People" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["/access", "Permissions"],
    ["/access/context-sources", "Context sources"],
    ["/access/integrations", "Integrations"],
  ])("supports direct entry at %s", async (path, label) => {
    window.history.replaceState(null, "", path);
    render(<App />);
    await screen.findByRole("navigation", { name: "Primary" });
    expect(screen.getByRole("region", { name: label })).toBeInTheDocument();
    const navigation = screen.getByRole("navigation", { name: "Access" });
    expect(
      within(navigation).getByRole("link", { name: label }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("preserves header selectors and profile while navigating Access pages", async () => {
    window.history.replaceState(null, "", "/access");
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("navigation", { name: "Primary" });
    await user.click(screen.getByLabelText("Select environment: Sandbox"));
    await user.click(screen.getByRole("button", { name: "Production" }));
    await user.click(screen.getByRole("link", { name: "Integrations" }));
    expect(
      screen.getByLabelText("Select environment: Production"),
    ).toBeInTheDocument();
    await user.click(screen.getByLabelText("Select workspace"));
    expect(screen.getByRole("button", { name: "Workspace" })).toBeVisible();
    await user.click(screen.getByLabelText("Open profile"));
    expect(screen.getByText("teste@chokpoint.dev")).toBeVisible();
  });

  it.each([
    ["/", "Overview"],
    ["/investigate", "Investigate"],
  ])("keeps %s empty", async (path, label) => {
    window.history.replaceState(null, "", path);
    render(<App />);
    await screen.findByRole("navigation", { name: "Primary" });
    expect(screen.getByRole("main", { name: label })).toBeEmptyDOMElement();
  });
});

it("opens creation and review from the empty application source", async () => {
  window.history.replaceState(null, "", "/access");
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole("navigation", { name: "Primary" });
  expect(screen.getByText("No agents yet")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "New agent" }));
  const dialog = screen.getByRole("dialog", { name: "New agent" });
  await user.type(
    within(dialog).getByRole("textbox", { name: "Agent name" }),
    "Test Draft",
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Create agent" }),
  );
  expect(screen.getByLabelText("1 agents")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Test Draft" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: /Review changes/ }));
  expect(
    screen.getByRole("dialog", { name: "Review changes" }),
  ).toHaveTextContent("New agent: Test Draft");
});
