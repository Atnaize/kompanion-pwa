import React, { useState, useEffect } from 'react';
import type { Friend } from '@types';
import { GlassCard, Skeleton, Avatar } from '@components/ui';

/**
 * Normalizes a string for search (accent/diacritic insensitive)
 * "Mégane" → "megane", "Müller" → "muller"
 */
function normalizeForSearch(str: string): string {
  return str
    .replace(/æ/gi, 'ae')
    .replace(/œ/gi, 'oe')
    .replace(/ß/g, 'ss')
    .replace(/ø/gi, 'o')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

interface FriendSelectorProps {
  selectedFriendIds: number[];
  onSelectionChange: (friendIds: number[]) => void;
  friends: Friend[];
  isLoading?: boolean;
  showSearch?: boolean;
  searchQuery?: string;
}

export const FriendSelector: React.FC<FriendSelectorProps> = ({
  selectedFriendIds,
  onSelectionChange,
  friends,
  isLoading = false,
  showSearch = true,
  searchQuery: externalSearchQuery,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const activeSearchQuery = externalSearchQuery ?? searchQuery;
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>(friends);
  // Cache to store all friends we've ever seen (so selected friends don't disappear)
  const [allFriendsCache, setAllFriendsCache] = useState<Map<number, Friend>>(new Map());

  // Update cache whenever new friends come in
  useEffect(() => {
    setAllFriendsCache((prev) => {
      const updated = new Map(prev);
      friends.forEach((friend) => {
        updated.set(friend.id, friend);
      });
      return updated;
    });
  }, [friends]);

  useEffect(() => {
    if (!activeSearchQuery.trim()) {
      setFilteredFriends(friends);
      return;
    }

    const query = normalizeForSearch(activeSearchQuery);
    const filtered = friends.filter(
      (friend) =>
        normalizeForSearch(friend.firstname).includes(query) ||
        normalizeForSearch(friend.lastname).includes(query)
    );
    setFilteredFriends(filtered);
  }, [activeSearchQuery, friends]);

  const toggleFriend = (friendId: number) => {
    if (selectedFriendIds.includes(friendId)) {
      onSelectionChange(selectedFriendIds.filter((id) => id !== friendId));
    } else {
      onSelectionChange([...selectedFriendIds, friendId]);
    }
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (friends.length === 0 && !activeSearchQuery) {
    return (
      <GlassCard className="p-6 text-center">
        <p className="text-sm text-gray-500">
          No Kompanion users found. Try searching for users by name to invite them!
        </p>
      </GlassCard>
    );
  }

  // Get selected friends from cache (so they don't disappear when search changes)
  const selectedFriends = selectedFriendIds
    .map((id) => allFriendsCache.get(id))
    .filter((f): f is Friend => f !== undefined);

  const unselectedFilteredFriends = filteredFriends.filter(
    (f) => !selectedFriendIds.includes(f.id)
  );

  return (
    <div className="space-y-3">
      {/* Selected Friends Section - Always Visible */}
      {selectedFriendIds.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Invited ({selectedFriendIds.length})
            </h3>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-gray-600 hover:text-gray-700"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {selectedFriends.map((friend) => (
              <GlassCard
                key={friend.id}
                className="group cursor-pointer border-2 border-orange-500 bg-orange-50/30 p-3 transition-all hover:bg-orange-50/50"
                onClick={() => toggleFriend(friend.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={friend.profileMedium || friend.profile}
                    firstname={friend.firstname}
                    lastname={friend.lastname}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {friend.firstname} {friend.lastname}
                    </p>
                    <p className="text-xs text-gray-500">Kompanion User</p>
                  </div>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition-colors hover:bg-red-100 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFriend(friend.id);
                    }}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Search Section */}
      {showSearch && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      )}

      {/* Available Users List */}
      <div className="max-h-96 space-y-2 overflow-y-auto">
        {unselectedFilteredFriends.length === 0 ? (
          activeSearchQuery.length >= 2 ? (
            <GlassCard className="p-6 text-center">
              <p className="text-sm text-gray-500">No users match your search</p>
            </GlassCard>
          ) : selectedFriendIds.length === 0 ? (
            <GlassCard className="p-6 text-center">
              <p className="text-sm text-gray-500">Start typing to search for users...</p>
            </GlassCard>
          ) : null
        ) : (
          unselectedFilteredFriends.map((friend) => (
            <GlassCard
              key={friend.id}
              className="group cursor-pointer border border-transparent p-3 transition-all hover:border-orange-300 hover:bg-orange-50/20"
              onClick={() => toggleFriend(friend.id)}
            >
              <div className="flex items-center gap-3">
                {/* Checkbox */}
                <div className="flex-shrink-0">
                  <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-gray-300 bg-white transition-all group-hover:border-orange-400">
                    {/* Empty checkbox - not selected */}
                  </div>
                </div>

                {/* Avatar */}
                <Avatar
                  src={friend.profileMedium || friend.profile}
                  firstname={friend.firstname}
                  lastname={friend.lastname}
                  size="md"
                />

                {/* User Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {friend.firstname} {friend.lastname}
                  </p>
                  <p className="text-xs text-gray-500">Kompanion User</p>
                </div>

                {/* Add Button */}
                <button
                  type="button"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white opacity-0 transition-all group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFriend(friend.id);
                  }}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 4v16m8-8H4"></path>
                  </svg>
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};
