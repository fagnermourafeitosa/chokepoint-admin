let csrfToken: string | undefined;
export function setCSRFToken(value: string | undefined) {
  csrfToken = value;
}
const requestTimeout = 10_000;

type RequestOptions = Omit<RequestInit, "body" | "redirect"> & {
  json?: unknown;
  form?: FormData;
  responseType?: "json" | "blob";
};

export class HttpError extends Error {
  // field: the refused field, when the error body names one (Backend 101).
  constructor(readonly status: number, readonly code?: string, readonly field?: string) {
    super(`Backend request failed (${status})`);
    this.name = "HttpError";
  }
}

// errorBody reads the backend error code and refused field, when the error body has them.
async function errorBody(response: Response): Promise<{ code?: string; field?: string }> {
  try {
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) return {};
    const text = (key: string) => (key in body && typeof (body as Record<string, unknown>)[key] === "string" ? (body as Record<string, string>)[key] : undefined);
    return { code: text("code"), field: text("field") };
  } catch {
    return {};
  }
}

export async function httpClient<T>(
  path: `/${string}`,
  options: RequestOptions = {},
): Promise<T> {
  if (path.startsWith("//")) {
    throw new TypeError("API paths must be relative to /api");
  }

  const { json, form, responseType = "json", signal, ...init } = options;
  if (json !== undefined && form) throw new TypeError("Choose JSON or multipart");
  const headers = new Headers(init.headers);
  headers.set("Accept", responseType === "blob" ? "image/png" : "application/json");
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
    body: form ?? (json === undefined ? undefined : JSON.stringify(json)),
    redirect: "error",
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(requestTimeout)])
      : AbortSignal.timeout(requestTimeout),
  });

  if (response.status === 401 && path !== "/v1/auth/session")
    window.dispatchEvent(new Event("auth-expired"));
  if (!response.ok) {
    const { code, field } = await errorBody(response);
    throw new HttpError(response.status, code, field);
  }
  if (response.status === 204) return undefined as T;
  return (responseType === "blob" ? response.blob() : response.json()) as Promise<T>;
}
