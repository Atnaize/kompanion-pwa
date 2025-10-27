import { Layout } from '@components/layout';
import { Button, GlassCard, StatTile, ProgressRing, BadgeCard, Toast } from '@components/ui';
import { useState } from 'react';

export const ComponentsPage = () => {
  const [showToast, setShowToast] = useState(false);

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Component Library</h2>
          <p className="text-gray-600">Preview of all UI components</p>
        </div>

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
                Small
              </Button>
              <Button variant="primary" size="md">
                Medium
              </Button>
              <Button variant="primary" size="lg">
                Large
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

        {/* Toast */}
        <section>
          <h3 className="mb-4 text-lg font-bold text-gray-900">Toast Notifications</h3>
          <div className="flex gap-3">
            <Button onClick={() => setShowToast(true)}>Show Toast</Button>
          </div>
          {showToast && (
            <Toast
              message="This is a toast notification!"
              type="success"
              onClose={() => setShowToast(false)}
            />
          )}
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
