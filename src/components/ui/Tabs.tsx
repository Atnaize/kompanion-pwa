import { createContext, useContext, ReactNode } from 'react';
import clsx from 'clsx';

interface TabsContextValue {
  activeTab: string;
  onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component');
  }
  return context;
};

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export const Tabs = ({ value, onChange, children, className }: TabsProps) => {
  return (
    <TabsContext.Provider value={{ activeTab: value, onChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

interface TabListProps {
  children: ReactNode;
  className?: string;
  /** Wrap tabs onto multiple rows instead of horizontal scroll */
  wrap?: boolean;
  /** Show fade masks on edges as a scroll-affordance hint (ignored when wrap=true) */
  fade?: boolean;
}

export const TabList = ({ children, className, wrap = false, fade = false }: TabListProps) => {
  // White-raised iOS segmented look — the single tab style across every
  // tabbed surface (stats, challenges, friends, activity, clubs).
  const segmentedBg = 'rounded-full bg-gray-200/60 p-1 dark:bg-gray-800/60';

  if (wrap) {
    return (
      <div className={clsx('flex flex-wrap justify-center gap-1', segmentedBg, className)}>
        {children}
      </div>
    );
  }
  if (fade) {
    return (
      <div className={clsx('relative', className)}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-950"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-gray-50 to-transparent dark:from-gray-950"
        />
        <div className={clsx('no-scrollbar flex gap-1 overflow-x-auto scroll-smooth', segmentedBg)}>
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className={clsx('no-scrollbar flex gap-1 overflow-x-auto', segmentedBg, className)}>
      {children}
    </div>
  );
};

interface TabProps {
  value: string;
  label: string;
  count?: number;
  icon?: ReactNode;
  className?: string;
  /** Compact variant: smaller padding and count pill */
  compact?: boolean;
}

export const Tab = ({ value, label, count, icon, className, compact }: TabProps) => {
  const { activeTab, onChange } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => onChange(value)}
      className={clsx(
        'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors',
        compact ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-1.5 text-sm',
        isActive
          ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-50'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
        className
      )}
    >
      {icon && (
        <span className={clsx('leading-none', compact ? 'text-[14px]' : 'text-base')} aria-hidden>
          {icon}
        </span>
      )}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-0.5 text-xs tabular-nums opacity-60">{count}</span>
      )}
    </button>
  );
};

interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const TabPanel = ({ value, children, className }: TabPanelProps) => {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  return <div className={className}>{children}</div>;
};
