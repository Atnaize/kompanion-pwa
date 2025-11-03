import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '@components/layout/Layout';
import { GlassCard, Button } from '@components/ui';
import { FriendSelector } from '@features/friends';
import { useChallengeStore } from '@store/challengeStore';
import { friendsService } from '@api/services';
import { formatDateToInput, parseInputDate } from '@utils/format';
import type { Friend } from '@types';

const challengeSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Challenge name is required')
      .max(100, 'Name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    type: z.enum(['collaborative', 'competitive']),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    distanceTarget: z.string().optional(),
    elevationTarget: z.string().optional(),
    activityType: z.string().optional(),
    competitiveGoal: z.enum(['most', 'least', 'exact']),
    invitedUserIds: z.array(z.number()),
  })
  .refine(
    (data) => {
      const hasDistance = data.distanceTarget && parseFloat(data.distanceTarget) > 0;
      const hasElevation = data.elevationTarget && parseFloat(data.elevationTarget) > 0;
      return hasDistance || hasElevation;
    },
    {
      message: 'At least one goal (Distance or Elevation) must be set',
      path: ['distanceTarget'],
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

type ChallengeFormData = z.infer<typeof challengeSchema>;

export const CreateChallengePage = () => {
  const navigate = useNavigate();
  const { createChallenge } = useChallengeStore();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [allFriendsCache, setAllFriendsCache] = useState<Map<number, Friend>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'collaborative',
      startDate: '',
      endDate: '',
      distanceTarget: '',
      elevationTarget: '',
      activityType: '',
      competitiveGoal: 'most',
      invitedUserIds: [],
    },
  });

  const watchType = watch('type');

  const searchUsers = useCallback(async () => {
    setIsLoadingFriends(true);
    try {
      const response = await friendsService.search(searchQuery);
      if (response.success && response.data) {
        setFriends(response.data);
        // Update cache with new friends
        setAllFriendsCache((prev) => {
          const updated = new Map(prev);
          response.data.forEach((friend: Friend) => {
            updated.set(friend.id, friend);
          });
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        void searchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, searchUsers]);

  useEffect(() => {
    // Set default dates: tomorrow to next week
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    setValue('startDate', formatDateToInput(tomorrow));
    setValue('endDate', formatDateToInput(nextWeek));
  }, [setValue]);

  const onSubmit = async (data: ChallengeFormData) => {
    setIsSubmitting(true);

    try {
      const distanceInMeters = data.distanceTarget
        ? parseFloat(data.distanceTarget) * 1000
        : undefined;
      const elevationInMeters = data.elevationTarget ? parseFloat(data.elevationTarget) : undefined;

      // Convert date inputs to Date objects (start of day and end of day in local timezone)
      const startDate = parseInputDate(data.startDate);
      const endDate = parseInputDate(data.endDate, true);

      const challenge = await createChallenge({
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        targets: {
          distance: distanceInMeters,
          elevation: elevationInMeters,
          activityType: data.activityType || undefined,
        },
        competitiveGoal: data.type === 'competitive' ? data.competitiveGoal : undefined,
        invitedUserIds: data.invitedUserIds.length > 0 ? data.invitedUserIds : undefined,
      });

      if (challenge) {
        navigate(`/challenges/${challenge.id}`);
      }
    } catch (error) {
      console.error('Failed to create challenge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <button
                onClick={() => navigate('/challenges')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Challenge</h1>
            <p className="text-sm text-gray-600">Set up a new challenge for you and your friends</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Info */}
          <GlassCard className="p-4">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Challenge Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200'} bg-white/50 px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-orange-500'}`}
                  placeholder="e.g., Summer Sprint Challenge"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className={`w-full resize-none rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-200'} bg-white/50 px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 ${errors.description ? 'focus:ring-red-500' : 'focus:ring-orange-500'}`}
                  placeholder="Describe your challenge..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Challenge Type *
                </label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange('collaborative')}
                        className={`rounded-lg border-2 p-4 transition-all ${
                          field.value === 'collaborative'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 bg-white/50'
                        }`}
                      >
                        <div className="mb-2 text-2xl">🤝</div>
                        <div className="font-medium text-gray-900">Collaborative</div>
                        <div className="mt-1 text-xs text-gray-600">
                          Work together to reach a goal
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('competitive')}
                        className={`rounded-lg border-2 p-4 transition-all ${
                          field.value === 'competitive'
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 bg-white/50'
                        }`}
                      >
                        <div className="mb-2 text-2xl">⚔️</div>
                        <div className="font-medium text-gray-900">Competitive</div>
                        <div className="mt-1 text-xs text-gray-600">Compete to see who wins</div>
                      </button>
                    </div>
                  )}
                />
              </div>

              {watchType === 'competitive' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Competitive Goal *
                  </label>
                  <select
                    {...register('competitiveGoal')}
                    className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="most">Most distance/elevation</option>
                    <option value="least">Least distance/elevation</option>
                    <option value="exact">Closest to target</option>
                  </select>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Dates */}
          <GlassCard className="p-4">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Duration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Start Date *</label>
                <input
                  type="date"
                  {...register('startDate')}
                  className={`w-full rounded-lg border ${errors.startDate ? 'border-red-500' : 'border-gray-200'} bg-white/50 px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 ${errors.startDate ? 'focus:ring-red-500' : 'focus:ring-orange-500'}`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">End Date *</label>
                <input
                  type="date"
                  {...register('endDate')}
                  className={`w-full rounded-lg border ${errors.endDate ? 'border-red-500' : 'border-gray-200'} bg-white/50 px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 ${errors.endDate ? 'focus:ring-red-500' : 'focus:ring-orange-500'}`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Targets */}
          <GlassCard className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Goals</h2>
              <span className="text-xs text-gray-500">At least one required *</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Distance Target (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  {...register('distanceTarget')}
                  className={`w-full rounded-lg border ${errors.distanceTarget ? 'border-red-500' : 'border-gray-200'} bg-white/50 px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 ${errors.distanceTarget ? 'focus:ring-red-500' : 'focus:ring-orange-500'}`}
                  placeholder="e.g., 100"
                />
                {errors.distanceTarget && (
                  <p className="mt-1 text-sm text-red-600">{errors.distanceTarget.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Elevation Target (m)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  {...register('elevationTarget')}
                  className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., 1000"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Activity Type (optional)
                </label>
                <select
                  {...register('activityType')}
                  className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">All Activities</option>
                  <option value="Run">Run</option>
                  <option value="Ride">Ride</option>
                  <option value="Swim">Swim</option>
                  <option value="Hike">Hike</option>
                  <option value="Walk">Walk</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* Friends */}
          <GlassCard className="p-4">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Invite Friends</h2>
            <p className="mb-3 text-sm text-gray-600">
              Search for Kompanion users to invite (minimum 2 characters)
            </p>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <Controller
              name="invitedUserIds"
              control={control}
              render={({ field }) => {
                // Combine current search results with selected friends from cache
                const selectedFriendsFromCache = field.value
                  .map((id: number) => allFriendsCache.get(id))
                  .filter((f: Friend | undefined): f is Friend => f !== undefined);

                const friendsMap = new Map<number, Friend>();
                // Add current search results
                friends.forEach((f) => friendsMap.set(f.id, f));
                // Ensure selected friends are always included
                selectedFriendsFromCache.forEach((f) => friendsMap.set(f.id, f));

                const combinedFriends = Array.from(friendsMap.values());

                return (
                  <FriendSelector
                    selectedFriendIds={field.value}
                    onSelectionChange={field.onChange}
                    friends={combinedFriends}
                    isLoading={isLoadingFriends}
                    showSearch={false}
                    searchQuery={searchQuery}
                  />
                );
              }}
            />
          </GlassCard>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/challenges')}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Challenge'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
