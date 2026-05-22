import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ban, BellOff, MoreHorizontal, Volume2 } from 'lucide-react';
import clsx from 'clsx';
import { ConfirmModal } from '@components/ui';
import { privacyService } from '@api/services';
import { useToastStore } from '@store/toastStore';
import { usePrivacyActions } from '../hooks/usePrivacyActions';

interface UserActionsMenuProps {
  userId: number;
  userName: string;
}

/**
 * "···" dropdown shown on user profiles. Currently exposes Mute and Block.
 * Block goes through a confirmation modal because it's destructive (deletes
 * friendship + pending requests + leaves shared challenges).
 *
 * The mute state is derived from the cached `privacy-muted` query so toggling
 * the menu doesn't fire a new request when the user is also viewing settings.
 */
export const UserActionsMenu = ({ userId, userName }: UserActionsMenuProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success, error } = useToastStore();
  const { block, mute, unmute } = usePrivacyActions();

  const [isOpen, setIsOpen] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { data: mutedList = [] } = useQuery({
    queryKey: ['privacy-muted'],
    queryFn: async () => (await privacyService.listMuted()).data,
    staleTime: 60_000,
  });
  const isMuted = mutedList.some((u) => u.id === userId);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', onClickOutside);
    }
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isOpen]);

  const handleMuteToggle = async () => {
    setIsOpen(false);
    try {
      if (isMuted) {
        await unmute.mutateAsync(userId);
        success(t('privacy.toast.unmuted', { name: userName }));
      } else {
        await mute.mutateAsync(userId);
        success(t('privacy.toast.muted', { name: userName }));
      }
    } catch (err) {
      error(err instanceof Error ? err.message : t('privacy.toast.actionFailed'));
    }
  };

  const handleBlockConfirm = async () => {
    try {
      await block.mutateAsync(userId);
      success(t('privacy.toast.blocked', { name: userName }));
      setConfirmBlockOpen(false);
      // After blocking, the profile is no longer accessible — go home.
      navigate('/');
    } catch (err) {
      error(err instanceof Error ? err.message : t('privacy.toast.actionFailed'));
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={t('privacy.menu.open')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/60 text-gray-700 backdrop-blur transition hover:bg-white/80 dark:border-gray-700/40 dark:bg-gray-900/60 dark:text-gray-200 dark:hover:bg-gray-900/80"
        >
          <MoreHorizontal size={18} strokeWidth={2} />
        </button>

        {isOpen && (
          <div
            className={clsx(
              'absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-xl backdrop-blur-lg',
              'dark:border-gray-800/60 dark:bg-gray-900/95'
            )}
          >
            <button
              type="button"
              onClick={handleMuteToggle}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-900 transition hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              {isMuted ? (
                <>
                  <Volume2 size={16} strokeWidth={2} />
                  {t('privacy.menu.unmute')}
                </>
              ) : (
                <>
                  <BellOff size={16} strokeWidth={2} />
                  {t('privacy.menu.mute')}
                </>
              )}
            </button>
            <div className="my-1 border-t border-gray-200 dark:border-gray-800" />
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setConfirmBlockOpen(true);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <Ban size={16} strokeWidth={2} />
              {t('privacy.menu.block')}
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmBlockOpen}
        onClose={() => setConfirmBlockOpen(false)}
        onConfirm={handleBlockConfirm}
        title={t('privacy.confirmBlock.title', { name: userName })}
        message={
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            <li>{t('privacy.confirmBlock.bullet1')}</li>
            <li>{t('privacy.confirmBlock.bullet2')}</li>
            <li>{t('privacy.confirmBlock.bullet3')}</li>
            <li>{t('privacy.confirmBlock.bullet4')}</li>
          </ul>
        }
        confirmText={t('privacy.confirmBlock.confirm')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        isLoading={block.isPending}
      />
    </>
  );
};
