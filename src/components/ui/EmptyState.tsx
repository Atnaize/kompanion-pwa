import { ReactNode } from 'react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action, children }: EmptyStateProps) => {
  return (
    <GlassCard className="p-8 text-center">
      <div className="mb-4 text-6xl">{icon}</div>
      <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
      <p className="mb-6 text-gray-600">{description}</p>
      {action && (
        <Button onClick={action.onClick} size="md">
          {action.label}
        </Button>
      )}
      {children}
    </GlassCard>
  );
};

// Specific empty states
export const NoActivitiesEmpty = ({ onSync }: { onSync: () => void }) => {
  return (
    <EmptyState
      icon="🏃"
      title="No Activities Yet"
      description="Sync your Strava activities to start tracking your progress and unlocking achievements!"
      action={{
        label: 'Sync Activities',
        onClick: onSync,
      }}
    />
  );
};

export const NoAchievementsEmpty = () => {
  return (
    <EmptyState
      icon="🏆"
      title="No Achievements Unlocked"
      description="Keep training! Complete activities to unlock your first achievement."
    />
  );
};

export const NoStatsEmpty = ({ onSync }: { onSync: () => void }) => {
  return (
    <EmptyState
      icon="📊"
      title="No Stats Available"
      description="Sync your activities to see your performance statistics and track your progress."
      action={{
        label: 'Sync Activities',
        onClick: onSync,
      }}
    />
  );
};
