import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { queryClient } from './lib/queryClient';
import './index.css';

// Register service worker
registerSW({
  onNeedRefresh() {
    // New content available
  },
  onOfflineReady() {
    // App ready to work offline
  },
  onRegistered() {
    // Service Worker registered
  },
  onRegisterError(error) {
    console.error('Service Worker registration failed:', error);
  },
});

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
