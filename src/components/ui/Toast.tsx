import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose?: () => void;
}

const toastConfig = {
  success: {
    icon: '✓',
    iconBg: 'bg-green-500',
  },
  error: {
    icon: '✕',
    iconBg: 'bg-red-500',
  },
  info: {
    icon: 'ℹ',
    iconBg: 'bg-blue-500',
  },
};

export const Toast = ({ message, type = 'info', duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300); // Match transition duration
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) {
    return null;
  }

  const config = toastConfig[type];

  return (
    <div
      className={clsx(
        'flex items-center gap-3 rounded-2xl border border-white/20 bg-white/90 p-4 shadow-lg backdrop-blur-md',
        'transform transition-all duration-300 ease-out',
        isExiting
          ? 'opacity-0 -translate-y-8 scale-95'
          : 'opacity-100 translate-y-0 scale-100'
      )}
      role="alert"
      style={{
        animation: isExiting ? 'none' : 'slideInDown 0.3s ease-out'
      }}
    >
      <div
        className={clsx(
          'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm',
          config.iconBg
        )}
      >
        {config.icon}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-900">{message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => {
            setIsVisible(false);
            onClose?.();
          }, 200);
        }}
        className="flex-shrink-0 text-xl leading-none text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};
