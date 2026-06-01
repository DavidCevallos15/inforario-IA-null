import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type CombinedButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<'button'>> & HTMLMotionProps<'button'>;

interface ButtonProps extends CombinedButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'secondary-container';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  ...props
}) => {
  const baseStyle = "inline-flex items-center justify-center font-semibold rounded-xl transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-primary-container hover:shadow-glow-primary",
    secondary: "bg-secondary text-on-secondary hover:bg-secondary-container hover:shadow-glow-gold",
    'secondary-container': "bg-secondary text-on-secondary hover:bg-secondary-container hover:shadow-glow-gold",
    outline: "border border-outline text-on-surface bg-surface-container-high/40 hover:border-primary-fixed hover:text-primary-fixed",
    ghost: "text-on-surface-variant hover:text-primary-fixed hover:bg-surface-container-high/50",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Procesando...
        </span>
      ) : children}
    </motion.button>
  );
};

export default Button;
