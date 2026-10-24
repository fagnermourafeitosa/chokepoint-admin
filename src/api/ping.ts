import { httpClient } from './http-client';

type PingResponse = { status: 'ok' };

export function pingBackend(signal?: AbortSignal): Promise<PingResponse> {
  return httpClient<PingResponse>('/v1/ping', { signal });
}
