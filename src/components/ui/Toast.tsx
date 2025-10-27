import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Toast = ({ message, type = 'info', duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={clsx(
        'fixed left-1/2 top-6 z-50 -translate-x-1/2',
        'rounded-2xl px-6 py-3 shadow-lg backdrop-blur-md',
        'animate-slide-up transition-all duration-300',
        {
          'bg-green-500/90 text-white': type === 'success',
          'bg-red-500/90 text-white': type === 'error',
          'bg-blue-500/90 text-white': type === 'info',
        }
      )}
    >
      <p className="font-medium">{message}</p>
    </div>
  );
};
