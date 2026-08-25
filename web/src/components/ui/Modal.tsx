'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { modalVariants, backdropVariants, checkReducedMotion } from '@/lib/motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  subtitle,
  children,
  maxWidth = 'md',
  className,
}) => {
  const modalDesc = description || subtitle;
  const isReduced = checkReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={isReduced ? { opacity: 1 } : 'hidden'}
            animate={isReduced ? { opacity: 1 } : 'visible'}
            exit={isReduced ? { opacity: 0 } : 'exit'}
            variants={backdropVariants}
            className="fixed inset-0 bg-[#172033]/45 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Surface */}
          <motion.div
            initial={isReduced ? { opacity: 1 } : 'hidden'}
            animate={isReduced ? { opacity: 1 } : 'visible'}
            exit={isReduced ? { opacity: 0 } : 'exit'}
            variants={modalVariants}
            className={cn(
              'relative w-full max-h-[90vh] flex flex-col rounded-2xl bg-white border border-[#E4E2DC] p-6 shadow-2xl z-10 text-[#172033] overflow-hidden transform-gpu',
              maxWidthStyles[maxWidth],
              className
            )}
          >
            {/* Header */}
            {(title || modalDesc) && (
              <div className="flex items-start justify-between pb-3.5 border-b border-[#E4E2DC] shrink-0 mb-4">
                <div className="space-y-0.5 min-w-0 pr-4">
                  {title && (
                    <h3 className="text-base font-bold text-[#172033] tracking-tight truncate">
                      {title}
                    </h3>
                  )}
                  {modalDesc && (
                    <p className="text-xs font-medium text-[#5F6878] leading-relaxed">
                      {modalDesc}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-[#858D9A] hover:text-[#172033] p-1.5 rounded-lg hover:bg-[#F0EFEA] transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-[#172033]/20 focus-visible:outline-none"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Content Body */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
