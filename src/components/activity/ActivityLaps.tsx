import { useMemo } from 'react';
import type { ActivityLap } from '@types';
import { formatDistance, formatDuration, formatPaceFromSpeed, formatSpeed } from '@utils/format';

interface ActivityLapsProps {
  laps: ActivityLap[];
  showPace?: boolean;
}

export const ActivityLaps = ({ laps, showPace = false }: ActivityLapsProps) => {
  const { maxSpeed, maxHr } = useMemo(() => {
    let ms = 0;
    let mh = 0;
    for (const l of laps) {
      if (l.average_speed > ms) ms = l.average_speed;
      if (l.average_heartrate && l.average_heartrate > mh) mh = l.average_heartrate;
    }
    return { maxSpeed: ms, maxHr: mh };
  }, [laps]);

  if (laps.length === 0) {
    return (
      <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
        No lap data available
      </div>
    );
  }

  const hasHr = laps.some((l) => l.average_heartrate);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="grid grid-cols-12 gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400">
        <div className="col-span-1">#</div>
        <div className="col-span-3">Distance</div>
        <div className="col-span-3">Time</div>
        <div className="col-span-3">{showPace ? 'Pace' : 'Speed'}</div>
        <div className="col-span-2 text-right">{hasHr ? 'HR' : 'Elev'}</div>
      </div>
      <div>
        {laps.map((lap) => {
          const speedPct = maxSpeed > 0 ? (lap.average_speed / maxSpeed) * 100 : 0;
          return (
            <div
              key={lap.id}
              className="relative grid grid-cols-12 items-center gap-2 border-b border-gray-100 px-3 py-2.5 text-sm last:border-b-0 dark:border-gray-800"
            >
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/40"
                style={{ width: `${speedPct}%` }}
                aria-hidden
              />
              <div className="relative col-span-1 font-semibold text-gray-900 dark:text-gray-50">{lap.lap_index}</div>
              <div className="relative col-span-3 text-gray-900 dark:text-gray-50">
                {formatDistance(lap.distance)}
              </div>
              <div className="relative col-span-3 tabular-nums text-gray-700 dark:text-gray-300">
                {formatDuration(lap.moving_time)}
              </div>
              <div className="relative col-span-3 tabular-nums text-gray-700 dark:text-gray-300">
                {showPace ? formatPaceFromSpeed(lap.average_speed) : formatSpeed(lap.average_speed)}
              </div>
              <div className="relative col-span-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                {hasHr && lap.average_heartrate ? (
                  <span
                    className={
                      maxHr && lap.average_heartrate === maxHr
                        ? 'font-semibold text-red-600'
                        : undefined
                    }
                  >
                    {Math.round(lap.average_heartrate)}
                  </span>
                ) : (
                  `${Math.round(lap.total_elevation_gain)}m`
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
