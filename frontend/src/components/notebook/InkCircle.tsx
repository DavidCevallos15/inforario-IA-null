import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ease } from '../../lib/motion';

/** Número encerrado en un círculo trazado con esfero, como se numeran los apuntes. */
export const InkCircle: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-grid h-12 w-14 shrink-0 place-items-center">
      <svg aria-hidden viewBox="0 0 60 48" className="absolute inset-0 h-full w-full overflow-visible">
        <motion.path
          d="M47 9 C37 1 12 3 6 19 C1 33 20 46 39 41 C54 36 59 20 45 7"
          fill="none"
          className="stroke-primary"
          strokeWidth="2.25"
          strokeLinecap="round"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.7, ease: ease.reveal, delay }}
        />
      </svg>
      <span className="ink relative text-2xl font-bold leading-none">{children}</span>
    </span>
  );
};

export default InkCircle;
