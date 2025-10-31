import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@api/services';
import { Button, GlassCard } from '@components/ui';

const ERROR_MESSAGES: Record<string, string> = {
  no_code: 'No authorization code received. Please try again.',
  auth_failed: 'Authentication failed. Please try again.',
  access_denied: 'Access was denied. Please try again.',
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authUrl, setAuthUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const errorCode = searchParams.get('error');
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] || 'An error occurred' : null;

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-strava-orange-light to-strava-orange p-4">
      <GlassCard className="w-full max-w-md p-8 text-center">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Kompanion</h1>
          <p className="text-gray-600">Turn your workouts into epic quests</p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg bg-red-100 p-3 text-sm text-red-800">{errorMessage}</div>
        )}

        <div className="mb-8">
          <div className="mb-4 text-6xl">🏃‍♂️🎯🏆</div>
          <p className="text-sm text-gray-700">
            Connect with Strava to track your activities, unlock achievements, and complete weekly
            quests.
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleLogin}
          disabled={!authUrl || isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect with Strava'}
        </Button>

        <p className="mt-4 text-xs text-gray-600">
          By connecting, you agree to share your Strava activity data
        </p>
      </GlassCard>
    </div>
  );
};
