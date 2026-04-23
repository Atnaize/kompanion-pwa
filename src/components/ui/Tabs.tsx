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
  if (wrap) {
    return (
      <div className={clsx('flex flex-wrap justify-center gap-1.5', className)}>{children}</div>
    );
  }
  if (fade) {
    return (
      <div className={clsx('relative', className)}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 bg-gradient-to-r from-gray-50 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-gray-50 to-transparent"
        />
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto scroll-smooth px-1">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className={clsx('no-scrollbar flex gap-2 overflow-x-auto', className)}>{children}</div>
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
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all',
        compact ? 'px-2.5 py-1.5 text-[13px]' : 'px-4 py-2 text-sm',
        isActive
          ? 'bg-gradient-to-br from-strava-orange to-orange-600 text-white shadow-md'
          : 'bg-white/60 text-gray-700 backdrop-blur-sm hover:bg-white/90',
        className
      )}
    >
      {icon && (
        <span
          className={clsx(
            'leading-none',
            compact ? 'text-[14px]' : 'text-base',
            isActive ? 'opacity-100' : 'opacity-80'
          )}
          aria-hidden
        >
          {icon}
        </span>
      )}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={clsx(
            'rounded-full px-1.5 text-[10px] font-semibold leading-[18px]',
            compact ? 'min-w-[18px] text-center' : 'min-w-[20px] px-2 text-xs leading-5',
            isActive ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-700'
          )}
        >
          {count}
        </span>
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
