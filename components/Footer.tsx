import React from 'react';
import { Github, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-card text-muted-foreground py-8 mt-auto border-t border-muted">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <h3 className="text-primary font-bold text-lg">Inforario v2.0</h3>
          <p className="text-sm">Gestor Inteligente de Horarios UTM</p>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">Desarrollado por:</span>
            <span>David Cevallos Zambrano<br /> Estudiante de TI de la Universidad Técnica de Manabí</span>
          </div>
          <div className="flex gap-4 mt-2">
             <a href="https://github.com/DavidCevallos15" className="hover:text-primary transition-colors flex items-center gap-1">
               <Github size={16} /> GitHub
             </a>
             <a href="https://wa.me/593979107716?text=Hola,%20quiero%20compartir%20mi%20experiencia%20con%20Inforario" target="_blank" rel="noopener noreferrer" className="hover:text-green-400 transition-colors flex items-center gap-1 font-semibold text-primary">
               <Phone size={16} className="animate-pulse" /> Déjanos tu Feedback
             </a>
             <span className="flex items-center gap-1">
               <MapPin size={16} /> Portoviejo, Ecuador
             </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;