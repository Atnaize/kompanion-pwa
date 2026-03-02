import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <EmptyState
      icon="🏃"
      title={t('empty.noActivities')}
      description={t('empty.noActivitiesDesc')}
      action={{
        label: t('empty.syncActivities'),
        onClick: onSync,
      }}
    />
  );
};

export const NoAchievementsEmpty = () => {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon="🏆"
      title={t('empty.noAchievements')}
      description={t('empty.noAchievementsDesc')}
    />
  );
};

export const NoStatsEmpty = ({ onSync }: { onSync: () => void }) => {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon="📊"
      title={t('empty.noStats')}
      description={t('empty.noStatsDesc')}
      action={{
        label: t('empty.syncActivities'),
        onClick: onSync,
      }}
    />
  );
};
