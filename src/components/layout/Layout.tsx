import { ReactNode, useState } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Background } from './Background';
import { MoreSheet } from './MoreSheet';
import { useAuthStore } from '@store/authStore';
import { useTabBadges } from '@hooks/useTabBadges';
import { useRealtimeUser } from '@hooks/useRealtimeUser';

interface LayoutProps {
  children: ReactNode;
  /**
   * Full-screen mode: hide the global Header + BottomNav. The page is
   * responsible for its own chrome (sticky header, composer, etc). Used by
   * surfaces that need every available pixel — chat is the first one.
   * Container padding also drops so children can paint edge-to-edge.
   */
  fullScreen?: boolean;
  /**
   * Hide only the global Header (keep the BottomNav). For browsing surfaces
   * that supply their own top chrome — e.g. the club detail page's immersive
   * gradient hero, which would otherwise sit awkwardly below the app header.
   * Pages using this typically pull their first element up with `-mt-6` to sit
   * flush against the top.
   */
  hideHeader?: boolean;
}

export const Layout = ({ children, fullScreen = false, hideHeader = false }: LayoutProps) => {
  const { user } = useAuthStore();
  const isFirstTimeUser = !user?.lastSyncedAt;
  const badges = useTabBadges();
  // Keep the nav badges (and inbox/conversations behind them) live on every page.
  useRealtimeUser(user?.userId);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  if (fullScreen) {
    // `h-dvh` (not `min-h-screen`) gives a definite viewport height that
    // collapses with mobile chrome / keyboard. `overflow-hidden` keeps the
    // page itself non-scrollable so a child surface (e.g. a chat list) can
    // own scroll. `min-h-0` on main lets its flex-1 child shrink below its
    // intrinsic content size so inner overflow-y-auto actually engages.
    return (
      <div className="relative flex h-dvh flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
        <Background />
        <main className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      <Background />

      <div className="relative z-10 mx-auto max-w-lg px-4 py-6 pb-24">
        {!hideHeader && <Header />}
        <main>{children}</main>
      </div>
      <BottomNav
        hideDataTabs={isFirstTimeUser}
        badges={badges}
        onOpenMore={() => setIsMoreOpen(true)}
      />
      <MoreSheet open={isMoreOpen} onClose={() => setIsMoreOpen(false)} badges={badges} />
    </div>
  );
};
