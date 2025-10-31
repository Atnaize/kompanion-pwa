import { Layout } from '@components/layout';
import { Button, GlassCard, StatTile, ProgressRing, BadgeCard } from '@components/ui';
import { useToastStore } from '@store/toastStore';
import { apiClient } from '@api/client';

export const ComponentsPage = () => {
  const { success, error, info } = useToastStore();

  const testApiError = async (statusCode: number) => {
    try {
      // This will trigger a 404 error and show the friendly error message
      await apiClient.get(`/fake-endpoint-${statusCode}`);
    } catch (err) {
      // Error toast is automatically shown by API client
      console.log('Expected error caught:', err);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Component Library</h2>
          <p className="text-gray-600">Preview of all UI components</p>
        </div>

        {/* Toast Notifications */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Toast Notifications</h3>
          <GlassCard className="p-6">
            <h4 className="mb-4 font-bold text-gray-900">Manual Toasts</h4>
            <div className="mb-6 flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => success('Operation completed successfully!')}
              >
                Success Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => error('Something went wrong. Please try again.')}
              >
                Error Toast
              </Button>
              <Button variant="ghost" onClick={() => info('Here is some helpful information.')}>
                Info Toast
              </Button>
            </div>

            <h4 className="mb-4 font-bold text-gray-900">API Error Testing</h4>
            <p className="mb-3 text-sm text-gray-600">
              Test automatic error handling by triggering API errors:
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="sm" variant="secondary" onClick={() => testApiError(404)}>
                Test 404 Error
              </Button>
              <Button size="sm" variant="secondary" onClick={() => testApiError(500)}>
                Test 500 Error
              </Button>
              <Button size="sm" variant="secondary" onClick={() => testApiError(400)}>
                Test 400 Error
              </Button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Note: These trigger real API calls that will fail. Check that user-friendly error
              messages appear automatically.
            </p>
          </GlassCard>
        </section>

        {/* Buttons */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Buttons</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" size="sm">
                Small (44px min)
              </Button>
              <Button variant="primary" size="md">
                Medium (48px min)
              </Button>
              <Button variant="primary" size="lg">
                Large (52px min)
              </Button>
            </div>
            <Button variant="primary" fullWidth>
              Full Width Button
            </Button>
          </div>
        </section>

        {/* Glass Cards */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Glass Cards</h3>
          <div className="space-y-3">
            <GlassCard className="p-6">
              <h4 className="mb-2 font-bold text-gray-900">Standard Glass Card</h4>
              <p className="text-gray-600">
                This is a glassmorphism card with backdrop blur and transparency effects.
              </p>
            </GlassCard>
            <GlassCard className="p-6" hover>
              <h4 className="mb-2 font-bold text-gray-900">Hoverable Glass Card</h4>
              <p className="text-gray-600">Hover over this card to see the scale effect.</p>
            </GlassCard>
          </div>
        </section>

        {/* Stat Tiles */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Stat Tiles</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatTile icon="🏃" label="Activities" value="42" />
            <StatTile icon="📏" label="Distance" value="125 km" subValue="This week" />
            <StatTile icon="⛰️" label="Elevation" value="1,234 m" />
            <StatTile icon="🔥" label="Streak" value="7 days" subValue="Keep it up!" />
          </div>
        </section>

        {/* Progress Rings */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Progress Rings</h3>
          <div className="flex justify-around gap-6">
            <div className="text-center">
              <ProgressRing progress={25} size={100} />
              <p className="mt-2 text-sm text-gray-600">25%</p>
            </div>
            <div className="text-center">
              <ProgressRing progress={60} size={100} />
              <p className="mt-2 text-sm text-gray-600">60%</p>
            </div>
            <div className="text-center">
              <ProgressRing progress={90} size={100} />
              <p className="mt-2 text-sm text-gray-600">90%</p>
            </div>
          </div>
        </section>

        {/* Badge Cards */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Badge Cards</h3>
          <div className="grid grid-cols-2 gap-3">
            <BadgeCard
              icon="🏃"
              name="First Steps"
              description="Complete your first activity"
              rarity="common"
              unlocked
            />
            <BadgeCard
              icon="🚴"
              name="Century Cyclist"
              description="Ride 100km"
              rarity="rare"
              unlocked
            />
            <BadgeCard icon="⛰️" name="Mountain Climber" description="Climb 5000m" rarity="epic" />
            <BadgeCard
              icon="🏆"
              name="Legend"
              description="Complete 1000 activities"
              rarity="legendary"
            />
          </div>
        </section>

        {/* Colors */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Colors</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex h-20 items-center justify-center rounded-2xl bg-strava-orange font-medium text-white">
              Strava Orange
            </div>
            <div className="flex h-20 items-center justify-center rounded-2xl bg-strava-orange-dark font-medium text-white">
              Orange Dark
            </div>
            <div className="flex h-20 items-center justify-center rounded-2xl bg-strava-orange-light font-medium text-white">
              Orange Light
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};
