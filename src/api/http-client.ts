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
  constructor(readonly status: number, readonly code?: string) {
    super(`Backend request failed (${status})`);
    this.name = "HttpError";
  }
}

// errorCode reads the backend error code, when the error body has one.
async function errorCode(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    return typeof body === "object" && body !== null && "code" in body && typeof body.code === "string" ? body.code : undefined;
  } catch {
    return undefined;
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
  if (!response.ok) throw new HttpError(response.status, await errorCode(response));
  if (response.status === 204) return undefined as T;
  return (responseType === "blob" ? response.blob() : response.json()) as Promise<T>;
}
