import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, GlassCard } from '@components/ui';
import { useToastStore } from '@store/toastStore';
import { adminQuotaService } from '@api/services';

interface GrantQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    userId: number;
    firstname: string;
    lastname: string;
  } | null;
}

const PRESETS = [50, 100, 500];

const endOfTodayLocalIsoMinute = (): string => {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  // toISOString returns UTC; we want a value the <input type="datetime-local">
  // accepts, which is "YYYY-MM-DDTHH:MM" in local time.
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export const GrantQuotaModal = ({ isOpen, onClose, user }: GrantQuotaModalProps) => {
  const [amount, setAmount] = useState<number>(100);
  const [customMode, setCustomMode] = useState(false);
  const [validUntil, setValidUntil] = useState<string>(endOfTodayLocalIsoMinute());
  const [note, setNote] = useState('');

  const queryClient = useQueryClient();
  const { success, error: toastError } = useToastStore();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');
      const validUntilIso = new Date(validUntil).toISOString();
      const response = await adminQuotaService.createGrant({
        userId: user.userId,
        amount,
        validUntil: validUntilIso,
        note: note.trim() || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      success(`Granted +${amount} to ${user?.firstname} ${user?.lastname}`);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'quota'] });
      onClose();
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : 'Failed to grant quota');
    },
  });

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative z-10 w-full max-w-md p-6 shadow-2xl">
        <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-gray-50">Grant PR quota</h2>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          For {user.firstname} {user.lastname}
        </p>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setCustomMode(false);
                  setAmount(n);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  !customMode && amount === n
                    ? 'bg-strava-orange text-white'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                +{n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomMode(true)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                customMode
                  ? 'bg-strava-orange text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              Custom
            </button>
          </div>
          {customMode && (
            <input
              type="number"
              min={1}
              max={10000}
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          )}
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Valid until
          </label>
          <input
            type="datetime-local"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. paying user, large history"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            className="flex-1"
            disabled={mutation.isPending || amount <= 0}
          >
            {mutation.isPending ? 'Granting…' : `Grant +${amount}`}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
