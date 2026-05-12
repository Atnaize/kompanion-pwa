import { Link } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';
import { Avatar } from '@components/ui';
import { formatRelativeTime } from '@utils/format';
import type { Friend } from '@types';

interface FeedEventHeaderProps {
  actor: Friend;
  createdAt: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon-chip background + text colour. */
  iconClass?: string;
}

/**
 * Shared author + timestamp + per-type icon chip for every feed card.
 * Adding a new card type = pass a different `icon` + `iconClass`; the rest
 * stays consistent.
 */
export const FeedEventHeader = ({
  actor,
  createdAt,
  icon: Icon,
  iconClass = 'bg-strava-orange/10 text-strava-orange',
}: FeedEventHeaderProps) => (
  <div className="mb-3 flex items-center gap-3">
    <Link to={`/users/${actor.id}`} className="shrink-0">
      <Avatar src={actor.profile} firstname={actor.firstname} lastname={actor.lastname} size="sm" />
    </Link>
    <div className="min-w-0 flex-1">
      <Link
        to={`/users/${actor.id}`}
        className="block truncate text-sm font-semibold text-gray-900 hover:underline dark:text-gray-50"
      >
        {actor.firstname} {actor.lastname}
      </Link>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        {formatRelativeTime(createdAt)}
      </p>
    </div>
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
      <Icon size={18} strokeWidth={2} aria-hidden="true" />
    </span>
  </div>
);
