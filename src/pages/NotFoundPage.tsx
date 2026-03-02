import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/authStore';

export const NotFoundPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleGoHome = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 text-8xl font-bold text-gray-300">404</div>

        <div className="mb-8 rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 text-6xl">🗺️</div>

          <h1 className="mb-4 text-2xl font-bold text-gray-900">{t('notFound.title')}</h1>

          <p className="mb-6 text-gray-600">
            {t('notFound.description')}
          </p>

          <button
            onClick={handleGoHome}
            className="w-full rounded-lg bg-strava-orange py-3 font-semibold text-white transition-colors hover:bg-strava-orange-dark"
          >
            {isAuthenticated ? t('notFound.backToDashboard') : t('notFound.backToLogin')}
          </button>
        </div>

        <p className="text-sm text-gray-500">{t('notFound.help')}</p>
      </div>
    </div>
  );
};
