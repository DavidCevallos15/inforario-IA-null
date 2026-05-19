import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    // Focus the cancel button (safer default) when modal opens
    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button:not([disabled])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
      aria-describedby="reset-modal-description"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className="bg-surface-container-lowest rounded-3xl shadow-editorial border border-outline-variant/15 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <div className="p-6 text-center">
          <div 
            className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4 text-error"
            aria-hidden="true"
          >
            <AlertTriangle size={32} />
          </div>
          
          <h3 
            id="reset-modal-title"
            className="text-xl font-bold text-on-surface mb-2"
          >
            ¿Estas seguro de volver?
          </h3>
          <p 
            id="reset-modal-description"
            className="text-on-surface-variant mb-6"
          >
            Perderas todo tu progreso actual si no has guardado los cambios.
          </p>
          
          <div className="flex flex-col gap-3" role="group" aria-label="Opciones de confirmacion">
            <button 
              ref={confirmButtonRef}
              onClick={onConfirm}
              className="w-full py-3 bg-transparent border-2 border-error/50 text-error font-bold rounded-xl hover:bg-error-container hover:border-error transition-all focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-surface-container-lowest"
              aria-label="Confirmar volver al inicio y perder cambios"
            >
              Si, volver al inicio
            </button>
            <button 
              ref={cancelButtonRef}
              onClick={onClose}
              className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all shadow-editorial focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-container-lowest"
              aria-label="Cancelar y continuar editando"
            >
              No, continuar editando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmResetModal;
