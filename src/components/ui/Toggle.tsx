import clsx from 'clsx';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
}

export const Toggle = ({
  enabled,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
}: ToggleProps) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  const sizeClasses = {
    sm: {
      track: 'h-5 w-9',
      thumb: 'h-3 w-3',
      translate: enabled ? 'translate-x-5' : 'translate-x-1',
    },
    md: {
      track: 'h-6 w-11',
      thumb: 'h-4 w-4',
      translate: enabled ? 'translate-x-6' : 'translate-x-1',
    },
  };

  const toggleButton = (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={handleToggle}
      className={clsx(
        'relative inline-flex items-center rounded-full transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-strava-orange focus:ring-offset-2',
        sizeClasses[size].track,
        {
          'bg-gradient-to-r from-strava-orange to-strava-orange-dark shadow-md':
            enabled && !disabled,
          'border border-gray-300 bg-gray-200 shadow-sm': !enabled && !disabled,
          'cursor-not-allowed border border-gray-300/50 bg-gray-200/50 opacity-60': disabled,
          'cursor-pointer': !disabled,
        }
      )}
    >
      <span
        className={clsx(
          'inline-block rounded-full bg-white shadow-lg transition-transform duration-200',
          sizeClasses[size].thumb,
          sizeClasses[size].translate,
          {
            'ring-2 ring-strava-orange/20': enabled && !disabled,
            'bg-gray-100': disabled,
          }
        )}
      />
    </button>
  );

  if (label || description) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          {label && <div className="font-bold text-gray-900">{label}</div>}
          {description && <div className="text-sm text-gray-600">{description}</div>}
        </div>
        {toggleButton}
      </div>
    );
  }

  return toggleButton;
};
