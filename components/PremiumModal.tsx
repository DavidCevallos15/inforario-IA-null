import React from 'react';
import { Lock, X } from 'lucide-react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  onLoginRequest: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, featureName, onLoginRequest }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl shadow-2xl border border-accent/20 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-background p-6 text-center relative border-b border-muted">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X size={20} />
          </button>
          <div className="mx-auto bg-card w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 border-accent">
            <Lock className="text-accent" size={32} />
          </div>
          <h3 className="text-xl font-bold text-foreground">Función para Estudiantes</h3>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-muted-foreground mb-6">
            La función <span className="font-bold text-foreground">{featureName}</span> es exclusiva para usuarios registrados.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Crea una cuenta gratuita para guardar tu horario en la nube, personalizar colores, sincronizar con Google Calendar y descargar PDFs de alta calidad.
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => { onClose(); onLoginRequest(); }}
              className="w-full py-3 bg-accent text-accent-foreground font-bold rounded-lg hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,190,11,0.3)]"
            >
              Iniciar Sesión / Registrarse
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3 bg-muted text-muted-foreground font-medium rounded-lg hover:bg-muted/80 transition-all"
            >
              Quizás luego
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;