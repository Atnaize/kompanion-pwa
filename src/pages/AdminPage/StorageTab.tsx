import { GlassCard } from '@components/ui';

export const StorageTab = () => (
  <GlassCard className="p-4">
    <h2 className="mb-3 text-lg font-semibold text-gray-900">Local Storage</h2>
    <div className="space-y-2 text-sm">
      <StorageEntry label="Access Token:" value={localStorage.getItem('access_token')} />
      <StorageEntry label="Refresh Token:" value={localStorage.getItem('refresh_token')} />
    </div>
  </GlassCard>
);

const StorageEntry = ({ label, value }: { label: string; value: string | null }) => (
  <div>
    <span className="font-medium text-gray-600">{label}</span>
    <p className="mt-1 break-all rounded bg-gray-100 p-2 font-mono text-xs">
      {value ? `${value.substring(0, 50)}...` : '—'}
    </p>
  </div>
);
