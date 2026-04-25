import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '@api/services';

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authUrl, setAuthUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const errorCode = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    no_code: t('login.errors.noCode'),
    auth_failed: t('login.errors.authFailed'),
    access_denied: t('login.errors.accessDenied'),
  };

  const errorMessage = errorCode ? errorMessages[errorCode] || t('login.errors.generic') : null;

  const features = [
    {
      icon: '🏆',
      title: t('login.featureAchievements'),
      description: t('login.featureAchievementsDesc'),
    },
    {
      icon: '📊',
      title: t('login.featureProgress'),
      description: t('login.featureProgressDesc'),
    },
    {
      icon: '🎯',
      title: t('login.featureChallenges'),
      description: t('login.featureChallengesDesc'),
    },
  ];

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const errorParam = searchParams.get('error');

    // If we have tokens from OAuth callback, store them and redirect to dashboard
    if (accessToken && refreshToken) {
      setIsLoading(true);
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      navigate('/dashboard', { replace: true });
      return;
    }

    // If there's an error param, just show the error (already handled by errorMessage)
    if (errorParam) {
      return;
    }

    // Otherwise, fetch the Strava auth URL
    const fetchAuthUrl = async () => {
      const response = await authService.login(window.location.origin);

      if (response.success && response.data) {
        setAuthUrl(response.data.authUrl);
      }
    };

    void fetchAuthUrl();
  }, [searchParams, navigate]);

  const handleLogin = () => {
    if (authUrl) {
      setIsLoading(true);
      window.location.href = authUrl;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Hero */}
      <div className="hidden w-1/2 bg-gradient-to-br from-strava-orange via-strava-orange-light to-orange-400 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="max-w-xl">
          <h1 className="mb-6 text-6xl font-bold text-white">{t('login.title')}</h1>
          <p className="mb-12 text-2xl text-white/90">{t('login.tagline')}</p>

          <div className="space-y-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="mb-1 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="text-white/80">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="flex w-full flex-col bg-gray-50 lg:w-1/2 lg:flex-row lg:items-center lg:justify-center lg:px-4 lg:py-12 dark:bg-gray-950">
        {/* Mobile header with gradient */}
        <div className="bg-gradient-to-br from-strava-orange via-strava-orange-light to-orange-400 px-6 pb-16 pt-12 lg:hidden">
          <div className="text-center">
            <h1 className="mb-3 text-5xl font-bold text-white drop-shadow-lg">
              {t('login.title')}
            </h1>
            <p className="text-xl text-white/95 drop-shadow">{t('login.tagline')}</p>
          </div>
        </div>

        {/* Content wrapper */}
        <div className="-mt-8 w-full px-4 pb-12 lg:mt-0 lg:max-w-md lg:px-0">
          {/* Main card */}
          <div className="rounded-2xl bg-white p-8 shadow-2xl lg:p-10 dark:bg-gray-900">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-50">{t('login.getStarted')}</h2>
              <p className="text-gray-600 dark:text-gray-400">{t('login.connectDescription')}</p>
            </div>

            {errorMessage && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Features on mobile */}
            <div className="mb-8 space-y-3 lg:hidden">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-950"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-strava-orange to-orange-400 text-xl text-white shadow-md">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">{feature.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Strava Connect Button */}
            <button
              onClick={handleLogin}
              disabled={!authUrl || isLoading}
              className="group relative w-full overflow-hidden rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              <img
                src="/strava/btn_strava_connect_with_orange.svg"
                alt="Connect with Strava"
                className="h-12 w-full object-contain"
                srcSet="/strava/btn_strava_connect_with_orange.svg 1x, /strava/btn_strava_connect_with_orange_x2.svg 2x"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-strava-orange border-t-transparent" />
                </div>
              )}
            </button>

            <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">{t('login.disclaimer')}</p>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">{t('login.footer')}</p>
        </div>
      </div>
    </div>
  );
};
