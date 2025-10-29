import { ReactNode, ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={clsx(
        'rounded-2xl font-medium transition-all duration-200',
        'active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        {
          'bg-strava-orange text-white shadow-md hover:bg-strava-orange-dark hover:shadow-lg':
            variant === 'primary',
          ' bg-white/90 text-gray-900 shadow-md backdrop-blur-md ring-1 ring-gray-900/5 hover:bg-white hover:shadow-lg':
            variant === 'secondary',
          'bg-transparent text-gray-700 hover:bg-gray-100/50': variant === 'ghost',
          'px-4 py-2.5 text-sm min-h-[44px]': size === 'sm',
          'px-6 py-3 text-base min-h-[48px]': size === 'md',
          'px-8 py-4 text-lg min-h-[52px]': size === 'lg',
          'w-full': fullWidth,
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
