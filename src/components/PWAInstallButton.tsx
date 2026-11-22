import React, { useState } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="Cài đặt ứng dụng để học ngoại tuyến nhanh chóng"
        id="pwa-install-btn"
        className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-2.5 sm:px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all focus:outline-none"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span className="hidden md:inline">Cài ứng dụng</span>
        <span className="inline md:hidden">Cài app</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Cài đặt lên màn hình chính iPhone / iPad để dùng ngoại tuyến"
          id="pwa-ios-install-btn"
          className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-950/30 px-2.5 sm:px-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-950/50 transition-all focus:outline-none"
        >
          <Smartphone className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Cài iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl border border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Cài đặt trên iPhone / iPad
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                    Sử dụng trọn vẹn 650 câu Giáo Lý ngay cả khi không có mạng.
                  </p>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Đóng hướng dẫn"
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-slate-300">
                <div className="flex items-start gap-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-xs font-bold text-blue-600 dark:text-blue-400">
                    1
                  </span>
                  <p className="leading-relaxed">
                    Nhấn nút <strong className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400"><Share className="h-3.5 w-3.5" /> Chia sẻ</strong> trên thanh công cụ Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-xs font-bold text-blue-600 dark:text-blue-400">
                    2
                  </span>
                  <p className="leading-relaxed">
                    Cuộn xuống và chọn <strong className="inline-flex items-center gap-1 text-gray-900 dark:text-white"><PlusSquare className="h-3.5 w-3.5" /> Thêm vào MH chính</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
