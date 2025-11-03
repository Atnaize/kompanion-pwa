import { useState, useEffect, useCallback } from 'react';
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
      // Reset state when modal closes
      setSelectedFriendIds([]);
      setFriends([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  const searchUsers = useCallback(async () => {
    setIsLoadingFriends(true);
    try {
      const response = await friendsService.search(searchQuery);
      if (response.success && response.data) {
        // Filter out users who are already participants
        const availableFriends = response.data.filter(
          (friend) => !existingParticipantIds.includes(friend.id)
        );
        setFriends(availableFriends);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [searchQuery, existingParticipantIds]);

  useEffect(() => {
    if (!isOpen) return;

    if (searchQuery.length < 2) {
      setFriends([]);
      return;
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      void searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, isOpen, searchUsers]);

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
          <h2 className="text-xl font-bold text-gray-900">Invite Friends</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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

        <p className="mb-4 text-sm text-gray-600">
          Search for Kompanion users by name to invite them to this challenge.
        </p>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users by name (min 2 characters)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            autoFocus
          />
        </div>

        <div className="mb-6">
          {searchQuery.length < 2 ? (
            <GlassCard className="p-6 text-center">
              <p className="text-sm text-gray-500">Start typing to search for users...</p>
            </GlassCard>
          ) : (
            <FriendSelector
              selectedFriendIds={selectedFriendIds}
              onSelectionChange={setSelectedFriendIds}
              friends={friends}
              isLoading={isLoadingFriends}
            />
          )}
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
