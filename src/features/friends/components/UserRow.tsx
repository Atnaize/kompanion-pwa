import { Link } from 'react-router-dom';
import { ReactNode } from 'react';
import { Avatar, GlassCard } from '@components/ui';
import type { Friend } from '@types';

interface UserRowProps {
  user: Friend;
  /** Action slot — typically a FriendActionButton or a small label. */
  action?: ReactNode;
  /** If true, clicking name/avatar navigates to /users/:id. */
  linkToProfile?: boolean;
}

/**
 * Visual row primitive for any list of users (search results, friends list,
 * pending requests). The action slot is rendered outside the link area so
 * button clicks don't trigger navigation.
 */
export const UserRow = ({ user, action, linkToProfile = true }: UserRowProps) => {
  const identity = (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Avatar src={user.profile} firstname={user.firstname} lastname={user.lastname} size="md" />
      <p className="truncate font-semibold text-gray-900 dark:text-gray-50">
        {user.firstname} {user.lastname}
      </p>
    </div>
  );

  return (
    <GlassCard className="p-3">
      <div className="flex items-center gap-3">
        {linkToProfile ? (
          <Link to={`/users/${user.id}`} className="flex min-w-0 flex-1 hover:opacity-80">
            {identity}
          </Link>
        ) : (
          identity
        )}
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </GlassCard>
  );
};
