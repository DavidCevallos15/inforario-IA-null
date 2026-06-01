import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyle = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider select-none";

  const variants = {
    primary: "bg-success-container text-primary-fixed border border-primary/30",
    secondary: "bg-warning-container text-secondary border border-secondary/30",
    error: "bg-error-container text-on-error-container border border-error/30",
    success: "bg-success-container text-success border border-primary/30",
    warning: "bg-warning-container text-warning border border-secondary/30",
    info: "bg-info-container text-info border border-info/30",
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
