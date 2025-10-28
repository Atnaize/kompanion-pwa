import { GlassCard } from '@components/ui';
import { ProfileMenu } from './ProfileMenu';

export const Header = () => {
  return (
    <header className="sticky top-0 z-30 mb-6">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kompanion</h1>
            <p className="text-sm text-gray-600">Run the fun way</p>
          </div>
          <ProfileMenu />
        </div>
      </GlassCard>
    </header>
  );
};
