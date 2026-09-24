import { env } from '@/config/env';

type HealthResponse = { status?: string; database?: string };
export type HealthResult = { reachable: boolean; healthy: boolean };

export async function checkBackendHealth(): Promise<HealthResult> {
  if (env.dataMode !== 'api') return { reachable: false, healthy: false };
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${env.apiBaseUrl.replace(/\/$/, '')}/health`, { signal: controller.signal, cache: 'no-store' });
    const body = await response.json() as HealthResponse;
    return { reachable: true, healthy: response.ok && body.status === 'ok' && body.database !== 'disconnected' };
  } catch { return { reachable: false, healthy: false }; }
  finally { window.clearTimeout(timeout); }
}
