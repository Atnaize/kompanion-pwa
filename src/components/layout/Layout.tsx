import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Background } from './Background';
import { useAuthStore } from '@store/authStore';
import { useTabBadges } from '@hooks/useTabBadges';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user } = useAuthStore();
  const isFirstTimeUser = !user?.lastSyncedAt;
  const badges = useTabBadges();

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-950">
      <Background />

      <div className="relative z-10 mx-auto max-w-lg px-4 py-6 pb-24">
        <Header />
        <main>{children}</main>
      </div>
      <BottomNav hideDataTabs={isFirstTimeUser} badges={badges} />
    </div>
  );
};
