import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { dur, ease } from '../../lib/motion';

type RevealProps = HTMLMotionProps<'div'> & { delay?: number; y?: number };

/** Aparición al entrar en pantalla, una sola vez. Con movimiento reducido el contenido ya está visible. */
export function Reveal({ delay = 0, y = 24, ...props }: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      // Parte de un estado ya legible: si la animación se retrasa, el contenido nunca queda invisible
      initial={reduce ? false : { opacity: 0.4, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: dur.reveal, ease: ease.reveal, delay }}
      {...props}
    />
  );
}
