import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@i18n/index';

type Locale = 'en' | 'fr';
export type Theme = 'light' | 'dark';

interface SettingsState {
  locale: Locale;
  hapticEnabled: boolean;
  theme: Theme;
  setLocale: (locale: Locale) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setTheme: (theme: Theme) => void;
}

const detectDefaultLocale = (): Locale => {
  return navigator.language.startsWith('fr') ? 'fr' : 'en';
};

const detectDefaultTheme = (): Theme => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: detectDefaultLocale(),
      hapticEnabled: true,
      theme: detectDefaultTheme(),

      setLocale: (locale) => {
        void i18n.changeLanguage(locale);
        set({ locale });
      },

      setHapticEnabled: (enabled) => {
        set({ hapticEnabled: enabled });
      },

      setTheme: (theme) => {
        set({ theme });
      },
    }),
    {
      name: 'kompanion-settings',
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<SettingsState>) };
        if (merged.theme !== 'light' && merged.theme !== 'dark') {
          merged.theme = detectDefaultTheme();
        }
        return merged;
      },
    }
  )
);
