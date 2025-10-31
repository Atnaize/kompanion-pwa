import { createContext, useContext, useState, ReactNode } from 'react';

interface SwipeContextValue {
  isSwipeBlocked: boolean;
  blockSwipe: () => void;
  unblockSwipe: () => void;
}

const SwipeContext = createContext<SwipeContextValue | undefined>(undefined);

export const SwipeProvider = ({ children }: { children: ReactNode }) => {
  const [blockCount, setBlockCount] = useState(0);

  const blockSwipe = () => {
    setBlockCount((prev) => prev + 1);
  };

  const unblockSwipe = () => {
    setBlockCount((prev) => Math.max(0, prev - 1));
  };

  const isSwipeBlocked = blockCount > 0;

  return (
    <SwipeContext.Provider
      value={{
        isSwipeBlocked,
        blockSwipe,
        unblockSwipe,
      }}
    >
      {children}
    </SwipeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSwipe = () => {
  const context = useContext(SwipeContext);
  if (context === undefined) {
    throw new Error('useSwipe must be used within a SwipeProvider');
  }
  return context;
};
