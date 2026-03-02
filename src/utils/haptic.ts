import { useSettingsStore } from '@store/settingsStore';

export type HapticPattern = 'light' | 'medium' | 'strong' | 'error';

interface HapticPatterns {
  light: number | number[];
  medium: number | number[];
  strong: number | number[];
  error: number | number[];
}

const PATTERNS: HapticPatterns = {
  light: 10, // Quick tap (sync complete)
  medium: [20, 10, 20], // Double tap (achievement, quest complete)
  strong: [30, 10, 30, 10, 30], // Triple tap (level up)
  error: [10, 50, 10], // Error pattern
};

class HapticService {
  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  vibrate(pattern: HapticPattern): void {
    const enabled = useSettingsStore.getState().hapticEnabled;

    if (!enabled || !this.isSupported()) {
      return;
    }

    if (this.prefersReducedMotion()) {
      return;
    }

    const vibrationPattern = PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
  }

  achievementUnlocked(): void {
    this.vibrate('medium');
  }

  questCompleted(): void {
    this.vibrate('medium');
  }

  levelUp(): void {
    this.vibrate('strong');
  }

  syncCompleted(): void {
    this.vibrate('light');
  }

  error(): void {
    this.vibrate('error');
  }

  isEnabled(): boolean {
    return useSettingsStore.getState().hapticEnabled && !this.prefersReducedMotion();
  }
}

export const hapticService = new HapticService();
