import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'editorial' | 'low';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'editorial',
  className = '',
  ...props
}) => {
  const baseStyle = "rounded-[1.5rem] transition-all duration-300";
  
  const shadowVariants = {
    flat: "bg-surface-container border border-outline/40",
    editorial: "bg-surface-container-low border border-outline/40 hover:border-outline hover:shadow-editorial",
    low: "bg-surface-container-lowest border border-outline/30 editorial-shadow",
  };

  return (
    <div
      className={`${baseStyle} ${shadowVariants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
