import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from 'framer-motion';

type MagneticButtonProps = HTMLMotionProps<'button'> & { strength?: number };

/**
 * Botón que se acerca levemente al puntero. Solo con mouse (pointer: fine) y
 * sin movimiento reducido; en táctil es un botón normal.
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({ strength = 0.25, className = '', children, ...props }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={enabled ? { x: sx, y: sy } : undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      whileTap={{ scale: 0.97 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default MagneticButton;
