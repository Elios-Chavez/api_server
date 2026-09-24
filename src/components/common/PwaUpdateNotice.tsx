import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export function PwaUpdateNotice() {
  const [available, setAvailable] = useState(false);
  const update = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);
  useEffect(() => { if (!import.meta.env.PROD) return; update.current = registerSW({ onNeedRefresh: () => setAvailable(true) }); }, []);
  if (!available) return null;
  return <div className="pwa-update" role="status"><span>Nueva versión disponible</span><button type="button" onClick={() => void update.current?.(true)}><RefreshCw aria-hidden="true" size={16}/>Actualizar</button></div>;
}
