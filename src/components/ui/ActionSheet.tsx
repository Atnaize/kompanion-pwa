import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

export interface ActionSheetItem {
  /** Stable key — also used as the value passed back to `onSelect`. */
  id: string;
  label: string;
  /** Optional secondary line under the label. */
  description?: string;
  /** Lucide icon element (already sized). */
  icon?: ReactNode;
  /** 'danger' renders red; 'warning' renders yellow; default is neutral. */
  variant?: 'default' | 'warning' | 'danger';
  /** Show a separator above this row. */
  separator?: boolean;
  /** Disables tapping (e.g. during a mutation). */
  disabled?: boolean;
}

interface ActionSheetProps {
  open: boolean;
  onClose: () => void;
  /** Items in render order. */
  items: ActionSheetItem[];
  /** Called when the user taps a (non-disabled) item. The sheet does not auto-close — caller decides. */
  onSelect: (id: string) => void;
  /** Optional title row at the top of the sheet (above items). */
  title?: ReactNode;
  /** Optional subtitle below the title. */
  subtitle?: ReactNode;
  /** "Cancel" row at the bottom. Set to null to hide. Defaults to "Cancel". */
  cancelLabel?: string | null;
}

/**
 * Bottom action sheet primitive. Native iOS/Android pattern: dim backdrop +
 * card sliding up from the bottom with full-width tappable rows. Reusable
 * for kebab menus, mode pickers, destructive confirms — anywhere a desktop
 * dropdown would land on mobile.
 *
 * Locks body scroll while open and dismisses on Escape. The sheet itself
 * never auto-closes on select — callers can keep it open during async work.
 */
export const ActionSheet = ({
  open,
  onClose,
  items,
  onSelect,
  title,
  subtitle,
  cancelLabel = 'Cancel',
}: ActionSheetProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[90]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="pointer-events-auto mx-auto max-w-lg px-3">
              <div className="overflow-hidden rounded-t-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-lg dark:border-gray-700/40 dark:bg-gray-900/95">
                <div className="flex justify-center py-3">
                  <span className="h-1.5 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>
                {(title || subtitle) && (
                  <div className="px-5 pb-2">
                    {title && (
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                        {title}
                      </div>
                    )}
                    {subtitle && (
                      <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                        {subtitle}
                      </div>
                    )}
                  </div>
                )}
                <div className="px-2 pb-2 pt-1">
                  {items.map((item) => (
                    <ActionSheetRow
                      key={item.id}
                      item={item}
                      onSelect={() => !item.disabled && onSelect(item.id)}
                    />
                  ))}
                </div>
                {cancelLabel && (
                  <div className="border-t border-gray-200 px-2 py-2 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={onClose}
                      className="block w-full rounded-2xl px-3 py-3 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      {cancelLabel}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

const ActionSheetRow = ({ item, onSelect }: { item: ActionSheetItem; onSelect: () => void }) => {
  const tone =
    item.variant === 'danger'
      ? 'text-red-500 dark:text-red-400'
      : item.variant === 'warning'
        ? 'text-yellow-500 dark:text-yellow-400'
        : 'text-gray-900 dark:text-gray-100';
  const iconBg =
    item.variant === 'danger'
      ? 'bg-red-500/15 text-red-400'
      : item.variant === 'warning'
        ? 'bg-yellow-500/15 text-yellow-400'
        : 'bg-strava-orange/15 text-strava-orange';

  return (
    <>
      {item.separator && <div className="my-1 h-px bg-gray-200 dark:bg-gray-800" />}
      <button
        type="button"
        onClick={onSelect}
        disabled={item.disabled}
        className={clsx(
          'flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors disabled:opacity-50',
          'hover:bg-gray-100 dark:hover:bg-gray-800/60'
        )}
      >
        {item.icon && (
          <span
            className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', iconBg)}
          >
            {item.icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className={clsx('block truncate text-sm', tone)}>{item.label}</span>
          {item.description && (
            <span className="mt-0.5 block truncate text-[11px] text-gray-500 dark:text-gray-400">
              {item.description}
            </span>
          )}
        </span>
      </button>
    </>
  );
};
