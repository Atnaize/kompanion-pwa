import { GlassCard, Button } from '@components/ui';
import { useApiTester, type ApiTestResult } from './useApiTester';
import { StatusPill } from './StatusPill';

const ENDPOINTS: Array<{ name: string; path: string; label: string }> = [
  { name: 'Get Me', path: '/auth/me', label: 'Test GET /auth/me' },
  { name: 'Get Debug', path: '/auth/debug', label: 'Test GET /auth/debug' },
  { name: 'Get Stats', path: '/stats', label: 'Test GET /stats' },
];

export const ApiTestsTab = () => {
  const { results, loading, run } = useApiTester();

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">API Endpoint Tests</h2>
        <div className="space-y-2">
          {ENDPOINTS.map((ep) => (
            <Button
              key={ep.name}
              onClick={() => run(ep.name, ep.path)}
              variant="secondary"
              className="w-full"
              disabled={loading}
            >
              {ep.label}
            </Button>
          ))}
        </div>
      </GlassCard>

      {Object.keys(results).length > 0 && (
        <GlassCard className="p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Test Results</h2>
          <div className="space-y-3">
            {Object.entries(results).map(([name, result]) => (
              <ResultCard key={name} name={name} result={result} />
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

const ResultCard = ({ name, result }: { name: string; result: ApiTestResult }) => {
  const dataStr = result.data ? JSON.stringify(result.data, null, 2) : '';

  return (
    <div className="rounded-lg bg-white/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-gray-900">{name}</span>
        <StatusPill tone={result.success ? 'success' : 'danger'}>
          {result.success ? 'Success' : 'Failed'}
        </StatusPill>
      </div>
      {result.error && <p className="text-xs text-red-600">Error: {result.error}</p>}
      {dataStr && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600">View Data</summary>
          <pre className="mt-2 overflow-auto rounded bg-gray-100 p-2 text-gray-900">{dataStr}</pre>
        </details>
      )}
    </div>
  );
};
