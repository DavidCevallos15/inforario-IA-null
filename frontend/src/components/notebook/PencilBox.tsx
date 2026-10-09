import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ease } from '../../lib/motion';

interface PencilBoxProps {
  children: React.ReactNode;
  className?: string;
  /** Pasa el trazo de lápiz a tinta (p. ej. al arrastrar un archivo encima). */
  inked?: boolean;
  delay?: number;
}

/**
 * Recuadro trazado a lápiz que se dibuja solo. El filtro de turbulencia le da
 * el temblor de un trazo hecho a mano sin dibujar rutas a mano.
 */
export const PencilBox: React.FC<PencilBoxProps> = ({ children, className = '', inked = false, delay = 0.25 }) => {
  const reduce = useReducedMotion();
  const filterId = `rough-${useId().replace(/:/g, '')}`;

  return (
    <div className={`relative ${className}`}>
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        <defs>
          <filter id={filterId} x="-2%" y="-2%" width="104%" height="104%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" />
            <feDisplacementMap in="SourceGraphic" scale="1.6" />
          </filter>
        </defs>
        <motion.rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="3"
          fill="none"
          filter={`url(#${filterId})`}
          initial={reduce ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: ease.reveal, delay }}
          className={`transition-[stroke,stroke-width] duration-200 ${
            inked ? 'stroke-primary [stroke-width:2.5]' : 'stroke-pencil [stroke-width:1.75]'
          }`}
        />
      </svg>
      {children}
    </div>
  );
};

export default PencilBox;
