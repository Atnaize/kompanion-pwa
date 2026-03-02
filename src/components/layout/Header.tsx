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
            <h1 className="text-2xl font-bold text-gray-900">{t('header.title')}</h1>
            <p className="text-sm text-gray-600">{t('header.tagline')}</p>
          </div>
          <ProfileMenu />
        </div>
      </GlassCard>
    </header>
  );
};
