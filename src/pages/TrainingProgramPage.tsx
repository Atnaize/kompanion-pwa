import { useState, useEffect } from 'react';
import {
  trainingService,
  type TrainingProgram,
  type TrainingWeek,
  type TrainingSession,
} from '@api/services';
import { Layout } from '@components/layout';
import clsx from 'clsx';

const getPaceBadgeColor = (pace: string): string => {
  if (pace.includes('E1')) return 'bg-blue-100 text-blue-700';
  if (pace.includes('E2')) return 'bg-green-100 text-green-700';
  if (pace.includes('VMA')) return 'bg-red-100 text-red-700';
  if (pace.includes('marathon')) return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-700';
};

const SessionCard = ({ session }: { session: TrainingWeek['sessions'][0] }) => {
  const sessionDate = new Date(session.date);
  const dayName = sessionDate.toLocaleDateString('fr-FR', { weekday: 'short' });
  const dayNumber = sessionDate.getDate();
  const month = sessionDate.toLocaleDateString('fr-FR', { month: 'short' });

  const isSpecialSession = session.length === 'marathon' || session.length === 'semi-marathon';

  return (
    <div
      className={clsx(
        'rounded-xl p-4 shadow-sm transition-all',
        isSpecialSession
          ? 'border-2 border-strava-orange bg-gradient-to-br from-strava-orange/10 to-orange-50'
          : 'border border-gray-200 bg-white'
      )}
    >
      {/* Date header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-gray-500">{dayName}</span>
          <span className="text-xl font-bold text-gray-900">{dayNumber}</span>
          <span className="text-sm text-gray-500">{month}</span>
        </div>
        {isSpecialSession && <span className="text-2xl">🏁</span>}
      </div>

      {/* Session details */}
      <div className="space-y-2">
        {/* Length */}
        {session.length && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Durée:</span>
            <span
              className={clsx(
                'font-semibold',
                isSpecialSession ? 'text-strava-orange' : 'text-gray-900'
              )}
            >
              {session.length}
            </span>
          </div>
        )}

        {/* Pace */}
        {session.pace && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Allure:</span>
            <span
              className={clsx(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                getPaceBadgeColor(session.pace)
              )}
            >
              {session.pace}
            </span>
          </div>
        )}

        {/* Extra instructions */}
        {session.extra && (
          <div className="mt-3 rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-700">{session.extra}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const WeekCard = ({
  week,
  isExpanded,
  onToggle,
  isCurrent,
}: {
  week: TrainingWeek;
  isExpanded: boolean;
  onToggle: () => void;
  isCurrent: boolean;
}) => {
  const startDate = new Date(week.start_date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
  const endDate = new Date(week.end_date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-2xl border-2 shadow-md transition-all',
        isCurrent
          ? 'border-strava-orange bg-gradient-to-br from-orange-50 to-white'
          : 'border-gray-200 bg-white',
        isExpanded && 'shadow-xl'
      )}
    >
      {/* Week header - clickable */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'flex h-12 w-12 items-center justify-center rounded-xl font-bold',
                isCurrent
                  ? 'bg-gradient-to-br from-strava-orange to-orange-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700'
              )}
            >
              {week.week}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Semaine {week.week}</h3>
              <p className="text-sm text-gray-600">
                {startDate} - {endDate}
              </p>
              <p className="text-xs text-gray-500">{week.sessions.length} séances</p>
            </div>
          </div>
        </div>
        <div className={clsx('ml-4 transition-transform', isExpanded ? 'rotate-180' : '')}>
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Week sessions - expandable */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="space-y-3">
            {week.sessions.map((session: TrainingSession, index: number) => (
              <SessionCard key={index} session={session} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const TrainingProgramPage = () => {
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [currentWeek, setCurrentWeek] = useState<TrainingWeek | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadProgram = async () => {
      try {
        setIsLoading(true);
        const [programResponse, currentWeekResponse] = await Promise.all([
          trainingService.getProgram(),
          trainingService.getCurrentWeek(),
        ]);

        if (programResponse.success && programResponse.data) {
          setProgram(programResponse.data);
        }

        if (currentWeekResponse.success && currentWeekResponse.data) {
          setCurrentWeek(currentWeekResponse.data);
          // Auto-expand current week
          setExpandedWeeks(new Set([currentWeekResponse.data.week]));
        }
      } catch (err) {
        console.error('Failed to load training program:', err);
        setError("Impossible de charger le programme d'entraînement");
      } finally {
        setIsLoading(false);
      }
    };

    loadProgram();
  }, []);

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber);
      } else {
        newSet.add(weekNumber);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-4xl">🏃</div>
            <p className="text-gray-600">Chargement du programme...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !program) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-4xl">❌</div>
            <p className="text-red-600">{error || 'Programme non trouvé'}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-strava-orange to-orange-500 p-6 text-white shadow-lg">
          <h1 className="mb-2 text-2xl font-bold">{program.title}</h1>
          <p className="mb-1 text-sm opacity-90">🎯 {program.objective}</p>
          <p className="text-sm opacity-90">
            📅{' '}
            {new Date(program.start_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="rounded-lg bg-white/20 px-3 py-1 backdrop-blur-sm">
              {program.duration_weeks} semaines
            </div>
            <div className="rounded-lg bg-white/20 px-3 py-1 backdrop-blur-sm">
              {program.total_sessions} séances
            </div>
          </div>
        </div>

        {/* Current week highlight */}
        {currentWeek && (
          <div className="mb-6 rounded-xl border-2 border-strava-orange bg-orange-50 p-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <h2 className="font-semibold text-gray-900">Semaine actuelle</h2>
                <p className="text-sm text-gray-600">
                  Semaine {currentWeek.week} • {currentWeek.sessions.length} séances
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Weeks list */}
        <div className="space-y-4">
          {program.weeks.map((week: TrainingWeek) => (
            <WeekCard
              key={week.week}
              week={week}
              isExpanded={expandedWeeks.has(week.week)}
              onToggle={() => toggleWeek(week.week)}
              isCurrent={currentWeek?.week === week.week}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};
