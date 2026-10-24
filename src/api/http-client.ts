// Development-only credential shared with the local backend. Not a production secret.
const developmentToken = 'chokepoint-local-development-token';
const requestTimeout = 10_000;

type RequestOptions = Omit<RequestInit, 'body' | 'redirect'> & { json?: unknown };

export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`Backend request failed (${status})`);
    this.name = 'HttpError';
  }
}

export async function httpClient<T>(path: `/${string}`, options: RequestOptions = {}): Promise<T> {
  if (path.startsWith('//')) {
    throw new TypeError('API paths must be relative to /api');
  }

  const { json, signal, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${developmentToken}`);
  if (json !== undefined) headers.set('Content-Type', 'application/json');

  const response = await fetch(`/api${path}`, {
    ...init,
    headers,
    body: json === undefined ? undefined : JSON.stringify(json),
    redirect: 'error',
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(requestTimeout)])
      : AbortSignal.timeout(requestTimeout),
  });

  if (!response.ok) throw new HttpError(response.status);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
