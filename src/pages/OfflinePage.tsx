export const OfflinePage = () => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/80 p-8 text-center shadow-xl backdrop-blur-sm">
        <div className="mb-6 text-6xl">📡</div>
        <h1 className="mb-4 text-2xl font-bold text-gray-800">You&apos;re Offline</h1>
        <p className="mb-6 text-gray-600">
          No internet connection detected. Some features may be limited.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleReload}
            className="w-full rounded-xl bg-[#FF4B00] px-6 py-3 font-semibold text-white transition-all hover:bg-[#E04400] active:scale-95"
          >
            Try Again
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
          >
            Go Back
          </button>
        </div>
        <div className="mt-6 text-sm text-gray-500">
          You can still view cached activities and challenges
        </div>
      </div>
    </div>
  );
};
