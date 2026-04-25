import { ReactNode } from 'react';
import clsx from 'clsx';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const GlassCard = ({ children, className, onClick, hover = false }: GlassCardProps) => {
  return (
    <div
      className={clsx(
        'rounded-2xl bg-white/80 shadow-lg backdrop-blur-md dark:bg-gray-900/70 dark:shadow-black/30',
        'border border-white/20 dark:border-gray-700/40',
        hover && 'transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
