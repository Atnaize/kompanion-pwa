import { useTranslation } from 'react-i18next';
import { BackButton } from '@components/ui';

export const TermsPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <BackButton to="/about" label={t('legal.back')} />
        </div>

        <article className="space-y-6 rounded-2xl bg-white/80 p-8 shadow-sm backdrop-blur dark:bg-gray-900/80">
          <header>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {t('legal.terms.title')}
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('legal.lastUpdated', { date: '2026-05-21' })}
            </p>
          </header>

          <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('legal.terms.acceptance.title')}
            </h2>
            <p>{t('legal.terms.acceptance.body')}</p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('legal.terms.useOfService.title')}
            </h2>
            <p>{t('legal.terms.useOfService.body')}</p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('legal.terms.stravaTerms.title')}
            </h2>
            <p>{t('legal.terms.stravaTerms.body')}</p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('legal.terms.disclaimer.title')}
            </h2>
            <p>{t('legal.terms.disclaimer.body')}</p>
          </section>

          <section className="space-y-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {t('legal.terms.termination.title')}
            </h2>
            <p>{t('legal.terms.termination.body')}</p>
          </section>
        </article>
      </div>
    </div>
  );
};
