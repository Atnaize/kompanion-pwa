import { GlassCard } from './GlassCard';
import { useNavigate } from 'react-router-dom';

export interface QuestSummaryCardProps {
  activeQuestsCount: number;
}

export const QuestSummaryCard = ({ activeQuestsCount }: QuestSummaryCardProps) => {
  const navigate = useNavigate();

  return (
    <GlassCard
      className="cursor-pointer p-6 transition-transform hover:scale-[1.02]"
      onClick={() => navigate('/quests')}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="mb-1 text-lg font-bold text-gray-900">Active Quests</h3>
          <p className="text-2xl font-bold text-strava-orange">{activeQuestsCount}</p>
        </div>
        <div className="text-4xl">🎯</div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        {activeQuestsCount > 0 ? 'Tap to view your active quests →' : 'No active quests yet'}
      </div>
    </GlassCard>
  );
};
