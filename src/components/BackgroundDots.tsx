'use client'

import React from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Scene } from './DotScreenShader'
import { ScheduleTheme } from '../types'

interface BackgroundDotsProps {
  theme: ScheduleTheme;
}

export default function BackgroundDots({ theme }: BackgroundDotsProps) {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
      <Canvas
        eventSource={typeof window !== 'undefined' ? document.body : undefined}
        eventPrefix="client"
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.NoToneMapping
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene appTheme={theme} />
      </Canvas>
    </div>
  )
}
