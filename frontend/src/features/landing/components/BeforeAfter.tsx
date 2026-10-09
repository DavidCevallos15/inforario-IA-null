import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';

interface BeforeAfterProps {
  before: React.ReactNode;
  after: React.ReactNode;
  beforeLabel: string;
  afterLabel: string;
  /** Posición de reposo de la línea (% desde la izquierda). */
  restAt?: number;
  className?: string;
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/**
 * Comparación con una línea que se arrastra (mouse, dedo o flechas del teclado).
 * El "antes" se recorta con clip-path, que se anima en el compositor.
 */
export const BeforeAfter: React.FC<BeforeAfterProps> = ({ before, after, beforeLabel, afterLabel, restAt = 50, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const position = useMotionValue(restAt);
  const clipPath = useTransform(position, (p) => `inset(0 ${100 - p}% 0 0)`);
  const handleLeft = useTransform(position, (p) => `${p}%`);
  const dragging = useRef(false);
  const [value, setValue] = useState(restAt);
  useMotionValueEvent(position, 'change', (v) => setValue(Math.round(v)));

  // Al aparecer, la línea se desliza una vez para mostrar que se puede mover
  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(position, [restAt, restAt + 28, restAt], { duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 });
    return () => controls.stop();
  }, [inView, reduce, position, restAt]);

  const setFromPointer = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    position.set(clamp(((clientX - rect.left) / rect.width) * 100));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) setFromPointer(e.clientX);
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 20 : 5;
    const keys: Record<string, number> = {
      ArrowLeft: -step,
      ArrowRight: step,
      Home: -100,
      End: 100,
    };
    if (e.key in keys) {
      e.preventDefault();
      position.set(clamp(position.get() + keys[e.key]));
    }
  };

  return (
    <div
      ref={ref}
      className={`relative touch-pan-y select-none overflow-hidden rounded bg-surface-container-lowest shadow-sheet ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {after}
      <span className="ink pointer-events-none absolute bottom-3 right-4 z-10 rounded-sm bg-surface-container-lowest/90 px-2 text-base font-bold">
        {afterLabel}
      </span>

      <motion.div className="absolute inset-0 z-20" style={{ clipPath }}>
        {before}
        <span className="pointer-events-none absolute left-4 top-3 rounded-sm bg-white/90 px-2 font-hand text-base font-bold text-[#4a4a4a]">
          {beforeLabel}
        </span>
      </motion.div>

      {/* Línea y tirador */}
      <motion.div className="absolute inset-y-0 z-30 -translate-x-1/2" style={{ left: handleLeft }}>
        <div className="mx-auto h-full w-0.5 bg-primary" />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Comparar el PDF del SGU con Inforario"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={`${value}% del PDF visible`}
          onKeyDown={onKeyDown}
          className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-primary text-on-primary shadow-editorial-lg transition-transform duration-150 hover:scale-105 active:scale-95"
        >
          <ArrowLeftRight size={18} strokeWidth={2.25} />
        </div>
      </motion.div>
    </div>
  );
};

export default BeforeAfter;
