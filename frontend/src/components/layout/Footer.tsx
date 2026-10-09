import React from 'react';
import { MessageCircle } from 'lucide-react';
import { AppView } from '../../types';

/**
 * Pie de la hoja: crédito, aviso de independencia y contacto.
 * showCredit: la portada y Cómo funciona ya firman la página; ahí el pie no repite el crédito.
 */
const Footer: React.FC<{ onNavigate: (view: AppView) => void; showCredit?: boolean }> = ({ onNavigate, showCredit = true }) => (
  <footer className="border-t border-outline-variant pl-8 pr-5 md:pl-20 md:pr-12">
    <div className="flex flex-col gap-4 py-6 text-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-[62ch] leading-6">
        {showCredit && (
          <>
            Hecho por{' '}
            <a
              href="https://github.com/DavidCevallos15"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary underline decoration-primary/40 hover:decoration-primary"
            >
              DC.dev
            </a>
            .{' '}
          </>
        )}
        Proyecto estudiantil independiente: no es un servicio oficial de la UTM.
      </p>
      <div className="flex shrink-0 items-center gap-4">
        <button
          type="button"
          onClick={() => onNavigate(AppView.ABOUT)}
          className="font-bold transition-colors duration-150 hover:text-primary sm:hidden"
        >
          Cómo funciona
        </button>
        <a
          href="https://wa.me/593979107716?text=Hola,%20quiero%20dejar%20un%20comentario%20sobre%20Inforario"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold transition-colors duration-150 hover:text-primary"
        >
          <MessageCircle size={16} strokeWidth={2} />
          Enviar comentarios
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
