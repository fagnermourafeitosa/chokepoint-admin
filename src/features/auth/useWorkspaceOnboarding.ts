import { preparingDelay } from "../onboarding/PreparingSteps";
import { useRef, useState, type FormEvent } from "react";
import { httpClient, HttpError } from "../../api/http-client";
import { useAuth } from "./AuthContext";
export function useWorkspaceOnboarding() {
  const auth = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const attempt = useRef({ name: "", key: crypto.randomUUID() });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const normalized = name.trim();
    if (attempt.current.name !== normalized)
      attempt.current = { name: normalized, key: crypto.randomUUID() };
    // Admin 052: the loading screen shows its steps for at least this long, also when the creation is faster.
    const shown = preparingDelay();
    try {
      await httpClient("/v1/workspaces", {
        method: "POST",
        json: { name: normalized },
        headers: { "Idempotency-Key": attempt.current.key },
      });
      await shown;
      await auth.refreshWorkspaces();
    } catch (error) {
      if (error instanceof HttpError && error.status === 409)
        await auth.refreshWorkspaces();
      setError(
        "The workspace could not be created. Check your access and try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return { name, setName, error, pending, submit };
}
