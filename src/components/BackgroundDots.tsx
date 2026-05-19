'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Scene } from './DotScreenShader'
import { ScheduleTheme } from '../types'

interface BackgroundDotsProps {
  theme: ScheduleTheme;
}

// Check if user prefers reduced motion
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
};

// Loading fallback for Suspense
const LoadingFallback = () => (
  <div 
    className="fixed top-0 left-0 w-full h-full -z-10 bg-background"
    aria-hidden="true"
  />
);

// Static fallback for reduced motion
const StaticBackground = () => (
  <div 
    className="fixed top-0 right-0 w-[600px] h-[600px] -z-10 pointer-events-none"
    style={{
      background: 'radial-gradient(circle, rgba(0,73,37,0.04) 0%, transparent 70%)',
    }}
    aria-hidden="true"
  />
);

export default function BackgroundDots({ theme }: BackgroundDotsProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  
  // Pause animation when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Respect user's motion preferences
  if (prefersReducedMotion) {
    return <StaticBackground />;
  }

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
      aria-hidden="true"
      role="presentation"
    >
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          eventSource={typeof window !== 'undefined' ? document.body : undefined}
          eventPrefix="client"
          // Pause rendering when not visible for performance
          frameloop={isVisible ? 'always' : 'never'}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping: THREE.NoToneMapping,
            // Performance optimizations
            alpha: false,
            stencil: false,
            depth: false,
          }}
          // Limit pixel ratio for performance on high-DPI displays
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%' }}
          // Accessibility - this is decorative
          aria-hidden="true"
        >
          <Scene appTheme={theme} />
        </Canvas>
      </Suspense>
    </div>
  )
}
