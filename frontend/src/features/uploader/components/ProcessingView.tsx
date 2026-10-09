import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

// Lo que realmente ocurre al leer el PDF, en orden
const STEPS = ['Leyendo tu PDF…', 'Buscando materias y docentes…', 'Ubicando aulas y edificios…', 'Revisando choques de horario…'];

/** Superposición mientras se procesa: la hoja con un resaltador que pasa sobre el texto. */
export const ProcessingView: React.FC = () => {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="paper-grid-soft fixed inset-0 z-[100] grid place-items-center bg-background/90 px-8"
    >
      <div className="w-full max-w-sm">
        <p className="ink relative inline-block text-4xl font-bold leading-tight">
          <motion.span
            aria-hidden
            className="absolute inset-x-[-0.15em] bottom-[0.12em] -z-10 h-[0.55em] origin-left rounded-sm bg-hl-yellow"
            initial={reduce ? false : { scaleX: 0 }}
            animate={reduce ? undefined : { scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
            transition={reduce ? undefined : { duration: 1.6, ease: [0.45, 0.05, 0.25, 1], repeat: Infinity, repeatDelay: 0.2 }}
          />
          Pasando en limpio
        </p>
        <div className="relative mt-4 h-6">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 text-base font-semibold text-on-surface-variant"
            >
              {STEPS[step]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
