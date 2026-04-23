import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { ActivityStreams } from '@types';

type MetricKey = 'heartrate' | 'watts' | 'altitude' | 'velocity_smooth' | 'cadence';

interface ActivityChartProps {
  streams: ActivityStreams;
  metric: MetricKey;
  color: string;
  label: string;
  unit: string;
  downsample?: number;
}

const pickStream = (streams: ActivityStreams, metric: MetricKey): number[] | undefined => {
  const s = streams[metric];
  return s?.data as number[] | undefined;
};

const formatXValue = (km: number) => `${km.toFixed(km < 10 ? 1 : 0)}km`;

export const ActivityChart = ({
  streams,
  metric,
  color,
  label,
  unit,
  downsample = 300,
}: ActivityChartProps) => {
  const data = useMemo(() => {
    const values = pickStream(streams, metric);
    const distanceStream = streams.distance?.data;
    if (!values || values.length === 0 || !distanceStream || distanceStream.length === 0) {
      return [];
    }
    const len = Math.min(values.length, distanceStream.length);
    const step = Math.max(1, Math.floor(len / downsample));
    const out: Array<{ x: number; v: number }> = [];
    for (let i = 0; i < len; i += step) {
      const v = values[i];
      if (typeof v !== 'number' || Number.isNaN(v)) continue;
      const x = distanceStream[i] / 1000; // meters -> km
      const display = metric === 'velocity_smooth' ? v * 3.6 : v;
      out.push({ x, v: display });
    }
    return out;
  }, [streams, metric, downsample]);

  if (data.length === 0) {
    return null;
  }

  const displayUnit = unit;
  const gradientId = `grad-${metric}`;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
        <span className="text-xs text-gray-500">{displayUnit}</span>
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXValue}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              stroke="#e5e7eb"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              stroke="#e5e7eb"
              width={36}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                fontSize: 12,
                padding: '6px 10px',
              }}
              formatter={(value: number) => [`${value.toFixed(1)} ${displayUnit}`, label]}
              labelFormatter={(km: number) => `${km.toFixed(2)} km`}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
