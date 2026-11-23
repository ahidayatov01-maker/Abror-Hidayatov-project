import React, { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { MotionModalBackdrop, MotionModalPanel } from '../../motion/MotionPrimitives';

export interface GlassModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  titleId?: string;
  closeLabel?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export const GlassModal: React.FC<GlassModalProps> = ({
  open,
  onClose,
  title,
  titleId = 'glass-modal-title',
  closeLabel = 'Close',
  maxWidthClass = 'max-w-3xl',
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <MotionModalBackdrop
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
        >
          <MotionModalPanel
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            onClick={(e) => e.stopPropagation()}
            className={`relative z-10 glass-panel rounded-3xl ${maxWidthClass} w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto`}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
                <h3 id={titleId} className="font-display text-2xl sm:text-3xl font-semibold">
                  {title}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={closeLabel}
                  className="p-2 rounded-xl hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {children}
          </MotionModalPanel>
        </MotionModalBackdrop>
      )}
    </AnimatePresence>
  );
};
