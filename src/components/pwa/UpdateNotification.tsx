import { usePwaStore } from '@store/pwaStore';

export const UpdateNotification = () => {
  const { needsRefresh, updateServiceWorker } = usePwaStore();

  if (!needsRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="rounded-2xl bg-gradient-to-r from-[#FF4B00] to-[#FF6B00] p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🚀</div>
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-white">Update Available</h3>
            <p className="mb-3 text-sm text-white/90">
              A new version of Kompanion is ready. Update now for the latest features!
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => void updateServiceWorker()}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#FF4B00] transition-all hover:bg-gray-100 active:scale-95"
              >
                Update Now
              </button>
              <button
                onClick={() => usePwaStore.setState({ needsRefresh: false })}
                className="rounded-lg border-2 border-white/30 bg-transparent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-95"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
