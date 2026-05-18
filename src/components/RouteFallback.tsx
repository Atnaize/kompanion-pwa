import { Loader2 } from 'lucide-react';
import { Layout } from '@components/layout';

// Minimal Suspense fallback that lives inside Layout, so users see the
// global chrome (header + bottom nav) immediately while the lazy chunk
// downloads. Matches the spinner style used by ProtectedRoute's auth
// gate, but lighter — auth is a one-time blocker, route chunks load fast.
export const RouteFallback = () => (
  <Layout>
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2
        size={32}
        strokeWidth={1.75}
        className="animate-spin text-gray-500 dark:text-gray-400"
        aria-label="Loading"
      />
    </div>
  </Layout>
);
