import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from 'react';
import clsx from 'clsx';

/**
 * Shared form field primitives. Before these, every form hand-rolled the same
 * ~80-char Tailwind string with subtle drift (rounded-lg vs rounded-xl,
 * focus:ring-orange-500 vs ring-strava-orange/30). One source of truth for
 * the field look + a consistent `error` state across the app.
 */
const base =
  'w-full rounded-xl border bg-white/70 px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 disabled:opacity-50 dark:bg-gray-900/70 dark:text-gray-50 dark:placeholder-gray-500';

const toneClass = (error?: boolean) =>
  error
    ? 'border-red-400 ring-red-400/30 focus:ring-red-500/40 dark:border-red-500/60'
    : 'border-gray-200 ring-strava-orange/30 dark:border-gray-700';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input ref={ref} className={clsx(base, toneClass(error), className)} {...props} />
  )
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={clsx(base, 'resize-none', toneClass(error), className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <select ref={ref} className={clsx(base, toneClass(error), className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';
