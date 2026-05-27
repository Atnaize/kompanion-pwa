import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller, type UseFormReturn, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Shield, Sparkles, Swords, Users } from 'lucide-react';
import { Layout } from '@components/layout';
import { BackButton, Button, GlassCard, Input, Select, Textarea } from '@components/ui';
import { FriendSelector } from '@features/friends';
import { clubsService } from '@api/services';
import { useAuthStore } from '@store/authStore';
import { useChallengeStore } from '@store/challengeStore';
import { formatDateToInput, parseInputDate } from '@utils/format';
import type { Friend } from '@types';
import { challengeSchema, type ChallengeFormData } from './challengeSchema';
import { useFriendSearch } from './useFriendSearch';

type StepId = 'basics' | 'duration' | 'goals' | 'invites';
const STEPS: StepId[] = ['basics', 'duration', 'goals', 'invites'];

// Fields validated at each step boundary. The schema itself runs the cross-
// field refinements (e.g. endDate > startDate) so we don't replicate those —
// react-hook-form's `trigger(fields)` already evaluates the relevant refines.
const STEP_FIELDS: Record<StepId, Array<FieldPath<ChallengeFormData>>> = {
  basics: ['name', 'description', 'type', 'competitiveGoal'],
  duration: ['startDate', 'endDate'],
  goals: ['distanceTarget', 'elevationTarget', 'activityType'],
  invites: ['invitedUserIds'],
};

/**
 * Multi-step wizard for creating a challenge. Replaces the previous single
 * tall form which the audit flagged as the worst-offender for mobile UX
 * (every field visible at once, no clear progress, scroll fatigue).
 *
 * The form state is a single react-hook-form instance — we just render a
 * different slice of fields per step. `trigger()` runs schema validation on
 * the current step's fields before advancing, so users can't skip past
 * required inputs.
 */
export const CreateChallengePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clubId = searchParams.get('clubId') ?? undefined;
  const viewerId = useAuthStore((s) => s.user?.userId);
  const queryClient = useQueryClient();
  const { createChallenge } = useChallengeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;

  const friendSearch = useFriendSearch();

  const { data: club, isLoading: isLoadingClub } = useQuery({
    queryKey: ['clubs', 'detail', clubId],
    queryFn: async () => (await clubsService.get(clubId!)).data,
    enabled: !!clubId,
  });

  const clubMemberFriends: Friend[] = useMemo(() => {
    if (!club) return [];
    return club.members.filter((m) => m.userId !== viewerId).map((m) => m.user);
  }, [club, viewerId]);

  const form = useForm<ChallengeFormData>({
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
    mode: 'onTouched',
  });
  const { handleSubmit, setValue, watch, trigger } = form;

  const watchInvitedIds = watch('invitedUserIds');

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setValue('startDate', formatDateToInput(tomorrow));
    setValue('endDate', formatDateToInput(nextWeek));
  }, [setValue]);

  useEffect(() => {
    if (clubMemberFriends.length > 0 && watchInvitedIds.length === 0) {
      setValue(
        'invitedUserIds',
        clubMemberFriends.map((f) => f.id)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubMemberFriends.length]);

  const handleNext = async () => {
    const ok = await trigger(STEP_FIELDS[currentStep]);
    if (!ok) return;
    if (!isLast) setStepIndex((i) => i + 1);
  };

  const handlePrev = () => {
    if (!isFirst) setStepIndex((i) => i - 1);
  };

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
        clubId,
      });

      if (challenge) {
        if (clubId) {
          void queryClient.invalidateQueries({ queryKey: ['challenges', 'club', clubId] });
        }
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
        <BackButton to="/challenges" />

        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {t('createChallenge.title')}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('createChallenge.subtitle')}
          </p>
        </div>

        {clubId && (isLoadingClub || club) && (
          <GlassCard className="flex items-center gap-3 border-strava-orange/40 p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-strava-orange/15 text-strava-orange">
              <Shield size={18} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                {t('createChallenge.launchingFrom')}
              </p>
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                {club?.name ?? t('common.loading')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/challenges/create')}
              className="shrink-0 text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {t('createChallenge.detachClub')}
            </button>
          </GlassCard>
        )}

        <WizardSteps currentIndex={stepIndex} />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {currentStep === 'basics' && <BasicsStep form={form} />}
          {currentStep === 'duration' && <DurationStep form={form} />}
          {currentStep === 'goals' && <GoalsStep form={form} />}
          {currentStep === 'invites' && (
            <InvitesStep
              form={form}
              clubId={clubId}
              clubMemberFriends={clubMemberFriends}
              isLoadingClub={isLoadingClub}
              friendSearch={friendSearch}
            />
          )}

          {/* Conversion nudge lives with the invites step — that's where the
              friend selection lives, so the prompt has context next to it. */}
          {currentStep === 'invites' &&
            !clubId &&
            !nudgeDismissed &&
            watchInvitedIds.length >= 3 && (
              <SaveCrewAsClubNudge
                selectedIds={watchInvitedIds}
                onDismiss={() => setNudgeDismissed(true)}
                onCreate={(ids) => navigate(`/clubs/create?invite=${ids.join(',')}`)}
              />
            )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={isFirst ? () => navigate('/challenges') : handlePrev}
              className="flex-1"
              disabled={isSubmitting}
            >
              <ChevronLeft size={14} strokeWidth={2} className="mr-1" />
              {isFirst ? t('createChallenge.cancel') : t('createChallenge.previous')}
            </Button>
            {isLast ? (
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? t('createChallenge.creating') : t('createChallenge.submit')}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext} className="flex-1" disabled={isSubmitting}>
                {t('createChallenge.next')}
                <ChevronRight size={14} strokeWidth={2} className="ml-1" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
};

/**
 * Pill-style step indicator: shows progress and lets users see how far they
 * have to go. Not clickable — users move through with Next/Previous so
 * validation runs at each boundary.
 */
const WizardSteps = ({ currentIndex }: { currentIndex: number }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
        {t('createChallenge.stepIndicator', { current: currentIndex + 1, total: STEPS.length })}
      </p>
      <div className="flex gap-1.5">
        {STEPS.map((id, i) => (
          <div
            key={id}
            className={clsx(
              'h-1.5 flex-1 rounded-full transition-colors',
              i <= currentIndex
                ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                : 'bg-gray-200 dark:bg-gray-800'
            )}
          />
        ))}
      </div>
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
        {t(`createChallenge.steps.${STEPS[currentIndex]}`)}
      </p>
    </div>
  );
};

interface StepProps {
  form: UseFormReturn<ChallengeFormData>;
}

const BasicsStep = ({ form }: StepProps) => {
  const { t } = useTranslation();
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;
  const watchType = watch('type');

  return (
    <GlassCard className="p-4">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('createChallenge.name')}
          </label>
          <Input
            type="text"
            {...register('name')}
            error={!!errors.name}
            placeholder={t('createChallenge.namePlaceholder')}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('createChallenge.description')}
          </label>
          <Textarea
            {...register('description')}
            rows={3}
            error={!!errors.description}
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
                <TypeCard
                  active={field.value === 'collaborative'}
                  onClick={() => field.onChange('collaborative')}
                  icon={<Users className="mb-2 h-5 w-5 text-strava-orange" strokeWidth={1.75} />}
                  title={t('createChallenge.collaborative')}
                  description={t('createChallenge.collaborativeDesc')}
                />
                <TypeCard
                  active={field.value === 'competitive'}
                  onClick={() => field.onChange('competitive')}
                  icon={<Swords className="mb-2 h-5 w-5 text-strava-orange" strokeWidth={1.75} />}
                  title={t('createChallenge.competitive')}
                  description={t('createChallenge.competitiveDesc')}
                />
              </div>
            )}
          />
        </div>

        {watchType === 'competitive' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('createChallenge.competitiveGoal')}
            </label>
            <Select {...register('competitiveGoal')}>
              <option value="most">{t('createChallenge.goalMost')}</option>
              <option value="least">{t('createChallenge.goalLeast')}</option>
              <option value="exact">{t('createChallenge.goalExact')}</option>
            </Select>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

const DurationStep = ({ form }: StepProps) => {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <GlassCard className="p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('createChallenge.startDate')}
          </label>
          <Input type="date" {...register('startDate')} error={!!errors.startDate} />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('createChallenge.endDate')}
          </label>
          <Input type="date" {...register('endDate')} error={!!errors.endDate} />
          {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>}
        </div>
      </div>
    </GlassCard>
  );
};

const GoalsStep = ({ form }: StepProps) => {
  const { t } = useTranslation();
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <GlassCard className="p-4">
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        {t('createChallenge.goalsRequired')}
      </p>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('createChallenge.distanceTarget')}
          </label>
          <Input
            type="number"
            step="0.1"
            min="0"
            {...register('distanceTarget')}
            error={!!errors.distanceTarget}
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
          <Input
            type="number"
            step="1"
            min="0"
            {...register('elevationTarget')}
            placeholder={t('createChallenge.elevationPlaceholder')}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('createChallenge.activityType')}
          </label>
          <Select {...register('activityType')}>
            <option value="">{t('createChallenge.allActivities')}</option>
            <option value="Run">{t('createChallenge.activityRun')}</option>
            <option value="Ride">{t('createChallenge.activityRide')}</option>
            <option value="Swim">{t('createChallenge.activitySwim')}</option>
            <option value="Hike">{t('createChallenge.activityHike')}</option>
            <option value="Walk">{t('createChallenge.activityWalk')}</option>
          </Select>
        </div>
      </div>
    </GlassCard>
  );
};

interface InvitesStepProps extends StepProps {
  clubId: string | undefined;
  clubMemberFriends: Friend[];
  isLoadingClub: boolean;
  friendSearch: ReturnType<typeof useFriendSearch>;
}

const InvitesStep = ({
  form,
  clubId,
  clubMemberFriends,
  isLoadingClub,
  friendSearch,
}: InvitesStepProps) => {
  const { t } = useTranslation();
  const { control } = form;
  const {
    searchQuery,
    setSearchQuery,
    isLoading: isLoadingFriends,
    combineWithSelected,
  } = friendSearch;

  return (
    <GlassCard className="p-4">
      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
        {clubId
          ? t('createChallenge.clubMembersDescription')
          : t('createChallenge.inviteDescription')}
      </p>
      <div className="mb-4">
        <Input
          type="text"
          placeholder={t('createChallenge.searchUsers')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Controller
        name="invitedUserIds"
        control={control}
        render={({ field }) => (
          <FriendSelector
            selectedFriendIds={field.value}
            onSelectionChange={field.onChange}
            friends={clubId ? clubMemberFriends : combineWithSelected(field.value)}
            isLoading={clubId ? isLoadingClub : isLoadingFriends}
            showSearch={false}
            searchQuery={searchQuery}
          />
        )}
      />
    </GlassCard>
  );
};

const TypeCard = ({
  active,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      'rounded-lg border-2 p-4 text-left transition-all',
      active
        ? 'border-strava-orange bg-orange-50 dark:bg-orange-950/30'
        : 'border-gray-200 bg-white/50 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-gray-700'
    )}
  >
    {icon}
    <div className="font-mono text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-50">
      {title}
    </div>
    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</div>
  </button>
);

/**
 * Inline conversion card shown when the user has invited 3+ friends to a
 * challenge that isn't already attached to a club. Soft prompt — never blocks
 * the create flow. "Save as club" hands the selected ids to /clubs/create.
 */
const SaveCrewAsClubNudge = ({
  selectedIds,
  onCreate,
  onDismiss,
}: {
  selectedIds: number[];
  onCreate: (ids: number[]) => void;
  onDismiss: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        backgroundImage:
          'linear-gradient(135deg, rgba(252, 76, 2, 0.12), rgba(168, 85, 247, 0.08))',
        border: '1px solid rgba(252, 76, 2, 0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-strava-orange">
          <Sparkles size={18} strokeWidth={2} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            {t('createChallenge.nudge.title')}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-700 dark:text-gray-300">
            {t('createChallenge.nudge.description')}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t('common.cancel')}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ×
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onCreate(selectedIds)}
          className="flex-1 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-orange-500/25 ring-1 ring-orange-500/30 transition-all hover:from-orange-500 hover:to-orange-700"
        >
          {t('createChallenge.nudge.confirm')}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex-1 rounded-full px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {t('createChallenge.nudge.dismiss')}
        </button>
      </div>
    </div>
  );
};
