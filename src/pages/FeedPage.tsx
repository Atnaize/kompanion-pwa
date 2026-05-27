import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { FeedList } from '@features/feed';

export const FeedPage = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('feed.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('feed.subtitle')}</p>
        </div>

        <FeedList />
      </div>
    </Layout>
  );
};
