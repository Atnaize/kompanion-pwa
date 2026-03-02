import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mb-4 text-4xl">🏃‍♂️</div>
          <p className="text-gray-600">Loading...</p>
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
          📡 You&apos;re offline - some features may be limited
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
