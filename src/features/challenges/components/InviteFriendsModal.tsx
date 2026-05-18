import { useState, useEffect } from 'react';
import { GlassCard, Button } from '@components/ui';
import { FriendSelector } from '@features/friends';
import { friendsService } from '@api/services';
import type { Friend } from '@types';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (friendIds: number[]) => Promise<void>;
  challengeId: string;
  existingParticipantIds?: number[];
}

export const InviteFriendsModal = ({
  isOpen,
  onClose,
  onInvite,
  challengeId: _challengeId,
  existingParticipantIds = [],
}: InviteFriendsModalProps) => {
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedFriendIds([]);
      setFriends([]);
      setSearchQuery('');
      return;
    }

    let cancelled = false;
    setIsLoadingFriends(true);
    (async () => {
      try {
        const response = await friendsService.list();
        if (cancelled) return;
        if (response.success && response.data) {
          // Only friends can be invited; also filter anyone already in the challenge.
          setFriends(response.data.filter((f) => !existingParticipantIds.includes(f.id)));
        }
      } catch (error) {
        console.error('Error loading friends:', error);
      } finally {
        if (!cancelled) setIsLoadingFriends(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, existingParticipantIds]);

  const handleInvite = async () => {
    if (selectedFriendIds.length === 0) {
      return;
    }

    setIsInviting(true);
    try {
      await onInvite(selectedFriendIds);
      onClose();
    } catch (error) {
      console.error('Error inviting friends:', error);
    } finally {
      setIsInviting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <GlassCard className="relative z-10 w-full max-w-lg p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">Invite Friends</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Pick from your Kompanion friends to invite to this challenge.
        </p>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search your friends by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder-gray-500"
            autoFocus
          />
        </div>

        <div className="mb-6">
          <FriendSelector
            selectedFriendIds={selectedFriendIds}
            onSelectionChange={setSelectedFriendIds}
            friends={friends}
            isLoading={isLoadingFriends}
            showSearch={false}
            searchQuery={searchQuery}
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1" disabled={isInviting}>
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            className="flex-1"
            disabled={isInviting || selectedFriendIds.length === 0}
          >
            {isInviting
              ? 'Sending...'
              : `Invite ${selectedFriendIds.length > 0 ? `(${selectedFriendIds.length})` : ''}`}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
