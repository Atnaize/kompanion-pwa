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
          'border border-white/20 bg-white/80 text-gray-800 backdrop-blur-md hover:bg-white':
            variant === 'secondary',
          'bg-transparent text-gray-700 hover:bg-gray-100/50': variant === 'ghost',
          'px-4 py-2 text-sm': size === 'sm',
          'px-6 py-3 text-base': size === 'md',
          'px-8 py-4 text-lg': size === 'lg',
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
