import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className={`relative w-full ${sizes[size]} bg-surface-container border border-outline/50 rounded-[2rem] p-6 md:p-8 editorial-shadow-lg z-10 overflow-hidden max-h-[90vh] flex flex-col`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              {title ? (
                <h3 className="text-xl md:text-2xl font-bold text-on-surface select-none">
                  {title}
                </h3>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-xl hover:bg-error-container/30"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto pr-1 flex-grow">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
