import * as Ably from 'ably';
import { conversationsService } from './services';

/**
 * One shared Ably Realtime client for the whole app, authenticated via our
 * capability-scoped token endpoint (`POST /api/realtime/token`). The browser
 * never sees the Ably key — it only receives short-lived tokens limited to the
 * channels it may subscribe to.
 *
 * Resolves to `null` when realtime is disabled server-side (no `ABLY_API_KEY`);
 * callers then simply rely on React Query polling. A failed first probe also
 * resolves null for the session — polling keeps the app fully functional.
 */
let clientPromise: Promise<Ably.Realtime | null> | null = null;

async function fetchTokenRequest(): Promise<Ably.TokenRequest | null> {
  const res = await conversationsService.realtimeToken();
  const data = res.data;
  if (!data || !data.enabled || !data.tokenRequest) return null;
  return data.tokenRequest as Ably.TokenRequest;
}

export function getRealtimeClient(): Promise<Ably.Realtime | null> {
  if (!clientPromise) {
    clientPromise = (async () => {
      // Probe enablement once before creating a client, so a disabled server
      // doesn't trigger endless reconnect attempts.
      const initial = await fetchTokenRequest().catch(() => null);
      if (!initial) return null;
      return new Ably.Realtime({
        authCallback: (_params, callback) => {
          fetchTokenRequest()
            .then((tr) => (tr ? callback(null, tr) : callback('Realtime disabled', null)))
            .catch((err) => callback(err as string, null));
        },
      });
    })();
  }
  return clientPromise;
}
