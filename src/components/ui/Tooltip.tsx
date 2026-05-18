import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface TooltipProps {
  /** Trigger element (avatar, chip, icon button, …). Rendered inside a button wrapper. */
  children: ReactNode;
  /** Content shown inside the popup. */
  content: ReactNode;
  /** Visual placement relative to the trigger. */
  placement?: 'top' | 'bottom';
  /** Optional class for the trigger wrapper (the button). */
  className?: string;
  /** ARIA label for the trigger when content is non-textual. */
  label?: string;
}

/**
 * Lightweight tooltip that opens on hover/focus (mouse) and tap (touch).
 * Closes on outside click, Escape, or blur. One open at a time via a small
 * shared signal.
 *
 * Rendered via a Portal into `document.body` with `position: fixed`, so it is
 * never clipped by `overflow: hidden` parents (cards, scroll containers).
 * Position is computed from the trigger's bounding rect and clamped to the
 * viewport with an 8px gutter.
 */
let activeCloser: (() => void) | null = null;

export const Tooltip = ({
  children,
  content,
  placement = 'top',
  className,
  label,
}: TooltipProps) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const trig = triggerRef.current;
      const tip = tooltipRef.current;
      if (!trig || !tip) return;
      const tr = trig.getBoundingClientRect();
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      const margin = 8;
      const cx = tr.left + tr.width / 2;
      let left = cx - tw / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - tw - margin));
      const top = placement === 'top' ? tr.top - th - 6 : tr.bottom + 6;
      setPos({ top, left });
    };
    measure();

    activeCloser?.();
    const close = () => setOpen(false);
    activeCloser = close;

    const onDocPointer = (e: PointerEvent) => {
      const t = triggerRef.current;
      if (!t) return;
      if (e.target instanceof Node && t.contains(e.target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('pointerdown', onDocPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', measure);
    // capture = true so we also catch scrolls inside nested scroll containers.
    window.addEventListener('scroll', measure, true);
    return () => {
      document.removeEventListener('pointerdown', onDocPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      if (activeCloser === close) {
        activeCloser = null;
      }
    };
  }, [open, placement]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') setOpen(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={clsx('inline-flex items-center', className)}
      >
        {children}
      </button>

      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={id}
            role="tooltip"
            className="pointer-events-none fixed z-[100] w-max max-w-[14rem] rounded-md bg-gray-900 px-2 py-1 text-center text-[11px] font-medium leading-snug text-white shadow-md ring-1 ring-black/10 dark:bg-gray-100 dark:text-gray-900 dark:ring-white/10"
            style={
              pos
                ? { top: pos.top, left: pos.left }
                : // First render: keep offscreen so we can measure without flashing.
                  { top: -9999, left: -9999 }
            }
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};
