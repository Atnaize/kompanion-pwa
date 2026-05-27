import { useTranslation } from 'react-i18next';
import { Activity as ActivityIcon } from 'lucide-react';
import { Avatar } from '@components/ui';
import type { DigestActivity, DigestPayload } from '@types';

interface Props {
  digest: DigestPayload;
  /** Lookup of userId → display info for stacked avatars + names. */
  participants: Record<number, { firstname: string; lastname: string; profile: string }>;
}

/**
 * "Bob, Alice +3 logged 5 runs today" card — server-grouped daily activity
 * roll-up. Replaces the previous one-activity-one-message firehose that would
 * have drowned out conversation in busy challenges. Tapping the card could
 * later deep-link into an activity list, but v1 keeps it informational.
 */
export const ActivityDigestCard = ({ digest, participants }: Props) => {
  const { t } = useTranslation();

  // Distinct contributors, in original posting order (server keeps activities
  // chronological; the first contributor for each user wins).
  const contributors = useUniqueContributors(digest.activities);
  const displayContributors = contributors.slice(0, 2);
  const extraCount = contributors.length - displayContributors.length;

  const totalDistanceMeters = digest.activities.reduce((s, a) => s + (a.distance ?? 0), 0);

  // Compose the headline: "Bob, Alice +3 logged 5 activities today".
  const names = displayContributors
    .map((id) => participants[id]?.firstname ?? 'Someone')
    .join(', ');
  const headline = t('chat.digest.headline', {
    names,
    extra: extraCount > 0 ? ` +${extraCount}` : '',
    count: digest.activities.length,
    defaultValue:
      extraCount > 0
        ? `${names} +${extraCount} logged ${digest.activities.length} activities`
        : `${names} logged ${digest.activities.length} ${digest.activities.length === 1 ? 'activity' : 'activities'}`,
  });

  return (
    <div className="rounded-2xl border border-strava-orange/20 bg-gradient-to-br from-orange-50/80 to-amber-50/40 px-3 py-2.5 dark:from-orange-950/30 dark:to-amber-950/20">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {displayContributors.map((userId) => {
            const p = participants[userId];
            return (
              <Avatar
                key={userId}
                src={p?.profile}
                firstname={p?.firstname ?? '?'}
                lastname={p?.lastname ?? ''}
                size="sm"
                className="!h-7 !w-7 ring-2 ring-white dark:ring-gray-900"
              />
            );
          })}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
            {headline}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {(totalDistanceMeters / 1000).toFixed(1)} km · {formatDigestDate(digest.date)}
          </p>
        </div>
        <ActivityIcon
          size={16}
          strokeWidth={2}
          className="shrink-0 text-strava-orange"
          aria-hidden
        />
      </div>
    </div>
  );
};

function useUniqueContributors(activities: DigestActivity[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const a of activities) {
    if (!seen.has(a.userId)) {
      seen.add(a.userId);
      out.push(a.userId);
    }
  }
  return out;
}

function formatDigestDate(date: string): string {
  // YYYY-MM-DD → localized short date. The card already implies "today" when
  // it's the latest, so just use a numeric form for everything to stay terse.
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
