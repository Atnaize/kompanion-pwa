import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@components/layout';
import { GlassCard, Button, Avatar } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import { authService } from '@api/services';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { success } = useToastStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    success('Logged out successfully');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);

    try {
      await authService.deleteAccount();
      success('Account deleted successfully');
      navigate('/login');
    } catch (error) {
      // Error toast is automatically shown by API client
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Profile Section */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Profile</h3>
          <GlassCard className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <Avatar
                src={user.profile}
                alt={user.firstname}
                fallbackText={`${user.firstname} ${user.lastname}`}
                size="lg"
                className="border-4"
              />
              <div>
                <h4 className="text-xl font-bold text-gray-900">
                  {user.firstname} {user.lastname}
                </h4>
                <p className="mt-1 text-sm text-gray-500">Strava ID: {user.stravaId}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 py-2">
                <span className="text-sm text-gray-600">Account Type</span>
                <span className="font-medium text-gray-900">Strava Connected</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">User ID</span>
                <span className="font-medium text-gray-900">{user.userId}</span>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Account Actions */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Account Actions</h3>
          <div className="space-y-3">
            {/* Logout */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">Logout</h4>
                  <p className="text-sm text-gray-600">Sign out of your account</p>
                </div>
                <Button variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </GlassCard>

            {/* Delete Account */}
            <GlassCard className="border-2 border-red-200 p-5">
              <div>
                <h4 className="font-bold text-red-600">Danger Zone</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Permanently delete your Kompanion account and all associated data
                </p>

                {!showDeleteConfirm ? (
                  <Button
                    variant="secondary"
                    className="mt-4 text-red-600 hover:bg-red-50"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </Button>
                ) : (
                  <div className="mt-4 rounded-xl bg-red-50 p-4">
                    <p className="mb-3 text-sm font-medium text-red-900">
                      ⚠️ Are you sure? This action cannot be undone!
                    </p>
                    <p className="mb-4 text-xs text-red-700">
                      This will permanently delete:
                      <br />• Your Kompanion profile
                      <br />• All synced activities
                      <br />• All achievements and progress
                      <br />• All quest history
                    </p>
                    <div className="flex gap-3">
                      <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete Forever'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </section>
      </div>
    </Layout>
  );
};
