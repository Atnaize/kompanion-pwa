import { GlassCard } from '@components/ui';
import { ActivityChart } from '@components/activity';
import type { ActivityStreams } from '@types';

interface ChartsTabProps {
  streams: ActivityStreams;
  isFoot: boolean;
}

const CHART_CONFIGS = [
  { metric: 'altitude', label: 'Elevation', unit: 'm', color: '#16a34a' },
  { metric: 'heartrate', label: 'Heart Rate', unit: 'bpm', color: '#dc2626' },
  { metric: 'watts', label: 'Power', unit: 'W', color: '#7c3aed' },
  { metric: 'velocity_smooth', label: 'Speed', unit: 'km/h', color: '#fc4c02' },
] as const;

export const ChartsTab = ({ streams, isFoot }: ChartsTabProps) => (
  <div className="space-y-4">
    {CHART_CONFIGS.map(
      (config) =>
        streams[config.metric] && (
          <GlassCard key={config.metric} className="p-4">
            <ActivityChart
              streams={streams}
              metric={config.metric}
              label={config.label}
              unit={config.unit}
              color={config.color}
            />
          </GlassCard>
        )
    )}
    {streams.cadence && (
      <GlassCard className="p-4">
        <ActivityChart
          streams={streams}
          metric="cadence"
          label="Cadence"
          unit={isFoot ? 'spm' : 'rpm'}
          color="#0891b2"
        />
      </GlassCard>
    )}
  </div>
);
