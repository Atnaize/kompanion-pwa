import { useTranslation } from 'react-i18next';
import { Layout } from '@components/layout';
import { BackButton, Button, GlassCard, Toggle } from '@components/ui';
import { usePushNotifications } from '@hooks/usePushNotifications';
import { useToastStore } from '@store/toastStore';

type PrefKey =
  | 'challengeInvites'
  | 'challengeUpdates'
  | 'chatMessages'
  | 'chatMentions'
  | 'chatReactions'
  | 'chatReplies'
  | 'friendRequests'
  | 'friendAccepted'
  | 'achievementUnlocked';

export const SettingsNotificationsPage = () => {
  const { t } = useTranslation();
  const { success, error } = useToastStore();
  const {
    isSupported,
    isSubscribed,
    isLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
  } = usePushNotifications();

  const handlePushToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
        success(t('settings.pushNotifications.disabled'));
      } else {
        await subscribe();
        success(t('settings.pushNotifications.enabled'));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : t('settings.pushNotifications.disabled'));
    }
  };

  const handlePref = async (key: PrefKey, value: boolean) => {
    try {
      await updatePreferences({ [key]: value });
      success(t('settings.preferences.updated'));
    } catch {
      error(t('settings.preferences.updateFailed'));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <BackButton to="/settings" label={t('settings.title')} />

        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('settings.pushNotifications.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isSupported
              ? t('settings.pushNotifications.descriptionSupported')
              : t('settings.pushNotifications.descriptionUnsupported')}
          </p>
        </div>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-gray-50">
                {t('settings.pushNotifications.enable')}
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {isSubscribed
                  ? t('settings.preferences.activeHint')
                  : t('settings.preferences.inactiveHint')}
              </p>
            </div>
            <Button
              onClick={handlePushToggle}
              disabled={!isSupported || isLoading}
              variant={isSubscribed ? 'secondary' : 'primary'}
              size="sm"
            >
              {isLoading
                ? t('common.loading')
                : isSubscribed
                  ? t('common.disable')
                  : t('common.enable')}
            </Button>
          </div>
        </GlassCard>

        {isSubscribed && preferences && (
          <>
            <section>
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {t('settings.preferences.friendsGroup')}
              </h3>
              <GlassCard className="space-y-4 p-5">
                <Toggle
                  enabled={preferences.friendRequests}
                  onChange={(v) => handlePref('friendRequests', v)}
                  label={t('settings.preferences.friendRequests')}
                  description={t('settings.preferences.friendRequestsDesc')}
                />
                <Toggle
                  enabled={preferences.friendAccepted}
                  onChange={(v) => handlePref('friendAccepted', v)}
                  label={t('settings.preferences.friendAccepted')}
                  description={t('settings.preferences.friendAcceptedDesc')}
                />
              </GlassCard>
            </section>

            <section>
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {t('settings.preferences.challengesGroup')}
              </h3>
              <GlassCard className="space-y-4 p-5">
                <Toggle
                  enabled={preferences.challengeInvites}
                  onChange={(v) => handlePref('challengeInvites', v)}
                  label={t('settings.preferences.challengeInvites')}
                  description={t('settings.preferences.challengeInvitesDesc')}
                />
                <Toggle
                  enabled={preferences.challengeUpdates}
                  onChange={(v) => handlePref('challengeUpdates', v)}
                  label={t('settings.preferences.challengeUpdates')}
                  description={t('settings.preferences.challengeUpdatesDesc')}
                />
              </GlassCard>
            </section>

            <section>
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {t('settings.preferences.chatGroup', { defaultValue: 'Chat' })}
              </h3>
              <GlassCard className="space-y-4 p-5">
                <Toggle
                  enabled={preferences.chatMessages}
                  onChange={(v) => handlePref('chatMessages', v)}
                  label={t('settings.preferences.chatMessages', { defaultValue: 'New messages' })}
                  description={t('settings.preferences.chatMessagesDesc', {
                    defaultValue:
                      "Get notified when someone sends a message in a club or challenge you're in.",
                  })}
                />
                <Toggle
                  enabled={preferences.chatMentions}
                  onChange={(v) => handlePref('chatMentions', v)}
                  label={t('settings.preferences.chatMentions', { defaultValue: 'Mentions' })}
                  description={t('settings.preferences.chatMentionsDesc', {
                    defaultValue: "When someone @'s you. Bypasses mute.",
                  })}
                />
                <Toggle
                  enabled={preferences.chatReactions}
                  onChange={(v) => handlePref('chatReactions', v)}
                  label={t('settings.preferences.chatReactions', { defaultValue: 'Reactions' })}
                  description={t('settings.preferences.chatReactionsDesc', {
                    defaultValue: 'When someone reacts to your message or activity.',
                  })}
                />
                <Toggle
                  enabled={preferences.chatReplies}
                  onChange={(v) => handlePref('chatReplies', v)}
                  label={t('settings.preferences.chatReplies', { defaultValue: 'Replies' })}
                  description={t('settings.preferences.chatRepliesDesc', {
                    defaultValue: 'When someone replies to your message or activity.',
                  })}
                />
              </GlassCard>
            </section>

            <section>
              <h3 className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {t('settings.preferences.achievementsGroup')}
              </h3>
              <GlassCard className="p-5">
                <Toggle
                  enabled={preferences.achievementUnlocked}
                  onChange={(v) => handlePref('achievementUnlocked', v)}
                  label={t('settings.preferences.achievementUnlocked')}
                  description={t('settings.preferences.achievementUnlockedDesc')}
                />
              </GlassCard>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
};
