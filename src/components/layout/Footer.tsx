import React from 'react';
import { Github, Phone, MapPin, Sparkles } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-container-high mt-auto">
      <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-on-primary" />
            </div>
            <h3 className="text-primary font-extrabold text-lg tracking-tighter">Inforario</h3>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed max-w-xs">
            Gestor Inteligente de Horarios UTM.<br />
            Transforma el SGA en experiencias digitales impecables.
          </p>
        </div>

        {/* Developer info */}
        <div className="flex flex-col items-start md:items-end gap-3 text-sm">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="font-semibold text-on-surface">Desarrollado por:</span>
            <span>David Cevallos Zambrano</span>
          </div>
          <p className="text-xs text-on-surface-variant">Estudiante de TI — Universidad Técnica de Manabí</p>
          <div className="flex gap-4 mt-1">
            <a
              href="https://github.com/DavidCevallos15"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors duration-200 flex items-center gap-1.5 text-on-surface-variant font-medium"
            >
              <Github size={15} /> GitHub
            </a>
            <a
              href="https://wa.me/593979107716?text=Hola,%20quiero%20dejar%20feedback%20sobre%20Inforario"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-secondary transition-colors duration-200 flex items-center gap-1.5 text-primary font-semibold"
            >
              <Phone size={15} /> Feedback WhatsApp
            </a>
            <span className="flex items-center gap-1.5 text-on-surface-variant">
              <MapPin size={15} /> Portoviejo, Ecuador
            </span>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-outline-variant/20 py-4 text-center">
        <p className="text-xs text-on-surface-variant">
          © {new Date().getFullYear()} Inforario v3.0 — "The Academic Curator" · UTM · Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
};

export default Footer;