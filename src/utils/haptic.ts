/**
 * Haptic Feedback Service
 *
 * Provides subtle vibration feedback for important events.
 * Respects user preferences and system settings.
 */

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
  private enabled: boolean = true;

  constructor() {
    // Load user preference from localStorage
    const storedPreference = localStorage.getItem('haptic_enabled');
    if (storedPreference !== null) {
      this.enabled = storedPreference === 'true';
    }

    // Respect system preference for reduced motion
    if (this.prefersReducedMotion()) {
      this.enabled = false;
    }
  }

  /**
   * Check if user has enabled reduced motion in system settings
   */
  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if vibration API is supported
   */
  isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * Trigger haptic feedback
   */
  vibrate(pattern: HapticPattern): void {
    // Don't vibrate if disabled or not supported
    if (!this.enabled || !this.isSupported()) {
      return;
    }

    // Don't vibrate if user prefers reduced motion
    if (this.prefersReducedMotion()) {
      return;
    }

    const vibrationPattern = PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
  }

  /**
   * Specific event haptics
   */
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

  /**
   * Enable/disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('haptic_enabled', enabled.toString());
  }

  /**
   * Get current enabled state
   */
  isEnabled(): boolean {
    return this.enabled && !this.prefersReducedMotion();
  }
}

export const hapticService = new HapticService();
