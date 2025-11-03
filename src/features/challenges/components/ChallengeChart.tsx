import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Challenge, ChallengeParticipant } from '@types';
import { GlassCard } from '@components/ui';

interface ChallengeChartProps {
  challenge: Challenge;
}

// Color palette for pie chart slices
const COLORS = [
  '#FF4B00', // Strava orange
  '#F97316', // Light orange
  '#FB923C', // Lighter orange
  '#FDBA74', // Pale orange
  '#FED7AA', // Very pale orange
  '#FFEDD5', // Almost white orange
];

export const ChallengeChart: React.FC<ChallengeChartProps> = ({ challenge }) => {
  const participants = challenge.participants || [];
  const activeParticipants = participants.filter((p) => p.status === 'accepted');

  if (activeParticipants.length === 0) {
    return null;
  }

  // Determine which metric to display based on challenge targets
  const hasDistance = challenge.targets.distance !== undefined;
  const hasElevation = challenge.targets.elevation !== undefined;
  const primaryMetric = hasDistance ? 'distance' : hasElevation ? 'elevation' : 'activities';

  // Prepare pie chart data
  const pieData = activeParticipants
    .map((p: ChallengeParticipant) => {
      let value: number;
      let unit: string;

      if (primaryMetric === 'distance') {
        value = Math.round(p.totalDistance / 1000); // Convert to km
        unit = 'km';
      } else if (primaryMetric === 'elevation') {
        value = Math.round(p.totalElevation);
        unit = 'm';
      } else {
        value = p.activityCount;
        unit = 'activities';
      }

      return {
        name: `${p.user.firstname} ${p.user.lastname.charAt(0)}.`,
        value,
        unit,
        fullName: `${p.user.firstname} ${p.user.lastname}`,
      };
    })
    .filter((p) => p.value > 0) // Only show participants with contributions
    .sort((a, b) => b.value - a.value);

  if (pieData.length === 0) {
    return null;
  }

  const totalValue = pieData.reduce((sum, entry) => sum + entry.value, 0);

  // Custom label renderer for pie slices
  const renderLabel = (entry: { value: number }) => {
    const percent = ((entry.value / totalValue) * 100).toFixed(0);
    return `${percent}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: { fullName: string; value: number; unit: string };
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '12px',
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: '4px' }}>{data.fullName}</p>
          <p style={{ color: '#6B7280' }}>
            {data.value} {data.unit}
          </p>
          <p style={{ color: '#6B7280' }}>
            {((data.value / totalValue) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const metricLabel =
    primaryMetric === 'distance'
      ? 'Distance'
      : primaryMetric === 'elevation'
        ? 'Elevation'
        : 'Activities';

  return (
    <GlassCard className="p-4">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">
        Contribution Breakdown ({metricLabel})
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="circle"
            formatter={(
              _value,
              entry: { payload: { name: string; value: number; unit: string } }
            ) => (
              <span style={{ color: '#374151' }}>
                {entry.payload.name} ({entry.payload.value} {entry.payload.unit})
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </GlassCard>
  );
};
