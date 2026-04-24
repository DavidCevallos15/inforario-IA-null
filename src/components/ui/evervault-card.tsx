import React from "react";
import { useMotionValue, useMotionTemplate, motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const EvervaultCard = ({
  text,
  className,
  icon,
  children
}: {
  text?: string;
  className?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }: any) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={cn(
        "p-0.5 bg-transparent aspect-square flex items-center justify-center w-full h-full relative",
        className
      )}
    >
      <div
        onMouseMove={onMouseMove}
        className="group/card rounded-3xl w-full relative overflow-hidden bg-background/40 backdrop-blur-md border border-white/10 flex items-center justify-center h-full"
      >
        <div className="pointer-events-none absolute inset-0 rounded-3xl [mask-image:linear-gradient(white,transparent)] group-hover/card:opacity-50"></div>
        
        {/* Subtle hover spotlight effect */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover/card:opacity-100 transition duration-500"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                250px circle at ${mouseX}px ${mouseY}px,
                rgba(255, 255, 255, 0.05),
                transparent 80%
              )
            `,
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 p-6 h-full w-full flex flex-col items-center justify-center text-center">
           {icon && (
             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 text-white group-hover/card:scale-110 transition-transform">
               {icon}
             </div>
           )}
           {text && <h3 className="font-bold text-xl text-white mb-2">{text}</h3>}
           {children && <div className="text-white/80 text-sm">{children}</div>}
        </div>
      </div>
    </div>
  );
};

export const Icon = ({ className, ...rest }: any) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
};