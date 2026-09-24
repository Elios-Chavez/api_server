export type ConnectivityState = 'online' | 'internet-degraded' | 'backend-offline' | 'offline';
export type ConnectivityContextValue = { state: ConnectivityState; backendReachable: boolean | null; refresh: () => Promise<void> };
