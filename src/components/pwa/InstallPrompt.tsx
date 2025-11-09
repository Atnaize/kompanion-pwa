import { useState, useEffect } from 'react';
import { usePwaStore } from '@store/pwaStore';

export const InstallPrompt = () => {
  const { isInstallable, showInstallPrompt, isInstalled } = usePwaStore();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('install-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  if (!isInstallable || dismissed || isInstalled) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="rounded-2xl bg-white p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📱</div>
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-gray-800">Install Kompanion</h3>
            <p className="mb-3 text-sm text-gray-600">
              Add to home screen for quick access and offline support
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => void showInstallPrompt()}
                className="rounded-lg bg-[#FF4B00] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#E04400] active:scale-95"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
