import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    if ('caches' in window) {
      caches.delete('catechism-app-cache-v1').catch(() => {});
    }
    if (import.meta.env.DEV) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((reg) => {
            if (reg.active?.scriptURL.endsWith('/sw.js')) {
              reg.unregister().catch(() => {});
            }
          });
        })
        .catch(() => {});
    }
    registerSW({
      immediate: true,
      onOfflineReady() {
        window.dispatchEvent(new CustomEvent('pwa-offline-ready'));
      },
      onRegisterError(error) {
        console.warn('PWA service worker registration error:', error);
      },
    });
  } catch (err) {
    console.warn('PWA service worker initialization failed:', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
