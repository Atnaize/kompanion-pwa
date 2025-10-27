import { Layout } from '@components/layout';
import { GlassCard } from '@components/ui';

export const AboutPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">About Kompanion</h2>
          <p className="text-gray-600">Turn your workouts into epic quests</p>
        </div>

        {/* About Section */}
        <section>
          <GlassCard className="p-8 text-center">
            <div className="mb-6 text-6xl">🏃‍♂️</div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900">Kompanion</h3>
            <p className="mb-6 text-gray-600">
              Level up your workouts with gamification powered by Strava
            </p>

            <div className="mb-6 space-y-4 rounded-xl bg-white/50 p-6 text-left">
              <div>
                <h4 className="mb-2 font-bold text-gray-900">🎯 Track Progress</h4>
                <p className="text-sm text-gray-600">
                  Monitor your activities, distance, elevation, and streaks
                </p>
              </div>
              <div>
                <h4 className="mb-2 font-bold text-gray-900">🏆 Earn Achievements</h4>
                <p className="text-sm text-gray-600">
                  Unlock badges and achievements as you reach new milestones
                </p>
              </div>
              <div>
                <h4 className="mb-2 font-bold text-gray-900">📈 Level Up</h4>
                <p className="text-sm text-gray-600">
                  Gain XP and level up based on your distance, elevation, and consistency
                </p>
              </div>
              <div>
                <h4 className="mb-2 font-bold text-gray-900">🎮 Complete Quests</h4>
                <p className="text-sm text-gray-600">
                  Take on weekly and monthly challenges to earn rewards
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 text-sm text-gray-500">
              <p className="mb-2 font-medium">Version 0.1.0</p>
              <p>
                Data provided by{' '}
                <a
                  href="https://www.strava.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-strava-orange hover:underline"
                >
                  Strava
                </a>
              </p>
              <p className="mt-4 text-xs">
                Made with ❤️ for athletes who love to level up
              </p>
            </div>
          </GlassCard>
        </section>
      </div>
    </Layout>
  );
};
