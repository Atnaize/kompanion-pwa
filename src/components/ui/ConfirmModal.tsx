import { ReactNode } from 'react';
import { Button } from './Button';
import { GlassCard } from './GlassCard';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <GlassCard className="relative z-10 w-full max-w-md p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-bold text-gray-900">{title}</h2>
        <div className="mb-6 text-gray-700">{message}</div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={`flex-1 ${
              confirmVariant === 'danger'
                ? '!bg-red-600 !text-white hover:!bg-red-700 focus:!ring-red-500'
                : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
