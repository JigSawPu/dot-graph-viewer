import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaStatus() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker
  } = useRegisterSW();

  if (!needRefresh && !offlineReady) return null;
  return (
    <div className="pwa-status" role="status">
      <span>{needRefresh ? 'A new version is ready.' : 'DotCanvas is ready offline.'}</span>
      {needRefresh && <button type="button" onClick={() => void updateServiceWorker(true)}>Update</button>}
      <button type="button" aria-label="Dismiss" onClick={() => { setNeedRefresh(false); setOfflineReady(false); }}>×</button>
    </div>
  );
}
