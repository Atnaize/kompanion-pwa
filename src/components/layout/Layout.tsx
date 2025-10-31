import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useAuthStore } from '@store/authStore';
import { useTabBadges } from '@hooks/useTabBadges';
import { useSwipeNavigation } from '@hooks/useSwipeNavigation';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuthStore();
  const isFirstTimeUser = !user?.lastSyncedAt;
  const badges = useTabBadges();

  // Enable swipe navigation
  useSwipeNavigation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-lg px-4 py-6 pb-24">
        <Header />
        <main>{children}</main>
      </div>
      <BottomNav hideDataTabs={isFirstTimeUser} badges={badges} />
    </div>
  );
};
