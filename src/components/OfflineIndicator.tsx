import React, { useEffect, useState } from 'react';
import { WifiOff, CheckCircle2, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showOfflineReady, setShowOfflineReady] = useState(false);

  useEffect(() => {
    const handleOfflineReady = () => {
      setShowOfflineReady(true);
    };

    window.addEventListener('pwa-offline-ready', handleOfflineReady);
    return () => {
      window.removeEventListener('pwa-offline-ready', handleOfflineReady);
    };
  }, []);

  useEffect(() => {
    if (!showOfflineReady) return;
    const timer = setTimeout(() => {
      setShowOfflineReady(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showOfflineReady]);

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-20 left-4 lg:bottom-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-500/20"
      >
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span>Chế độ ngoại tuyến — Đang dùng dữ liệu đã lưu trên thiết bị</span>
      </div>
    );
  }

  if (showOfflineReady) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-20 left-4 lg:bottom-4 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-lg"
      >
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        <span>Ứng dụng đã sẵn sàng học ngoại tuyến (không cần mạng).</span>
        <button
          onClick={() => setShowOfflineReady(false)}
          aria-label="Đóng thông báo"
          className="ml-1 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return null;
};
