import { Layout } from '@components/layout';
import { GlassCard } from '@components/ui';
import { questsService } from '@api/services';
import { useAsync } from '@hooks/useAsync';
import type { Quest } from '@app-types/index';

export const QuestsPage = () => {
  const { data: quests, isLoading } = useAsync<Quest[]>(async () => {
    const response = await questsService.list();
    return response.data || [];
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
          <div className="py-12 text-center text-gray-600">Loading quests...</div>
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
                        {quest.objectives.map((objective) => (
                          <div key={objective.id}>
                            <div className="mb-2 flex justify-between text-sm">
                              <span className="text-gray-700">{objective.description}</span>
                              <span className="font-medium text-gray-900">
                                {objective.current}/{objective.target}
                              </span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-gray-200">
                              <div
                                className="h-3 rounded-full bg-gradient-to-r from-strava-orange to-strava-orange-dark transition-all duration-500"
                                style={{
                                  width: `${Math.min((objective.current / objective.target) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
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
                            <span className="text-xl">✅</span>
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

            {activeQuests.length === 0 && completedQuests.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-600">No quests available right now. Check back later!</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};
