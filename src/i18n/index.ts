import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

const storedSettings = localStorage.getItem('kompanion-settings');
let initialLocale = navigator.language.startsWith('fr') ? 'fr' : 'en';

if (storedSettings) {
  try {
    const parsed = JSON.parse(storedSettings) as { state?: { locale?: string } };
    if (parsed.state?.locale === 'fr' || parsed.state?.locale === 'en') {
      initialLocale = parsed.state.locale;
    }
  } catch {
    // Use detected locale
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: initialLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
