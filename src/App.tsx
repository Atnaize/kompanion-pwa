import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { ErrorBoundary } from '@components/ErrorBoundary';
import { RouteErrorBoundary } from '@components/RouteErrorBoundary';
import { RouteFallback } from '@components/RouteFallback';
import { ToastContainer } from '@components/ui';
import { UpdateNotification } from '@components/pwa/UpdateNotification';
import { InstallPrompt } from '@components/pwa/InstallPrompt';
import { usePwa } from '@hooks/usePwa';
import { useServiceWorkerRegistration } from '@utils/registerServiceWorker';
import { useOnlineStatus } from '@hooks/useOnlineStatus';
import { useTheme } from '@hooks/useTheme';
// Eager pages — first paint after auth (or before it). Lazy-loading these
// would just introduce a loading flash on the landing experience.
import { LoginPage, DashboardPage, NotFoundPage } from '@pages/index';

// Heavy or rarely-visited pages get split off. Each `lazy(...)` becomes its
// own Vite chunk and is fetched on first navigation. We rely on the named
// exports throughout the rest of the app, so wrap them into a default here
// rather than touching every page file.
const ActivitiesPage = lazy(() =>
  import('@pages/ActivitiesPage').then((m) => ({ default: m.ActivitiesPage }))
);
const ActivityDetailPage = lazy(() =>
  import('@pages/ActivityDetailPage').then((m) => ({ default: m.ActivityDetailPage }))
);
const PersonalRecordsPage = lazy(() =>
  import('@pages/PersonalRecordsPage').then((m) => ({ default: m.PersonalRecordsPage }))
);
const AchievementsPage = lazy(() =>
  import('@pages/AchievementsPage').then((m) => ({ default: m.AchievementsPage }))
);
const StatsPage = lazy(() => import('@pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const ChallengesPage = lazy(() =>
  import('@pages/ChallengesPage').then((m) => ({ default: m.ChallengesPage }))
);
const ChallengeDetailPage = lazy(() =>
  import('@pages/ChallengeDetailPage').then((m) => ({ default: m.ChallengeDetailPage }))
);
const CreateChallengePage = lazy(() =>
  import('@pages/CreateChallengePage').then((m) => ({ default: m.CreateChallengePage }))
);
const ComponentsPage = lazy(() =>
  import('@pages/ComponentsPage').then((m) => ({ default: m.ComponentsPage }))
);
const ProfilePage = lazy(() =>
  import('@pages/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const FriendsPage = lazy(() =>
  import('@pages/FriendsPage').then((m) => ({ default: m.FriendsPage }))
);
const UserProfilePage = lazy(() =>
  import('@pages/UserProfilePage').then((m) => ({ default: m.UserProfilePage }))
);
const CompareWithFriendPage = lazy(() =>
  import('@pages/CompareWithFriendPage').then((m) => ({ default: m.CompareWithFriendPage }))
);
const LeaderboardsPage = lazy(() =>
  import('@pages/LeaderboardsPage').then((m) => ({ default: m.LeaderboardsPage }))
);
const FeedPage = lazy(() => import('@pages/FeedPage').then((m) => ({ default: m.FeedPage })));
const NotificationsPage = lazy(() =>
  import('@pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const SettingsPage = lazy(() =>
  import('@pages/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const AboutPage = lazy(() => import('@pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const PrivacyPage = lazy(() =>
  import('@pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const TermsPage = lazy(() => import('@pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const AdminPage = lazy(() => import('@pages/AdminPage').then((m) => ({ default: m.AdminPage })));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
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
          className="relative flex overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-md dark:border-gray-700/40 dark:bg-gray-900/70 dark:ring-gray-100/10"
        >
          <div className="w-1 bg-gradient-to-b from-strava-orange to-strava-orange-dark" />
          <div className="flex items-center gap-5 px-8 py-6">
            <Loader2
              size={28}
              strokeWidth={1.75}
              className="animate-spin text-gray-800 dark:text-gray-100"
            />
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                {t('common.authenticating')}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-50">
                {t('common.loading')}
              </span>
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

// Wraps a protected page in: auth gate → per-page error boundary → Suspense
// for the lazy chunk. Keeps the route table readable below.
const ProtectedPage = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute>
    <RouteErrorBoundary>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </RouteErrorBoundary>
  </ProtectedRoute>
);

export const App = () => {
  const { t } = useTranslation();
  const { fetchUser } = useAuthStore();
  const isOnline = useOnlineStatus();

  // Initialize PWA features
  usePwa();
  useServiceWorkerRegistration();
  useTheme();

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
          {/* Public legal pages — must be readable without auth (Strava ToS
              requirement for production OAuth apps). */}
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedPage>
                <DashboardPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedPage>
                <ActivitiesPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/activities/:id"
            element={
              <ProtectedPage>
                <ActivityDetailPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/personal-records"
            element={
              <ProtectedPage>
                <PersonalRecordsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/achievements"
            element={
              <ProtectedPage>
                <AchievementsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/stats"
            element={
              <ProtectedPage>
                <StatsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/challenges"
            element={
              <ProtectedPage>
                <ChallengesPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/challenges/create"
            element={
              <ProtectedPage>
                <CreateChallengePage />
              </ProtectedPage>
            }
          />
          <Route
            path="/challenges/:id"
            element={
              <ProtectedPage>
                <ChallengeDetailPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedPage>
                <ProfilePage />
              </ProtectedPage>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedPage>
                <FriendsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedPage>
                <UserProfilePage />
              </ProtectedPage>
            }
          />
          <Route
            path="/users/:id/compare"
            element={
              <ProtectedPage>
                <CompareWithFriendPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedPage>
                <FeedPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/leaderboards"
            element={
              <ProtectedPage>
                <LeaderboardsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedPage>
                <NotificationsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedPage>
                <SettingsPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/about"
            element={
              <ProtectedPage>
                <AboutPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedPage>
                <AdminPage />
              </ProtectedPage>
            }
          />
          <Route
            path="/components"
            element={
              <ProtectedPage>
                <ComponentsPage />
              </ProtectedPage>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
};
