import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConnectivityBanner } from '@/components/common/ConnectivityBanner';
import { PwaUpdateNotice } from '@/components/common/PwaUpdateNotice';
import { ConnectivityProvider } from '@/features/connectivity/ConnectivityProvider';
import { router } from './router';

export function App() {
  useEffect(() => {
    let wakeLock: { release: () => Promise<void> } | undefined;
    const requestWakeLock = async () => {
      const api = (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock;
      if (!api) return;
      try { wakeLock = await api.request('screen'); } catch { wakeLock = undefined; }
    };
    void requestWakeLock();
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') void requestWakeLock(); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => { document.removeEventListener('visibilitychange', onVisibilityChange); if (wakeLock) void wakeLock.release(); };
  }, []);
  return <ConnectivityProvider><ConnectivityBanner /><PwaUpdateNotice /><RouterProvider router={router} /></ConnectivityProvider>;
}
