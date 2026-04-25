import { useEffect, useMemo, useState } from 'react';
import { Button, GlassCard } from '@components/ui';
import { apiClient } from '@api/client';
import { useToastStore } from '@store/toastStore';

interface LocalSubscription {
  id: number;
  stravaId: number | null;
  callbackUrl: string;
  verifyToken: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface StravaSubscription {
  id: number;
  callback_url: string;
  created_at: string;
  updated_at: string;
}

interface DiagnosticsData {
  env: {
    nodeEnv: string;
    isVercel: boolean;
    vercelEnv: string | null;
    allowedOrigins: string[];
    stravaClientId: string;
    stravaApiUrl: string;
  };
  localSubscriptions: LocalSubscription[];
}

interface StatusData {
  strava: StravaSubscription[] | { error: string };
  local: LocalSubscription | null;
}

interface ProcessingLogEntry {
  ts: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface WebhookEvent {
  id: string;
  objectType: string;
  objectId: string;
  aspectType: string;
  ownerId: string;
  subscriptionId: number;
  eventTime: string;
  updates: Record<string, string> | null;
  rawPayload: Record<string, unknown>;
  source: string;
  receivedAt: string;
  status: string;
  error: string | null;
  attempts: number;
  processedAt: string | null;
  processingLog: ProcessingLogEntry[] | null;
}

export const WebhooksTab = () => {
  return (
    <div className="space-y-4">
      <DiagnosticsSection />
      <SubscribeSection />
      <SimulateSection />
      <EventsSection />
    </div>
  );
};

// ─── Diagnostics + Strava status ─────────────────────────────────────────────

const DiagnosticsSection = () => {
  const { error: showError } = useToastStore();
  const [diag, setDiag] = useState<DiagnosticsData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        apiClient.get<DiagnosticsData>('/admin/webhooks/diagnostics'),
        apiClient.get<StatusData>('/admin/webhooks/status'),
      ]);
      if (d.success && d.data) setDiag(d.data);
      if (s.success && s.data) setStatus(s.data);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Diagnostics & Status</h2>
        <Button onClick={refresh} variant="secondary" size="sm" disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {diag && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3 font-mono text-xs dark:bg-gray-950">
          <KV k="NODE_ENV" v={diag.env.nodeEnv} />
          <KV k="VERCEL" v={diag.env.isVercel ? `yes (${diag.env.vercelEnv ?? '?'})` : 'no'} />
          <KV k="STRAVA_CLIENT_ID" v={diag.env.stravaClientId} />
          <KV k="STRAVA_API_URL" v={diag.env.stravaApiUrl} />
          <KV k="ALLOWED_ORIGINS" v={diag.env.allowedOrigins.join(', ')} />
        </div>
      )}

      <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Active subscription on Strava</h3>
      {!status ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">Loading…</p>
      ) : Array.isArray(status.strava) ? (
        status.strava.length === 0 ? (
          <p className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
            No active Strava subscription. Use the &quot;Subscribe&quot; section below.
          </p>
        ) : (
          status.strava.map((sub) => (
            <div key={sub.id} className="mb-2 rounded-lg bg-green-50 p-3 font-mono text-xs">
              <KV k="id" v={String(sub.id)} />
              <KV k="callback_url" v={sub.callback_url} />
              <KV k="created_at" v={sub.created_at} />
              <KV k="updated_at" v={sub.updated_at} />
            </div>
          ))
        )
      ) : (
        <p className="rounded-lg bg-red-50 p-3 text-xs text-red-800">
          Strava query failed: {status.strava.error}
        </p>
      )}

      <h3 className="mb-2 mt-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Local subscription history</h3>
      {!diag || diag.localSubscriptions.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">No local subscription records.</p>
      ) : (
        <div className="space-y-2">
          {diag.localSubscriptions.map((sub) => (
            <div key={sub.id} className="rounded-lg bg-gray-50 p-3 font-mono text-xs dark:bg-gray-950">
              <KV k="local id" v={String(sub.id)} />
              <KV k="strava id" v={sub.stravaId !== null ? String(sub.stravaId) : '—'} />
              <KV k="status" v={sub.status} />
              <KV k="callback_url" v={sub.callbackUrl} />
              <KV k="verify_token" v={sub.verifyToken} />
              <KV k="created" v={sub.createdAt} />
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
};

// ─── Subscribe / Unsubscribe ─────────────────────────────────────────────────

const defaultCallbackUrl = (): string => {
  // VITE_API_URL on prod points to the deployed API; locally it's localhost:3000/api
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
  // Strip trailing slash, ensure absolute URL preferred
  if (base.startsWith('http')) {
    return `${base.replace(/\/$/, '')}/webhooks/strava`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${base.replace(/\/$/, '')}/webhooks/strava`;
  }
  return `${base.replace(/\/$/, '')}/webhooks/strava`;
};

const generateVerifyToken = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

const SubscribeSection = () => {
  const { success, error: showError } = useToastStore();
  const [callbackUrl, setCallbackUrl] = useState(defaultCallbackUrl());
  const [verifyToken, setVerifyToken] = useState(generateVerifyToken());
  const [loading, setLoading] = useState(false);
  const [unsubId, setUnsubId] = useState('');
  const [lastResult, setLastResult] = useState<unknown>(null);

  const subscribe = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const response = await apiClient.post('/admin/webhooks/subscribe', {
        callbackUrl,
        verifyToken,
      });
      setLastResult(response);
      if (response.success) {
        success('Subscribed. Strava confirmed the handshake.');
      } else {
        showError(response.error || 'Subscribe failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Subscribe failed';
      setLastResult({ error: message });
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const response = await apiClient.delete(
        `/admin/webhooks/subscribe/${encodeURIComponent(unsubId)}`
      );
      setLastResult(response);
      if (response.success) {
        success(`Unsubscribed Strava subscription ${unsubId}`);
        setUnsubId('');
      } else {
        showError(response.error || 'Unsubscribe failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unsubscribe failed';
      setLastResult({ error: message });
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-4">
      <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">Subscribe / Unsubscribe</h2>
      <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
        Strava only allows one webhook subscription per app. The callback URL must be reachable from
        the public internet (use ngrok or a public deploy).
      </p>

      <Field label="Callback URL">
        <input
          type="text"
          value={callbackUrl}
          onChange={(e) => setCallbackUrl(e.target.value)}
          className="w-full rounded border border-gray-300 px-2 py-1 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
        />
      </Field>

      <Field label="Verify Token">
        <div className="flex gap-2">
          <input
            type="text"
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value)}
            className="flex-1 rounded border border-gray-300 px-2 py-1 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <Button
            type="button"
            onClick={() => setVerifyToken(generateVerifyToken())}
            variant="secondary"
            size="sm"
          >
            Generate
          </Button>
        </div>
      </Field>

      <Button
        onClick={subscribe}
        variant="primary"
        className="mt-2 w-full"
        disabled={loading || !callbackUrl || !verifyToken}
      >
        {loading ? 'Working…' : 'Subscribe'}
      </Button>

      <hr className="my-4 border-gray-200 dark:border-gray-800" />

      <Field label="Unsubscribe by Strava ID">
        <div className="flex gap-2">
          <input
            type="number"
            value={unsubId}
            onChange={(e) => setUnsubId(e.target.value)}
            placeholder="e.g. 12345"
            className="flex-1 rounded border border-gray-300 px-2 py-1 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <Button
            type="button"
            onClick={unsubscribe}
            variant="secondary"
            size="sm"
            disabled={loading || !unsubId}
          >
            Unsubscribe
          </Button>
        </div>
      </Field>

      {!!lastResult && (
        <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-[11px] text-green-200">
          {JSON.stringify(lastResult, null, 2)}
        </pre>
      )}
    </GlassCard>
  );
};

// ─── Simulate ────────────────────────────────────────────────────────────────

const SimulateSection = () => {
  const { success, error: showError } = useToastStore();
  const [objectType, setObjectType] = useState<'activity' | 'athlete'>('activity');
  const [aspectType, setAspectType] = useState<'create' | 'update' | 'delete'>('create');
  const [objectId, setObjectId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [updatesJson, setUpdatesJson] = useState('{}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const submit = async () => {
    setLoading(true);
    setResult(null);
    try {
      let updates: Record<string, string> = {};
      try {
        updates = JSON.parse(updatesJson || '{}');
      } catch {
        showError('Updates must be valid JSON');
        return;
      }
      const payload = {
        object_type: objectType,
        object_id: parseInt(objectId, 10),
        aspect_type: aspectType,
        updates,
        owner_id: parseInt(ownerId, 10),
        subscription_id: 0,
        event_time: Math.floor(Date.now() / 1000),
      };
      const response = await apiClient.post('/admin/webhooks/simulate', payload);
      setResult(response);
      if (response.success) {
        success('Simulated event processed');
      } else {
        showError(response.error || 'Simulate failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Simulate failed';
      setResult({ error: message });
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-4">
      <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-50">Simulate Event</h2>
      <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
        Inject a synthetic webhook event into the same processing pipeline (no Strava round-trip).
        Useful to test handlers locally without an active subscription.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Object Type">
          <select
            value={objectType}
            onChange={(e) => setObjectType(e.target.value as 'activity' | 'athlete')}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="activity">activity</option>
            <option value="athlete">athlete</option>
          </select>
        </Field>
        <Field label="Aspect Type">
          <select
            value={aspectType}
            onChange={(e) => setAspectType(e.target.value as 'create' | 'update' | 'delete')}
            className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="delete">delete</option>
          </select>
        </Field>
        <Field label="Object ID (activity ID)">
          <input
            type="number"
            value={objectId}
            onChange={(e) => setObjectId(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 font-mono text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            placeholder="18216388859"
          />
        </Field>
        <Field label="Owner ID (Strava athlete ID)">
          <input
            type="number"
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="w-full rounded border border-gray-300 px-2 py-1 font-mono text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            placeholder="29120080"
          />
        </Field>
      </div>

      <Field label="Updates (JSON)">
        <textarea
          value={updatesJson}
          onChange={(e) => setUpdatesJson(e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-300 px-2 py-1 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
          placeholder='{"title": "New name"}'
        />
      </Field>

      <Button
        onClick={submit}
        variant="primary"
        className="mt-2 w-full"
        disabled={loading || !objectId || !ownerId}
      >
        {loading ? 'Processing…' : 'Send Simulated Event'}
      </Button>

      {!!result && (
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-[11px] text-green-200">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </GlassCard>
  );
};

// ─── Events list ─────────────────────────────────────────────────────────────

const EventsSection = () => {
  const { success, error: showError } = useToastStore();
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [selected, setSelected] = useState<WebhookEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${encodeURIComponent(filter)}` : '';
      const response = await apiClient.get<WebhookEvent[]>(`/admin/webhooks/events${params}`);
      if (response.success && response.data) setEvents(response.data);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [filter]);

  const retry = async (id: string) => {
    setRetrying(id);
    try {
      const response = await apiClient.post<WebhookEvent>(`/admin/webhooks/events/${id}/retry`);
      if (response.success && response.data) {
        success(`Retried — status: ${response.data.status}`);
        if (selected?.id === id) setSelected(response.data);
        await refresh();
      } else {
        showError(response.error || 'Retry failed');
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setRetrying(null);
    }
  };

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const e of events) byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
    return byStatus;
  }, [events]);

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Recent Events</h2>
        <Button onClick={refresh} variant="secondary" size="sm" disabled={loading}>
          {loading ? '…' : 'Refresh'}
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {['', 'pending', 'processing', 'processed', 'failed', 'skipped'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded px-2 py-1 text-xs ${
              filter === s ? 'bg-strava-orange text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {s || 'all'}
            {!!counts[s] && filter !== s && (
              <span className="ml-1 text-gray-500 dark:text-gray-400">({counts[s]})</span>
            )}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">No events.</p>
      ) : (
        <div className="space-y-1">
          {events.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelected(e)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-900/50"
            >
              <StatusBadge status={e.status} />
              <span className="font-mono text-gray-500 dark:text-gray-400">{shortTime(e.receivedAt)}</span>
              <span className="font-medium text-gray-900 dark:text-gray-50">
                {e.objectType}:{e.aspectType}
              </span>
              <span className="font-mono text-gray-500 dark:text-gray-400">id={e.objectId}</span>
              <span className="font-mono text-gray-500 dark:text-gray-400">owner={e.ownerId}</span>
              {e.source === 'simulated' && (
                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] text-purple-800">
                  sim
                </span>
              )}
              {e.attempts > 1 && <span className="text-gray-500 dark:text-gray-400">×{e.attempts}</span>}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <EventDetailModal
          event={selected}
          onClose={() => setSelected(null)}
          onRetry={() => retry(selected.id)}
          retrying={retrying === selected.id}
        />
      )}
    </GlassCard>
  );
};

const EventDetailModal = ({
  event,
  onClose,
  onRetry,
  retrying,
}: {
  event: WebhookEvent;
  onClose: () => void;
  onRetry: () => void;
  retrying: boolean;
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-3xl rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {event.objectType}:{event.aspectType}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            Close
          </button>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3 font-mono text-xs dark:bg-gray-950">
          <KV k="id" v={event.id} />
          <KV k="status" v={event.status} />
          <KV k="object_id" v={event.objectId} />
          <KV k="owner_id" v={event.ownerId} />
          <KV k="event_time" v={event.eventTime} />
          <KV k="received_at" v={event.receivedAt} />
          <KV k="processed_at" v={event.processedAt ?? '—'} />
          <KV k="attempts" v={String(event.attempts)} />
          <KV k="source" v={event.source} />
          <KV k="subscription_id" v={String(event.subscriptionId)} />
        </div>

        {event.error && (
          <div className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-800">
            <strong>Error:</strong>
            <pre className="mt-1 overflow-auto whitespace-pre-wrap font-mono">{event.error}</pre>
          </div>
        )}

        <h4 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Processing log</h4>
        <pre className="mb-3 max-h-64 overflow-auto rounded-lg bg-gray-900 p-3 font-mono text-[11px] text-gray-100">
          {(event.processingLog ?? [])
            .map((entry) => `[${entry.ts}] ${entry.level.toUpperCase().padEnd(5)} ${entry.message}`)
            .join('\n') || '(empty)'}
        </pre>

        <h4 className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">Raw payload</h4>
        <pre className="max-h-64 overflow-auto rounded-lg bg-gray-100 p-3 font-mono text-[11px] text-gray-800 dark:bg-gray-800 dark:text-gray-100">
          {JSON.stringify(event.rawPayload, null, 2)}
        </pre>

        <div className="mt-4 flex gap-2">
          <Button onClick={onRetry} variant="primary" disabled={retrying}>
            {retrying ? 'Retrying…' : 'Retry'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── small helpers ───────────────────────────────────────────────────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-2">
    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>
    {children}
  </div>
);

const KV = ({ k, v }: { k: string; v: string }) => (
  <div className="flex gap-2">
    <span className="shrink-0 text-gray-500 dark:text-gray-400">{k}:</span>
    <span className="break-all text-gray-900 dark:text-gray-50">{v}</span>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    processing: 'bg-blue-100 text-blue-700',
    processed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    skipped: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
        colors[status] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      }`}
    >
      {status}
    </span>
  );
};

const shortTime = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
    2,
    '0'
  )}:${String(d.getSeconds()).padStart(2, '0')}`;
};
