import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  personalRecordsService,
  type PersonalRecordsBacklogEvent,
  type PersonalRecordsPausedReason,
} from '@api/services';
import { useToastStore } from '@store/toastStore';

export interface PRSyncState {
  isSyncing: boolean;
  current: number;
  total: number;
  paused: boolean;
  pausedReason: PersonalRecordsPausedReason | null;
}

const INITIAL: PRSyncState = {
  isSyncing: false,
  current: 0,
  total: 0,
  paused: false,
  pausedReason: null,
};

export const usePersonalRecordsSync = (): {
  state: PRSyncState;
  start: () => Promise<void>;
} => {
  const [state, setState] = useState<PRSyncState>(INITIAL);
  const queryClient = useQueryClient();
  const { error: toastError } = useToastStore();

  const start = useCallback(async () => {
    setState({ ...INITIAL, isSyncing: true });

    let lastInvalidate = 0;
    const maybeInvalidate = (): void => {
      const now = Date.now();
      if (now - lastInvalidate >= 1000) {
        lastInvalidate = now;
        void queryClient.invalidateQueries({ queryKey: ['personal-records'] });
      }
    };

    try {
      await personalRecordsService.processStream((event: PersonalRecordsBacklogEvent) => {
        if (event.type === 'processing') {
          setState((s) => ({
            ...s,
            current: event.current ?? s.current,
            total: event.total ?? s.total,
          }));
          maybeInvalidate();
        } else if (event.type === 'paused') {
          setState((s) => ({
            ...s,
            isSyncing: false,
            current: event.current ?? s.current,
            total: event.total ?? s.total,
            paused: true,
            pausedReason: event.reason ?? 'strava_rate_limit',
          }));
        } else if (event.type === 'complete') {
          setState((s) => ({
            ...s,
            isSyncing: false,
            current: event.total ?? s.current,
            total: event.total ?? s.total,
            paused: false,
            pausedReason: null,
          }));
        }
      });
    } catch (err) {
      setState((s) => ({ ...s, isSyncing: false }));
      toastError(err instanceof Error ? err.message : 'Failed to analyse personal records');
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['personal-records'] });
      void queryClient.invalidateQueries({ queryKey: ['personal-records', 'status'] });
    }
  }, [queryClient, toastError]);

  return { state, start };
};
