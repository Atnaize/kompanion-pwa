import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { GlassCard } from '@components/ui';

export const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
          {t('about.title')}{' '}
          <span className="relative inline-block">
            Kompanion
            <span className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-transparent via-strava-orange to-transparent"></span>
          </span>
        </h2>

        <section>
          <GlassCard className="p-8 text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p className="mb-2 font-medium">{t('about.version', { version: '0.1.0' })}</p>
              <p>
                {t('about.dataProvider')}{' '}
                <a
                  href="https://www.strava.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-strava-orange hover:underline"
                >
                  Strava
                </a>
              </p>

              <div className="mt-6 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400"></div>

              <p className="mt-4 text-sm">{t('about.footer')}</p>
            </div>
          </GlassCard>
        </section>
      </div>
    </Layout>
  );
};
