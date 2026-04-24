import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,_#fff3e6_0%,_#fafafa_55%,_#f3f4f6_100%)]">
      <div className="mx-auto max-w-lg px-4 py-6 pb-24">
        <Header />
        <main>{children}</main>
      </div>
      <BottomNav hideDataTabs={isFirstTimeUser} badges={badges} />
    </div>
  );
};
