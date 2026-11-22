import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, AlertCircle, CheckCircle, Send, ShieldAlert } from 'lucide-react';

interface ReminderConfig {
  enabled: boolean;
  time: string; // "HH:MM"
}

interface ReminderCardProps {
  config: ReminderConfig;
  onChangeConfig: (newConfig: ReminderConfig) => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({ config, onChangeConfig }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notificationSupport, setNotificationSupport] = useState<boolean>(true);
  const [showToast, setShowToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!('Notification' in window)) {
        setNotificationSupport(false);
      } else {
        setPermission(Notification.permission);
      }
    }
  }, []);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info') => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!notificationSupport) {
      triggerToast('Trình duyệt không hỗ trợ thông báo!', 'error');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        triggerToast('Đã cấp quyền thông báo thành công! 🎉', 'success');
        return true;
      } else if (result === 'denied') {
        triggerToast('Quyền thông báo bị từ chối. Vui lòng bật lại trong cài đặt trình duyệt.', 'error');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Lỗi khi yêu cầu quyền thông báo:', error);
      triggerToast('Có lỗi xảy ra khi yêu cầu quyền thông báo.', 'error');
      return false;
    }
  };

  const handleToggleEnabled = async () => {
    if (!config.enabled) {
      // If turning on, we must ensure we have permission
      if (permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) return;
      }
      onChangeConfig({ ...config, enabled: true });
      triggerToast('Đã bật lịch nhắc nhở học Giáo Lý lúc 08:00 hàng ngày! ✨', 'success');
    } else {
      onChangeConfig({ ...config, enabled: false });
      triggerToast('Đã tắt lịch nhắc nhở.', 'info');
    }
  };

  const testNotification = () => {
    if (permission !== 'granted') {
      triggerToast('Vui lòng cấp quyền thông báo trước khi gửi thử!', 'error');
      return;
    }

    const title = 'Học Giáo Lý Công Giáo 📖';
    const options = {
      body: 'Đây là thông báo dùng thử! Lịch nhắc nhở lúc 08:00 hàng ngày của bạn đã được cấu hình thành công. ✨',
      icon: '/icon-192.png',
      badge: '/icon-192-maskable.png',
      tag: 'test-reminder',
      vibrate: [100, 50, 100],
    };

    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, options);
        }).catch(() => {
          new Notification(title, options);
        });
      } else {
        new Notification(title, options);
      }
      triggerToast('Đã gửi thông báo dùng thử thành công!', 'success');
    } catch (err) {
      console.error('Không thể hiển thị thông báo:', err);
      new Notification(title, options);
    }
  };

  return (
    <div className="relative rounded-3xl border border-gray-150 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md dark:shadow-none transition-all flex flex-col justify-between">
      {/* Dynamic Toast inside Card to avoid window.alert */}
      {showToast.show && (
        <div className={`absolute top-4 left-4 right-4 z-10 px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
          showToast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
            : showToast.type === 'error'
            ? 'bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30'
            : 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border border-blue-105 dark:border-blue-900/30'
        }`}>
          {showToast.type === 'success' && <CheckCircle size={14} className="shrink-0" />}
          {showToast.type === 'error' && <ShieldAlert size={14} className="shrink-0" />}
          {showToast.type === 'info' && <AlertCircle size={14} className="shrink-0" />}
          <span className="flex-1">{showToast.message}</span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider font-mono">Nhắc Nhở Học Tập</span>
          <button
            onClick={handleToggleEnabled}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors cursor-pointer ${
              config.enabled 
                ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/10' 
                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-350'
            }`}
            title={config.enabled ? 'Tắt nhắc nhở' : 'Bật nhắc nhở'}
          >
            {config.enabled ? <Bell className="h-5 w-5 animate-bounce" /> : <BellOff className="h-5 w-5" />}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                Khung Giờ Cố Định
              </span>
              <div className="relative flex items-center justify-between rounded-2xl border border-gray-150 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/30 py-2.5 px-4 text-sm font-semibold text-gray-800 dark:text-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                  <span className="font-mono font-bold text-base tracking-wider">08:00</span>
                </div>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-bold">Hằng ngày</span>
              </div>
            </div>
          </div>

          <div className="text-xs space-y-1.5 py-0.5">
            {/* Permission status help */}
            {!notificationSupport ? (
              <p className="text-red-500 dark:text-red-400 font-medium flex items-center gap-1.5 leading-snug">
                <AlertCircle size={13} className="shrink-0" />
                Trình duyệt này không hỗ trợ Thông báo hệ thống.
              </p>
            ) : permission === 'denied' ? (
              <p className="text-amber-600 dark:text-amber-400 font-semibold flex items-start gap-1.5 leading-snug">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>Quyền thông báo bị chặn. Vui lòng mở lại cài đặt trang web để nhận nhắc nhở.</span>
              </p>
            ) : permission === 'default' ? (
              <p className="text-blue-600 dark:text-blue-400 font-semibold flex items-start gap-1.5 leading-snug animate-pulse">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>Hãy cấp quyền thông báo hệ thống để kích hoạt chuông báo học đúng giờ!</span>
              </p>
            ) : (
              <p className="text-gray-500 dark:text-slate-400 font-medium leading-snug">
                {config.enabled ? (
                  <span>
                    Chuông báo sẽ gửi nhắc nhở học vào đúng lúc <strong className="text-blue-600 dark:text-amber-400 font-mono font-bold">08:00</strong> sáng hằng ngày giúp bạn thăng tiến Đức Tin.
                  </span>
                ) : (
                  <span>Lịch nhắc nhở đang tắt. Hãy bật chuông để nhận thông báo hằng ngày.</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-1 flex flex-col gap-2">
        {permission !== 'granted' && permission !== 'denied' && notificationSupport && (
          <button
            onClick={requestNotificationPermission}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-blue-500 text-white shadow-sm shadow-blue-500/10 hover:bg-blue-600 transition-all cursor-pointer active:scale-97 animate-bounce"
          >
            <Bell className="h-4 w-4 shrink-0" />
            Cấp quyền thông báo ngay
          </button>
        )}
        
        {permission === 'granted' && (
          <button
            onClick={testNotification}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-350 border border-gray-150 dark:border-slate-750 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer active:scale-97"
            title="Kiểm tra thông báo hoạt động trên thiết bị"
          >
            <Send size={12} />
            Gửi thử thông báo
          </button>
        )}
      </div>
    </div>
  );
};
