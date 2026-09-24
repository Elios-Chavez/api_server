import { CircleAlert, Wifi, WifiOff } from 'lucide-react';
import { useConnectivity } from '@/features/connectivity/ConnectivityProvider';

export function ConnectivityBanner() {
  const { state } = useConnectivity();
  if (state === 'online') return null;
  const content = state === 'internet-degraded' ? ['Conexión a Internet limitada.', 'El sistema local sigue disponible.'] : state === 'backend-offline' ? ['Servicio temporalmente no disponible.', 'No se confirmarán operaciones hasta recuperar el backend.'] : ['Sin conexión.', 'Las consultas y operaciones no se enviarán.'];
  const Icon = state === 'internet-degraded' ? Wifi : state === 'backend-offline' ? CircleAlert : WifiOff;
  return <div className={`connectivity-banner connectivity-${state}`} role="status"><Icon aria-hidden="true" size={18} /><span><strong>{content[0]}</strong> {content[1]}</span></div>;
}
