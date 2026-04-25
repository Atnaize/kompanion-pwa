/**
 * Warm gradient app background. Fixed to the viewport so color persists through
 * scroll, and `pointer-events-none` so it never captures interaction.
 */
export const Background = () => (
  <div
    className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-orange-50 via-white to-cyan-50/60 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
    aria-hidden="true"
  />
);
