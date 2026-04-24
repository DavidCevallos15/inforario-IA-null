import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest rounded-3xl shadow-editorial border border-outline-variant/15 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-4 text-error">
            <AlertTriangle size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-on-surface mb-2">¿Estás seguro de volver?</h3>
          <p className="text-on-surface-variant mb-6">
            Perderás todo tu progreso actual si no has guardado los cambios.
          </p>
          
          <div className="flex flex-col gap-3">
             <button 
              onClick={onConfirm}
              className="w-full py-3 bg-transparent border-2 border-error/50 text-error font-bold rounded-xl hover:bg-error-container hover:border-error transition-all"
            >
              Sí, volver al inicio
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-all shadow-editorial"
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