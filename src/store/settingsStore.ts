import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@i18n/index';

type Locale = 'en' | 'fr';

interface SettingsState {
  locale: Locale;
  hapticEnabled: boolean;
  setLocale: (locale: Locale) => void;
  setHapticEnabled: (enabled: boolean) => void;
}

const detectDefaultLocale = (): Locale => {
  return navigator.language.startsWith('fr') ? 'fr' : 'en';
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: detectDefaultLocale(),
      hapticEnabled: true,

      setLocale: (locale) => {
        void i18n.changeLanguage(locale);
        set({ locale });
      },

      setHapticEnabled: (enabled) => {
        set({ hapticEnabled: enabled });
      },
    }),
    {
      name: 'kompanion-settings',
    }
  )
);
