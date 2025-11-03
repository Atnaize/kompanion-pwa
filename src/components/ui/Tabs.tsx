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
}

export const TabList = ({ children, className }: TabListProps) => {
  return <div className={clsx('flex gap-2', className)}>{children}</div>;
};

interface TabProps {
  value: string;
  label: string;
  count?: number;
  className?: string;
}

export const Tab = ({ value, label, count, className }: TabProps) => {
  const { activeTab, onChange } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => onChange(value)}
      className={clsx(
        'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all',
        isActive
          ? 'bg-gradient-to-br from-strava-orange to-orange-600 text-white shadow-lg'
          : 'bg-white/50 text-gray-700 backdrop-blur-sm hover:bg-white/80',
        className
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={clsx(
            'ml-1.5 rounded-full px-1.5 py-0.5 text-xs',
            isActive ? 'bg-white/20' : 'bg-orange-100 text-orange-700'
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
