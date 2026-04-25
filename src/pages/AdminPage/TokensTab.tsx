import { GlassCard, Button } from '@components/ui';
import { useTokenInfo } from './useTokenInfo';
import { StatusPill } from './StatusPill';

export const TokensTab = () => {
  const { info, loading, refresh, refreshJwt, refreshStrava } = useTokenInfo();

  return (
    <GlassCard className="p-4">
      <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">Token Information</h2>
      <div className="space-y-2">
        {info ? (
          <>
            <Row label="Expires at:">
              <span className="font-medium text-gray-900 dark:text-gray-50">
                {new Date((info.tokenExpiresAt || 0) * 1000).toLocaleString()}
              </span>
            </Row>
            <Row label="Expires in:">
              <span className={`font-medium ${info.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                {info.expiresIn}
              </span>
            </Row>
            <Row label="Status:">
              <StatusPill tone={info.isExpired ? 'danger' : 'success'}>
                {info.isExpired ? 'Expired' : 'Valid'}
              </StatusPill>
            </Row>
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button onClick={refresh} variant="secondary" disabled={loading}>
          Refresh Info
        </Button>
        <Button onClick={refreshStrava} disabled={loading}>
          Force Strava Token Refresh
        </Button>
        <Button onClick={refreshJwt} variant="secondary" disabled={loading}>
          Force JWT Refresh
        </Button>
      </div>
    </GlassCard>
  );
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-600 dark:text-gray-400">{label}</span>
    {children}
  </div>
);
