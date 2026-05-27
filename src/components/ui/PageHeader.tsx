import type { ReactNode } from 'react';
import clsx from 'clsx';

interface PageHeaderProps {
  /** The page/section name — rendered in the mono uppercase micro-label style. */
  title: string;
  /** Optional supporting line under the title. */
  subtitle?: ReactNode;
  /** Optional trailing element (e.g. an action button) aligned to the right. */
  action?: ReactNode;
  className?: string;
}

/**
 * Standard page/section header: the mono uppercase micro-label that most
 * screens already use, extracted so the remaining big-bold titles can align
 * to one header language. Pair with an optional subtitle and a right-aligned
 * action.
 */
export const PageHeader = ({ title, subtitle, action, className }: PageHeaderProps) => {
  const heading = (
    <div className="min-w-0">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
        {title}
      </p>
      {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  );

  if (!action) {
    return <div className={className}>{heading}</div>;
  }

  return (
    <div className={clsx('flex items-start justify-between gap-3', className)}>
      {heading}
      <div className="shrink-0">{action}</div>
    </div>
  );
};
