import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { env } from '@/config/env';
import { queryClient } from '@/app/queryClient';
import { checkBackendHealth } from './health';
import type { ConnectivityContextValue, ConnectivityState } from './types';

const ConnectivityContext = createContext<ConnectivityContextValue | null>(null);
const browserOnline = () => typeof navigator === 'undefined' || navigator.onLine;

function stateFor(result: { reachable: boolean; healthy: boolean }, online: boolean): ConnectivityState {
  if (result.healthy) return online ? 'online' : 'internet-degraded';
  if (!online) return 'offline';
  return result.reachable ? 'backend-offline' : 'backend-offline';
}

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConnectivityState>(() => browserOnline() ? 'online' : 'offline');
  const [backendReachable, setBackendReachable] = useState<boolean | null>(env.dataMode === 'api' ? null : false);
  const refresh = useCallback(async () => { if (env.dataMode !== 'api') { setState(browserOnline() ? 'online' : 'offline'); return; } const result = await checkBackendHealth(); setBackendReachable((previous) => { if (result.healthy && previous === false) void queryClient.invalidateQueries(); return result.reachable; }); setState(stateFor(result, browserOnline())); }, []);
  useEffect(() => { const onOnline = () => { void refresh(); }; const onOffline = () => { setState('offline'); void refresh(); }; window.addEventListener('online', onOnline); window.addEventListener('offline', onOffline); void refresh(); const interval = window.setInterval(() => { void refresh(); }, 30000); return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); window.clearInterval(interval); }; }, [refresh]);
  const value = useMemo(() => ({ state, backendReachable, refresh }), [backendReachable, refresh, state]);
  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity() { const context = useContext(ConnectivityContext); if (!context) throw new Error('useConnectivity debe usarse dentro de ConnectivityProvider.'); return context; }
