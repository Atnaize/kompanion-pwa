import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@components/ui';
import type { ActivityAthlete, ActivityComment } from '@types';
import { useSettingsStore } from '@store/settingsStore';

interface ActivityEngagementProps {
  kudoers?: ActivityAthlete[];
  comments?: ActivityComment[];
  kudosCount: number;
  commentCount: number;
  isLoading?: boolean;
}

const MAX_AVATARS = 10;
const MAX_COMMENTS_COLLAPSED = 5;

const fullName = (a: { firstname?: string; lastname?: string }) =>
  [a.firstname, a.lastname].filter(Boolean).join(' ').trim() || 'Athlete';

const formatRelative = (iso: string, locale: string): string => {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffMin < 1) return rtf.format(0, 'minute');
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return rtf.format(-diffH, 'hour');
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return rtf.format(-diffD, 'day');
  if (diffD < 30) return rtf.format(-Math.round(diffD / 7), 'week');
  if (diffD < 365) return rtf.format(-Math.round(diffD / 30), 'month');
  return rtf.format(-Math.round(diffD / 365), 'year');
};

const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <div className="mb-3 flex items-baseline gap-2">
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">{title}</h3>
    <span className="text-[11px] font-semibold tabular-nums text-gray-400 dark:text-gray-500">{count}</span>
    <span className="ml-1 h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-700" />
  </div>
);

export const ActivityEngagement = ({
  kudoers,
  comments,
  kudosCount,
  commentCount,
  isLoading,
}: ActivityEngagementProps) => {
  const { t } = useTranslation();
  const locale = useSettingsStore((s) => s.locale);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showAllKudoers, setShowAllKudoers] = useState(false);

  const actualKudoers = kudoers ?? [];
  const actualComments = comments ?? [];

  const visibleAvatars = showAllKudoers ? actualKudoers : actualKudoers.slice(0, MAX_AVATARS);
  const hiddenAvatarCount = actualKudoers.length - visibleAvatars.length;

  const visibleComments = showAllComments
    ? actualComments
    : actualComments.slice(0, MAX_COMMENTS_COLLAPSED);
  const hiddenCommentCount = actualComments.length - visibleComments.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/80 shadow-sm backdrop-blur-md dark:border-gray-700/40 dark:bg-gray-900/80">
      {/* Kudos */}
      <section className="px-5 pt-5">
        <SectionHeader title={t('activityDetail.kudos')} count={kudosCount} />

        {isLoading && actualKudoers.length === 0 ? (
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(5, Math.max(1, kudosCount)) }).map((_, i) => (
              <div key={i} className="h-9 w-9 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
            ))}
          </div>
        ) : actualKudoers.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {kudosCount > 0 ? t('activityDetail.kudosUnavailable') : t('activityDetail.noKudos')}
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleAvatars.map((a) => (
              <div key={a.id} title={fullName(a)}>
                <Avatar
                  size="sm"
                  src={a.profile_medium || a.profile}
                  firstname={a.firstname}
                  lastname={a.lastname}
                  className="h-9 w-9 ring-2 ring-white transition-transform hover:-translate-y-0.5 dark:ring-gray-900"
                />
              </div>
            ))}
            {hiddenAvatarCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllKudoers(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 ring-2 ring-white transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-900 dark:hover:bg-gray-700"
                aria-label={t('activityDetail.viewAllKudos', { count: actualKudoers.length })}
              >
                +{hiddenAvatarCount}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Comments */}
      <section className="mt-5 border-t border-gray-100 px-5 py-5 dark:border-gray-800">
        <SectionHeader title={t('activityDetail.comments')} count={commentCount} />

        {isLoading && actualComments.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: Math.min(2, Math.max(1, commentCount)) }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        ) : actualComments.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {commentCount > 0
              ? t('activityDetail.commentsUnavailable')
              : t('activityDetail.noComments')}
          </p>
        ) : (
          <ul className="space-y-3.5">
            {visibleComments.map((c) => (
              <li key={c.id} className="flex gap-3">
                <Avatar
                  size="sm"
                  src={c.athlete.profile_medium || c.athlete.profile}
                  firstname={c.athlete.firstname}
                  lastname={c.athlete.lastname}
                  className="h-8 w-8 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {fullName(c.athlete)}
                    </span>
                    <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                      {formatRelative(c.created_at, locale)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-snug text-gray-700 dark:text-gray-300">
                    {c.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {hiddenCommentCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllComments(true)}
            className="mt-3 text-xs font-medium text-strava-orange hover:underline"
          >
            {t('activityDetail.showMore', { count: hiddenCommentCount })}
          </button>
        )}
        {showAllComments && actualComments.length > MAX_COMMENTS_COLLAPSED && (
          <button
            type="button"
            onClick={() => setShowAllComments(false)}
            className="mt-3 text-xs font-medium text-gray-500 hover:underline dark:text-gray-400"
          >
            {t('activityDetail.showLess')}
          </button>
        )}
      </section>
    </div>
  );
};
