import { env } from '@/config/env';
import { useConnectivity } from '@/features/connectivity/ConnectivityProvider';

export function AdminHeader() {
  const { state, backendReachable } = useConnectivity();
  const label = state === 'online' ? 'Conectado' : state === 'internet-degraded' ? 'Operación local' : state === 'backend-offline' ? 'Backend no disponible' : 'Sin conexión';
  const tone = state === 'online' ? 'text-stable' : state === 'backend-offline' || state === 'offline' ? 'text-priority' : 'text-attention';
  return <header className="admin-header"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary">Centro de control</p><p className="text-muted">Área administrativa · {env.dataMode === 'api' ? label : 'Modo local'}</p></div><div className="admin-health"><span className={tone}>Sistema: {env.dataMode === 'api' ? (backendReachable ? 'Disponible' : 'No verificado') : 'Modo local'}</span><span className={tone}>Red: {state === 'offline' ? 'Sin conexión' : state === 'internet-degraded' ? 'Limitada' : 'Disponible'}</span><span className="rounded-full bg-stable/10 px-4 py-2 text-sm font-bold text-stable">Sesión activa</span></div></header>;
}
