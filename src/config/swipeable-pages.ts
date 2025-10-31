/**
 * Configuration for swipeable pages
 *
 * To add a new swipeable page:
 * 1. Add a new entry to the array below
 * 2. The `order` determines the sequence (0, 1, 2, 3...)
 * 3. Swipe right goes to lower order, swipe left to higher order
 */

export interface SwipeablePage {
  path: string;
  order: number;
}

export const SWIPEABLE_PAGES: SwipeablePage[] = [
  { path: '/dashboard', order: 0 },
  { path: '/quests', order: 1 },
  { path: '/achievements', order: 2 },
  { path: '/stats', order: 3 },
];

/**
 * Get the next page path based on current path and swipe direction
 */
export function getNextSwipePage(currentPath: string, direction: 'left' | 'right'): string | null {
  const currentPage = SWIPEABLE_PAGES.find((p) => p.path === currentPath);

  if (!currentPage) {
    return null; // Current page is not swipeable
  }

  const targetOrder =
    direction === 'left'
      ? currentPage.order + 1 // Swipe left = next page
      : currentPage.order - 1; // Swipe right = previous page

  const targetPage = SWIPEABLE_PAGES.find((p) => p.order === targetOrder);

  return targetPage?.path || null;
}

/**
 * Check if a path is swipeable
 */
export function isSwipeablePage(path: string): boolean {
  return SWIPEABLE_PAGES.some((p) => p.path === path);
}
