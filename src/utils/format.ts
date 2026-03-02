import i18n from '@i18n/index';
import { useSettingsStore } from '@store/settingsStore';

export const formatDistance = (meters: number): string => {
  const km = meters / 1000;
  return km >= 10 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
};

export const formatElevation = (meters: number): string => {
  return `${Math.round(meters)} m`;
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

export const formatSpeed = (metersPerSecond: number): string => {
  const kmPerHour = (metersPerSecond * 3.6).toFixed(1);
  return `${kmPerHour} km/h`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const locale = useSettingsStore.getState().locale;

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return i18n.t('format.today');
  }

  if (diffDays === 1) {
    return i18n.t('format.yesterday');
  }

  if (diffDays < 7) {
    return i18n.t('format.daysAgo', { count: diffDays });
  }

  return formatDate(dateString);
};

export const formatDateToInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseInputDate = (dateString: string, endOfDay = false): Date => {
  const time = endOfDay ? 'T23:59:59' : 'T00:00:00';
  return new Date(dateString + time);
};
