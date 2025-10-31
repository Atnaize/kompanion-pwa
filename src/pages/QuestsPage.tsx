import { useQuery } from '@tanstack/react-query';
import { Layout } from '@components/layout';
import { GlassCard, QuestCardSkeleton, NoQuestsEmpty } from '@components/ui';
import { questsService } from '@api/services';

export const QuestsPage = () => {
  const { data: quests = [], isLoading } = useQuery({
    queryKey: ['quests'],
    queryFn: async () => {
      const response = await questsService.list();
      return response.data || [];
    },
  });

  const activeQuests = quests?.filter((q) => q.status === 'active') || [];
  const completedQuests = quests?.filter((q) => q.status === 'completed') || [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quests</h2>
          <p className="text-gray-600">Complete quests to earn XP and rewards</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <QuestCardSkeleton />
            <QuestCardSkeleton />
            <QuestCardSkeleton />
          </div>
        ) : (
          <>
            {activeQuests.length > 0 && (
              <section>
                <h3 className="mb-4 text-lg font-bold text-gray-900">Active</h3>
                <div className="space-y-3">
                  {activeQuests.map((quest) => (
                    <GlassCard key={quest.id} className="p-5">
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{quest.name}</h3>
                          <p className="mt-1 text-sm text-gray-600">{quest.description}</p>
                        </div>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                          {quest.rewards.xp} XP
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {quest.objectives.map((objective) => {
                          const isCompleted = objective.completed;
                          const progress = Math.min(
                            (objective.current / objective.target) * 100,
                            100
                          );

                          return (
                            <div key={objective.id} className={isCompleted ? 'opacity-50' : ''}>
                              <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                                <div className="flex flex-1 items-center gap-2">
                                  {isCompleted && (
                                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-400 text-xs text-white">
                                      ✓
                                    </span>
                                  )}
                                  <span
                                    className={
                                      isCompleted
                                        ? 'text-gray-500 line-through'
                                        : 'font-medium text-gray-900'
                                    }
                                  >
                                    {objective.description}
                                  </span>
                                </div>
                                <span
                                  className={
                                    isCompleted
                                      ? 'font-medium text-gray-400'
                                      : 'font-bold text-gray-900'
                                  }
                                >
                                  {objective.current}/{objective.target}
                                </span>
                              </div>
                              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className={`h-3 rounded-full transition-all duration-500 ${
                                    isCompleted
                                      ? 'bg-gradient-to-r from-gray-300 to-gray-400'
                                      : 'bg-gradient-to-r from-strava-orange to-strava-orange-dark'
                                  }`}
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 border-t border-gray-200 pt-4 text-xs text-gray-500">
                        Ends {new Date(quest.endDate).toLocaleDateString()}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </section>
            )}

            {completedQuests.length > 0 && (
              <section>
                <h3 className="mb-4 text-lg font-bold text-gray-900">Completed</h3>
                <div className="space-y-3">
                  {completedQuests.map((quest) => (
                    <GlassCard key={quest.id} className="p-5 opacity-75">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{quest.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600">{quest.description}</p>
                        </div>
                        <span className="text-sm font-medium text-green-600">
                          +{quest.rewards.xp} XP
                        </span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </section>
            )}

            {activeQuests.length === 0 && completedQuests.length === 0 && <NoQuestsEmpty />}
          </>
        )}
      </div>
    </Layout>
  );
};
