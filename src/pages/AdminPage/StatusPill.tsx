import { ReactNode } from 'react';

export type StatusTone = 'success' | 'danger' | 'warning' | 'neutral';

const TONE_CLASSES: Record<StatusTone, string> = {
  success: 'bg-green-100 text-green-700',
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  neutral: 'bg-gray-100 text-gray-700',
};

interface StatusPillProps {
  tone: StatusTone;
  children: ReactNode;
}

export const StatusPill = ({ tone, children }: StatusPillProps) => (
  <span className={`rounded-full px-2 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>
    {children}
  </span>
);
