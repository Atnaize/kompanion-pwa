import { useState, useEffect } from 'react';
import { usePwaStore } from '@store/pwaStore';

export const InstallPrompt = () => {
  const { isInstallable, showInstallPrompt, isInstalled, isIos } = usePwaStore();
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
            {isIos ? (
              <>
                <p className="mb-3 text-sm text-gray-600">
                  Install this app on your iPhone: tap <span className="font-semibold">Share</span>{' '}
                  <svg className="inline h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V10c0-1.1.9-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .9 2 2z" />
                  </svg>{' '}
                  then <span className="font-semibold">&quot;Add to Home Screen&quot;</span>
                </p>
                <button
                  onClick={handleDismiss}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
                >
                  Got it
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
