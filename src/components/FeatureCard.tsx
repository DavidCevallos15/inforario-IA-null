import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * FeatureCard - Academic Curator style card for displaying features
 * Implements accessibility best practices with proper semantic structure
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description 
}) => (
  <article 
    className="group bg-surface-container-low hover:bg-surface-container rounded-[1.5rem] p-8 transition-all duration-300 editorial-shadow hover:shadow-[0_24px_48px_rgba(0,73,37,0.12)]"
    aria-labelledby={`feature-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <div 
      className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant mb-6 group-hover:scale-110 transition-transform duration-300"
      aria-hidden="true"
    >
      {icon}
    </div>
    <h4 
      id={`feature-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="text-xl font-bold text-on-surface mb-3"
    >
      {title}
    </h4>
    <p className="text-on-surface-variant leading-relaxed">
      {description}
    </p>
  </article>
);

export default FeatureCard;
