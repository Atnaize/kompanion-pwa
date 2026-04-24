import { useTranslation } from 'react-i18next';
import { GlassCard } from '@components/ui';
import { ProfileMenu } from './ProfileMenu';

export const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 mb-6">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              <span className="relative inline-block">
                {t('header.title')}
                <span className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-transparent via-strava-orange to-transparent" />
              </span>
            </h1>
            <p className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
              {t('header.tagline')}
            </p>
          </div>
          <ProfileMenu />
        </div>
      </GlassCard>
    </header>
  );
};
