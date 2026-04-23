import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { GlassCard, Button, Avatar } from '@components/ui';
import { useAuthStore } from '@store/authStore';
import { useToastStore } from '@store/toastStore';
import { authService } from '@api/services';

export const ProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { success } = useToastStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    success(t('profile.logout.success'));
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
      success(t('profile.deleteAccount.success'));
      navigate('/login');
    } catch {
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
          <h3 className="mb-4 text-lg font-bold text-gray-900">{t('profile.title')}</h3>
          <GlassCard className="p-6">
            <div className="mb-6 flex items-center gap-4">
              <Avatar
                src={user.profile}
                firstname={user.firstname}
                lastname={user.lastname}
                size="lg"
                className="border-4"
              />
              <div>
                <h4 className="text-xl font-bold text-gray-900">
                  {user.firstname} {user.lastname}
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  {t('profileMenu.stravaId', { id: user.stravaId })}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 py-2">
                <span className="text-sm text-gray-600">{t('profile.accountType')}</span>
                <span className="font-medium text-gray-900">{t('profile.stravaConnected')}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">{t('profile.userId')}</span>
                <span className="font-medium text-gray-900">{user.userId}</span>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Account Actions */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">{t('profile.accountActions')}</h3>
          <div className="space-y-3">
            {/* Logout */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900">{t('profile.logout.title')}</h4>
                  <p className="text-sm text-gray-600">{t('profile.logout.description')}</p>
                </div>
                <Button variant="secondary" onClick={handleLogout}>
                  {t('profile.logout.button')}
                </Button>
              </div>
            </GlassCard>

            {/* Delete Account */}
            <GlassCard className="border-2 border-red-200 p-5">
              <div>
                <h4 className="font-bold text-red-600">{t('profile.deleteAccount.title')}</h4>
                <p className="mt-1 text-sm text-gray-600">
                  {t('profile.deleteAccount.description')}
                </p>

                {!showDeleteConfirm ? (
                  <Button
                    variant="secondary"
                    className="mt-4 text-red-600 hover:bg-red-50"
                    onClick={handleDeleteAccount}
                  >
                    {t('profile.deleteAccount.button')}
                  </Button>
                ) : (
                  <div className="mt-4 rounded-xl bg-red-50 p-4">
                    <p className="mb-3 text-sm font-medium text-red-900">
                      ⚠️ {t('profile.deleteAccount.confirmTitle')}
                    </p>
                    <p className="mb-4 text-xs text-red-700">
                      {t('profile.deleteAccount.confirmDescription')}
                      <br />• {t('profile.deleteAccount.confirmItem1')}
                      <br />• {t('profile.deleteAccount.confirmItem2')}
                      <br />• {t('profile.deleteAccount.confirmItem3')}
                      <br />• {t('profile.deleteAccount.confirmItem4')}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                      >
                        {isDeleting
                          ? t('profile.deleteAccount.deleting')
                          : t('profile.deleteAccount.confirmButton')}
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
