let csrfToken: string | undefined;
export function setCSRFToken(value: string | undefined) {
  csrfToken = value;
}
const requestTimeout = 10_000;

type RequestOptions = Omit<RequestInit, "body" | "redirect"> & {
  json?: unknown;
};

export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`Backend request failed (${status})`);
    this.name = "HttpError";
  }
}

export async function httpClient<T>(
  path: `/${string}`,
  options: RequestOptions = {},
): Promise<T> {
  if (path.startsWith("//")) {
    throw new TypeError("API paths must be relative to /api");
  }

  const { json, signal, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (
    !["GET", "HEAD", "OPTIONS"].includes(
      (init.method ?? "GET").toUpperCase(),
    ) &&
    csrfToken
  )
    headers.set("X-CSRF-Token", csrfToken);
  if (json !== undefined) headers.set("Content-Type", "application/json");

  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers,
    body: json === undefined ? undefined : JSON.stringify(json),
    redirect: "error",
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(requestTimeout)])
      : AbortSignal.timeout(requestTimeout),
  });

  if (response.status === 401 && path !== "/v1/auth/session")
    window.dispatchEvent(new Event("auth-expired"));
  if (!response.ok) throw new HttpError(response.status);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
