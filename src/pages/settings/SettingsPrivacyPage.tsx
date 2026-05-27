import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { BackButton } from '@components/ui';
import { PrivacyLists } from '@features/privacy';

export const SettingsPrivacyPage = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="space-y-6">
        <BackButton to="/settings" label={t('settings.title')} />

        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('settings.privacy.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('settings.privacy.description')}
          </p>
        </div>

        <PrivacyLists />
      </div>
    </Layout>
  );
};
