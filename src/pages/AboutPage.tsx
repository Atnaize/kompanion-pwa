import { Layout } from '@components/layout';
import { GlassCard } from '@components/ui';

export const AboutPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          About{' '}
          <span className="relative inline-block">
            Kompanion
            <span className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-transparent via-strava-orange to-transparent"></span>
          </span>
        </h2>

        <section>
          <GlassCard className="p-8 text-center">
            <div className="text-sm text-gray-500">
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

              <div className="mt-6 border-t border-gray-200 pt-6 text-sm text-gray-500"></div>

              <p className="mt-4 text-sm">Made with ❤️ for you</p>
            </div>
          </GlassCard>
        </section>
      </div>
    </Layout>
  );
};
