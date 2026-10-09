import React from 'react';
import { Modal } from '../ui/Modal';

interface ConfirmResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmResetModal: React.FC<ConfirmResetModalProps> = ({ isOpen, onClose, onConfirm }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="¿Empezar un horario nuevo?" size="sm">
    <p className="text-base leading-7 text-on-surface-variant">
      Volverás a la portada para subir otro PDF. Si iniciaste sesión, este horario sigue guardado en tu cuenta; si no, se
      reemplazará por el nuevo.
    </p>
    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-md border border-outline-variant px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:border-primary hover:text-primary"
      >
        Seguir con este
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="flex-1 rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary-container"
      >
        Subir otro PDF
      </button>
    </div>
  </Modal>
);

export default ConfirmResetModal;
