import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Camera, ChevronRight, MessageCircle, Sparkles, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { GlassCard } from '@components/ui';
import { formatDistance, formatDuration, formatPaceFromSpeed, formatSpeed } from '@utils/format';
import { getSportPresentation } from '@utils/sport';
import type { FeedEvent, ActivityPostedMetadata, FeedEventCompare } from '@types';
import { FeedEventHeader } from './FeedEventHeader';
import { PolylinePreview } from './PolylinePreview';
import { KudosBlock } from './KudosBlock';
import { PhotoStrip } from './PhotoStrip';
import { pickVibe, type Vibe } from '../vibes';

const PACE_TYPES = new Set(['Run', 'TrailRun', 'Walk', 'Hike']);

/**
 * Card layout principles:
 *   - **Activity-type colour drives icon chip + hero stat** (via the shared
 *     `getSportPresentation` from utils/sport.ts — same source as
 *     `ActivityCard` and `ActivityTypePicker`, so a Ride looks blue here too).
 *   - PR badge + compare block stay Strava-orange (Kompanion accents, not
 *     tied to activity type).
 *   - Every stat tile shares the same chrome. The hero is set apart by the
 *     type-specific colour + bold weight, not a different background.
 *   - Vertical spacing alone carries section rhythm (no dividers).
 *   - The polyline lives behind everything at ~10% opacity, using
 *     `currentColor` so it works in light + dark mode without per-type tint.
 */
export const ActivityPostedCard = ({ event }: { event: FeedEvent }) => {
  const { t } = useTranslation();
  const meta = event.metadata as unknown as ActivityPostedMetadata | null;
  if (!meta) return null;

  const presentation = getSportPresentation(meta.type);
  const activityHref = event.entityId ? `/activities/${event.entityId}` : undefined;
  const snapshot = event.activity;
  const hasPr = (snapshot?.prCount ?? 0) > 0;

  const heroMetricIsPace = PACE_TYPES.has(meta.type);
  const heroValue = heroMetricIsPace
    ? formatPaceFromSpeed(meta.averageSpeed)
    : formatSpeed(meta.averageSpeed);
  const heroLabel = heroMetricIsPace ? t('feed.stats.avgPace') : t('common.avgSpeed');

  const vibe = pickVibe(meta, snapshot, event.createdAt, event.entityId ?? event.id);

  return (
    <GlassCard
      className={clsx(
        'relative overflow-hidden p-4',
        hasPr && 'ring-1 ring-strava-orange/30 dark:ring-strava-orange/40'
      )}
    >
      {snapshot?.summaryPolyline && (
        <PolylinePreview
          encoded={snapshot.summaryPolyline}
          // Apply the activity-type text colour to the SVG so the path's
          // `stroke="currentColor"` resolves to it. Coloured strokes look
          // muted at the same opacity as gray, so we bump it slightly.
          className={clsx(
            'pointer-events-none absolute inset-0 h-full w-full opacity-[0.14] dark:opacity-[0.22]',
            presentation.textColor
          )}
          stroke="currentColor"
          strokeWidth={1.2}
          viewBox="0 0 100 100"
        />
      )}

      <div className="relative space-y-3">
        <FeedEventHeader
          actor={event.actor}
          createdAt={event.createdAt}
          icon={presentation.icon}
          iconClass={presentation.tint}
        />

        <div>
          <div className="flex items-center gap-2">
            {activityHref ? (
              <Link to={activityHref} className="block min-w-0 hover:opacity-80">
                <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-50">
                  {meta.name}
                </h3>
              </Link>
            ) : (
              <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-50">
                {meta.name}
              </h3>
            )}
            {hasPr && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-strava-orange/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-strava-orange ring-1 ring-strava-orange/30">
                <Trophy size={11} strokeWidth={2.5} aria-hidden="true" />
                {t('feed.stats.prBadge', { count: snapshot!.prCount })}
              </span>
            )}
          </div>
          {vibe && <VibeChip vibe={vibe} />}
        </div>

        {/* All four tiles share chrome. Hero is set apart by type-coloured
            value + bold weight, not a different background — keeps the row
            in harmony with the icon chip above (same colour family). */}
        <div className="grid grid-cols-4 gap-2">
          <Stat label={heroLabel} value={heroValue} heroColor={presentation.textColor} />
          <Stat label={t('common.distance')} value={formatDistance(meta.distance)} />
          <Stat label={t('common.duration')} value={formatDuration(meta.movingTime)} />
          <Stat
            label={t('common.elevation')}
            value={`${Math.round(meta.totalElevationGain).toLocaleString()} m`}
          />
        </div>

        {snapshot && snapshot.photos.length > 0 && (
          <PhotoStrip photos={snapshot.photos} totalCount={snapshot.photoCount} />
        )}

        {snapshot && <EngagementFooter snapshot={snapshot} />}

        {event.compare && <CompareBlock compare={event.compare} />}

        {activityHref && (
          <div className="flex justify-end">
            <Link
              to={activityHref}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-strava-orange hover:underline"
            >
              {t('feed.viewActivity')}
              <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

const EngagementFooter = ({ snapshot }: { snapshot: NonNullable<FeedEvent['activity']> }) => {
  const { kudosCount, commentCount } = snapshot;
  if (kudosCount === 0 && commentCount === 0) {
    return null;
  }
  return (
    <div className="flex items-center gap-3">
      {kudosCount > 0 && <KudosBlock count={kudosCount} compact />}
      {commentCount > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <MessageCircle size={14} strokeWidth={2.25} aria-hidden="true" />
          <span className="tabular-nums">{commentCount > 99 ? '99+' : commentCount}</span>
        </span>
      )}
      {/* Defensive: photo count when PhotoStrip didn't render (no urls). */}
      {snapshot.photoCount > 0 && snapshot.photos.length === 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Camera size={14} strokeWidth={2.25} aria-hidden="true" />
          <span className="tabular-nums">{snapshot.photoCount}</span>
        </span>
      )}
    </div>
  );
};

const CompareBlock = ({ compare }: { compare: FeedEventCompare }) => {
  const { t } = useTranslation();
  const { yourBest, paceDeltaSecondsPerKm } = compare;
  const absDelta = Math.abs(paceDeltaSecondsPerKm);
  const deltaLabel = formatPaceDelta(absDelta);
  const isFriendFaster = paceDeltaSecondsPerKm < 0;

  let headline: string;
  if (absDelta < 5) {
    headline = t('feed.compare.matched', { delta: deltaLabel });
  } else if (isFriendFaster) {
    headline = t('feed.compare.friendFaster', { delta: deltaLabel });
  } else {
    headline = t('feed.compare.youFaster', { delta: deltaLabel });
  }

  return (
    <Link
      to={`/activities/${yourBest.activityId}`}
      className="block rounded-xl bg-strava-orange/5 p-3 ring-1 ring-strava-orange/20 transition-colors hover:bg-strava-orange/10"
    >
      <div className="flex items-start gap-2">
        <Sparkles
          size={14}
          strokeWidth={2.25}
          className="mt-0.5 shrink-0 text-strava-orange"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-snug text-gray-900 dark:text-gray-50">
            {headline}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
            {t('feed.compare.yourBest', {
              name: yourBest.name,
              distance: formatDistance(yourBest.distance),
              duration: formatDuration(yourBest.movingTime),
            })}
          </p>
        </div>
      </div>
    </Link>
  );
};

/**
 * Tiny "personality" tag right under the title. Fires only when an activity
 * has something genuinely notable about it (see `pickVibe`).
 */
const VibeChip = ({ vibe }: { vibe: Vibe }) => {
  const { t } = useTranslation();
  return (
    <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">
      <vibe.icon size={12} strokeWidth={2.25} aria-hidden="true" />
      <span>{t(vibe.key)}</span>
    </p>
  );
};

function formatPaceDelta(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}/km` : `${s}s/km`;
}

/**
 * Stat tile — identical chrome for every metric. The hero tile is set apart
 * only by `heroColor` (typically the activity-type colour) + bold weight;
 * everything else stays uniform.
 */
const Stat = ({
  label,
  value,
  heroColor,
}: {
  label: string;
  value: string;
  /** When provided, applies these classes to the value and uses bold weight. */
  heroColor?: string;
}) => (
  <div className="rounded-xl bg-white/40 px-2 py-2 text-center dark:bg-gray-900/40">
    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p
      className={clsx(
        'mt-0.5 font-mono text-sm tabular-nums',
        heroColor ? clsx('font-bold', heroColor) : 'font-semibold text-gray-900 dark:text-gray-50'
      )}
    >
      {value}
    </p>
  </div>
);
