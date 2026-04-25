import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Swords, Users } from 'lucide-react';
import { Layout } from '@components/layout';
import { GlassCard, Button } from '@components/ui';
import { FriendSelector } from '@features/friends';
import { useChallengeStore } from '@store/challengeStore';
import { formatDateToInput, parseInputDate } from '@utils/format';
import { challengeSchema, type ChallengeFormData } from './challengeSchema';
import { useFriendSearch } from './useFriendSearch';

export const CreateChallengePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createChallenge } = useChallengeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    searchQuery,
    setSearchQuery,
    isLoading: isLoadingFriends,
    combineWithSelected,
  } = useFriendSearch();

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

  useEffect(() => {
    // Default window: tomorrow to next week
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
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <button
                onClick={() => navigate('/challenges')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {t('createChallenge.back')}
              </button>
            </div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {t('createChallenge.title')}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('createChallenge.subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <GlassCard className="p-4">
            <h2 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {t('createChallenge.basicInfo')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('createChallenge.name')}
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full rounded-lg border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-white/50 px-4 py-2 backdrop-blur-sm dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-orange-500'}`}
                  placeholder={t('createChallenge.namePlaceholder')}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('createChallenge.description')}
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className={`w-full resize-none rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-white/50 px-4 py-2 backdrop-blur-sm dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.description ? 'focus:ring-red-500' : 'focus:ring-orange-500'}`}
                  placeholder={t('createChallenge.descriptionPlaceholder')}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('createChallenge.type')}
                </label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => field.onChange('collaborative')}
                        className={`rounded-lg border-2 p-4 text-left transition-all ${
                          field.value === 'collaborative'
                            ? 'border-strava-orange bg-orange-50 dark:bg-orange-950/30'
                            : 'border-gray-200 bg-white/50 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-gray-700'
                        }`}
                      >
                        <Users className="mb-2 h-5 w-5 text-strava-orange" strokeWidth={1.75} />
                        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-50">
                          {t('createChallenge.collaborative')}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {t('createChallenge.collaborativeDesc')}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('competitive')}
                        className={`rounded-lg border-2 p-4 text-left transition-all ${
                          field.value === 'competitive'
                            ? 'border-strava-orange bg-orange-50 dark:bg-orange-950/30'
                            : 'border-gray-200 bg-white/50 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-gray-700'
                        }`}
                      >
                        <Swords className="mb-2 h-5 w-5 text-strava-orange" strokeWidth={1.75} />
                        <div className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-50">
                          {t('createChallenge.competitive')}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {t('createChallenge.competitiveDesc')}
                        </div>
                      </button>
                    </div>
                  )}
                />
              </div>

              {watchType === 'competitive' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('createChallenge.competitiveGoal')}
                  </label>
                  <select
                    {...register('competitiveGoal')}
                    className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-100"
                  >
                    <option value="most">{t('createChallenge.goalMost')}</option>
                    <option value="least">{t('createChallenge.goalLeast')}</option>
                    <option value="exact">{t('createChallenge.goalExact')}</option>
                  </select>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <h2 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {t('createChallenge.duration')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('createChallenge.startDate')}
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className={`w-full rounded-lg border ${errors.startDate ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-white/50 px-4 py-2 backdrop-blur-sm dark:bg-gray-900/50 dark:text-gray-100 focus:outline-none focus:ring-2 ${errors.startDate ? 'focus:ring-red-500' : 'focus:ring-orange-500'}`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('createChallenge.endDate')}
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className={`w-full rounded-lg border ${errors.endDate ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-white/50 px-4 py-2 backdrop-blur-sm dark:bg-gray-900/50 dark:text-gray-100 focus:outline-none focus:ring-2 ${errors.endDate ? 'focus:ring-red-500' : 'focus:ring-orange-500'}`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {t('createChallenge.goals')}
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('createChallenge.goalsRequired')}</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('createChallenge.distanceTarget')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  {...register('distanceTarget')}
                  className={`w-full rounded-lg border ${errors.distanceTarget ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'} bg-white/50 px-4 py-2 backdrop-blur-sm dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${errors.distanceTarget ? 'focus:ring-red-500' : 'focus:ring-orange-500'}`}
                  placeholder={t('createChallenge.distancePlaceholder')}
                />
                {errors.distanceTarget && (
                  <p className="mt-1 text-sm text-red-600">{errors.distanceTarget.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('createChallenge.elevationTarget')}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  {...register('elevationTarget')}
                  className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder-gray-500"
                  placeholder={t('createChallenge.elevationPlaceholder')}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('createChallenge.activityType')}
                </label>
                <select
                  {...register('activityType')}
                  className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-100"
                >
                  <option value="">{t('createChallenge.allActivities')}</option>
                  <option value="Run">{t('createChallenge.activityRun')}</option>
                  <option value="Ride">{t('createChallenge.activityRide')}</option>
                  <option value="Swim">{t('createChallenge.activitySwim')}</option>
                  <option value="Hike">{t('createChallenge.activityHike')}</option>
                  <option value="Walk">{t('createChallenge.activityWalk')}</option>
                </select>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <h2 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              {t('createChallenge.inviteFriends')}
            </h2>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{t('createChallenge.inviteDescription')}</p>
            <div className="mb-4">
              <input
                type="text"
                placeholder={t('createChallenge.searchUsers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white/50 px-4 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
            <Controller
              name="invitedUserIds"
              control={control}
              render={({ field }) => (
                <FriendSelector
                  selectedFriendIds={field.value}
                  onSelectionChange={field.onChange}
                  friends={combineWithSelected(field.value)}
                  isLoading={isLoadingFriends}
                  showSearch={false}
                  searchQuery={searchQuery}
                />
              )}
            />
          </GlassCard>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/challenges')}
              className="flex-1"
              disabled={isSubmitting}
            >
              {t('createChallenge.cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? t('createChallenge.creating') : t('createChallenge.submit')}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
