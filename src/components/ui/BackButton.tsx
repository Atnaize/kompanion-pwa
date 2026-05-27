import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

interface BackButtonProps {
  /** Where to go. Defaults to `navigate(-1)` (browser back). */
  to?: string;
  /** Override the navigation callback entirely (skips both `to` and history). */
  onClick?: () => void;
  /**
   * - `inline` (default): icon + label, lives at the top of a content page.
   * - `icon`: round icon-only, sized for a sticky header.
   */
  variant?: 'inline' | 'icon';
  /**
   * `icon`-variant color treatment:
   * - `default`: gray icon on a light hover background (over page surfaces).
   * - `overlay`: white icon on a translucent dark circle (over imagery /
   *   gradients, e.g. the club hero).
   */
  tone?: 'default' | 'overlay';
  /** Label shown next to the icon in `inline` variant. Defaults to t('common.back'). */
  label?: string;
  /** Aria-label for the `icon` variant. Defaults to t('common.back'). */
  ariaLabel?: string;
  className?: string;
}

/**
 * Single source of truth for "go back" UI across the app. Replaces the half-
 * dozen hand-rolled chevron/arrow links that had drifted apart on size,
 * spacing, and hover treatment. Pages just drop in `<BackButton />` (or
 * `<BackButton variant="icon" />` for sticky headers).
 *
 * Routing: when `onClick` is set, it wins. Otherwise we navigate to `to` if
 * provided, else `navigate(-1)`.
 */
export const BackButton = ({
  to,
  onClick,
  variant = 'inline',
  tone = 'default',
  label,
  ariaLabel,
  className,
}: BackButtonProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('common.back');
  const resolvedAriaLabel = ariaLabel ?? resolvedLabel;

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (to) {
      navigate(to);
      return;
    }
    navigate(-1);
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={resolvedAriaLabel}
        className={clsx(
          'flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95',
          tone === 'overlay'
            ? 'bg-black/30 text-white backdrop-blur hover:bg-black/45'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800',
          className
        )}
      >
        <ChevronLeft size={18} strokeWidth={2} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        '-ml-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100',
        className
      )}
    >
      <ChevronLeft size={16} strokeWidth={2} />
      {resolvedLabel}
    </button>
  );
};
