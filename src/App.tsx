import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { ToastContainer } from '@components/ui';
import { UpdateNotification } from '@components/pwa/UpdateNotification';
import { InstallPrompt } from '@components/pwa/InstallPrompt';
import { usePwa } from '@hooks/usePwa';
import { useServiceWorkerRegistration } from '@utils/registerServiceWorker';
import { useOnlineStatus } from '@hooks/useOnlineStatus';
import {
  LoginPage,
  DashboardPage,
  ActivitiesPage,
  ActivityDetailPage,
  PersonalRecordsPage,
  AchievementsPage,
  StatsPage,
  ChallengesPage,
  ChallengeDetailPage,
  CreateChallengePage,
  ComponentsPage,
  ProfilePage,
  SettingsPage,
  AboutPage,
  AdminPage,
  NotFoundPage,
} from '@pages/index';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-strava-orange/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-indigo-400/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:22px_22px]"
        />

        <div
          role="status"
          aria-live="polite"
          className="relative flex overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md"
        >
          <div className="w-1 bg-gradient-to-b from-strava-orange to-strava-orange-dark" />
          <div className="flex items-center gap-5 px-8 py-6">
            <Loader2 size={28} strokeWidth={1.75} className="animate-spin text-gray-800" />
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                {t('common.authenticating')}
              </span>
              <span className="text-sm font-medium text-gray-900">{t('common.loading')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App = () => {
  const { t } = useTranslation();
  const { fetchUser } = useAuthStore();
  const isOnline = useOnlineStatus();

  // Initialize PWA features
  usePwa();
  useServiceWorkerRegistration();

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  return (
    <ErrorBoundary>
      <ToastContainer />
      <UpdateNotification />
      <InstallPrompt />

      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed left-0 right-0 top-0 z-50 bg-yellow-500 px-4 py-2 text-center text-sm font-semibold text-white">
          📡 {t('common.offline')}
        </div>
      )}

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute>
                <ActivitiesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities/:id"
            element={
              <ProtectedRoute>
                <ActivityDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/personal-records"
            element={
              <ProtectedRoute>
                <PersonalRecordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedRoute>
                <AchievementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <ProtectedRoute>
                <StatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges"
            element={
              <ProtectedRoute>
                <ChallengesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges/create"
            element={
              <ProtectedRoute>
                <CreateChallengePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges/:id"
            element={
              <ProtectedRoute>
                <ChallengeDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <AboutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/components"
            element={
              <ProtectedRoute>
                <ComponentsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};
