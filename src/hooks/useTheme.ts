import { useEffect } from 'react';
import { useSettingsStore } from '@store/settingsStore';

const applyThemeClass = (isDark: boolean) => {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const useTheme = () => {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    applyThemeClass(theme === 'dark');
  }, [theme]);
};
