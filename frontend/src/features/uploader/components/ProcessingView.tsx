import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, BrainCircuit, Sparkles, FileSearch, CalendarRange } from 'lucide-react';

const MESSAGES = [
  "Iniciando procesamiento...",
  "Analizando la estructura del documento...",
  "Identificando materias y facultades...",
  "Extrayendo nombres de docentes...",
  "Mapeando horarios y aulas...",
  "Buscando posibles conflictos...",
  "Casi listo, organizando tu semana..."
];

export const ProcessingView: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-fixed/15 rounded-full blur-[120px] animate-pulse"></div>
      
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center">
        {/* Animated Icon Container */}
        <div className="relative mb-12">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 rounded-3xl border-2 border-primary-fixed/20 flex items-center justify-center"
          >
            <div className="absolute inset-0 border-t-2 border-primary-fixed rounded-3xl blur-[2px]"></div>
          </motion.div>
          
          <div className="absolute inset-0 flex items-center justify-center">
             <motion.div
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
               transition={{ duration: 2, repeat: Infinity }}
             >
                <BrainCircuit size={48} className="text-primary-fixed" />
             </motion.div>
          </div>

          {/* Orbiting Icons */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-surface-container-high p-2 rounded-lg border border-outline/40 shadow-xl">
               <FileSearch size={18} className="text-primary-fixed" />
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-surface-container-high p-2 rounded-lg border border-outline/40 shadow-xl">
               <CalendarRange size={18} className="text-secondary" />
            </div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 bg-surface-container-high p-2 rounded-lg border border-outline/40 shadow-xl">
               <Sparkles size={18} className="text-primary-fixed" />
            </div>
          </motion.div>
        </div>

        <h2 className="text-2xl font-black text-on-surface tracking-tighter mb-4 flex items-center gap-2">
          <Loader2 className="animate-spin text-primary-fixed" size={24} />
          GENERANDO HORARIO
        </h2>

        <div className="h-6 relative w-full mb-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-on-surface-variant text-sm font-medium absolute inset-0"
            >
              {MESSAGES[messageIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden border border-outline/40">
           <motion.div 
             initial={{ width: "0%" }}
             animate={{ width: "100%" }}
             transition={{ duration: 15, ease: "linear" }}
             className="h-full bg-gradient-to-r from-primary via-primary-fixed to-secondary shadow-glow-primary"
           />
        </div>
        <p className="mt-4 text-[10px] text-on-surface-variant uppercase tracking-[0.2em] font-bold">
          Schedule Parser Engine v4.0
        </p>
      </div>
    </div>
  );
};
