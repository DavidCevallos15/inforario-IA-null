'use client'

import React, { useMemo, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { shaderMaterial, useTrailTexture } from '@react-three/drei'
import * as THREE from 'three'
import { ScheduleTheme } from '../types'

// Material definition
const DotMaterial = shaderMaterial(
  {
    time: 0,
    resolution: new THREE.Vector2(),
    dotColor: new THREE.Color('#FFFFFF'),
    bgColor: new THREE.Color('#121212'),
    mouseTrail: null,
    render: 0,
    rotation: 0,
    gridSize: 50,
    dotOpacity: 0.05
  },
  `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  `uniform float time;
    uniform int render;
    uniform vec2 resolution;
    uniform vec3 dotColor;
    uniform vec3 bgColor;
    uniform sampler2D mouseTrail;
    uniform float rotation;
    uniform float gridSize;
    uniform float dotOpacity;
    vec2 rotate(vec2 uv, float angle) {
      float s = sin(angle);
      float c = cos(angle);
      mat2 rotationMatrix = mat2(c, -s, s, c);
      return rotationMatrix * (uv - 0.5) + 0.5;
    }
    vec2 coverUv(vec2 uv) {
      vec2 s = resolution.xy / max(resolution.x, resolution.y);
      vec2 newUv = (uv - 0.5) * s + 0.5;
      return clamp(newUv, 0.0, 1.0);
    }
    float sdfCircle(vec2 p, float r) {
      return length(p - 0.5) - r;
    }
    void main() {
      vec2 screenUv = gl_FragCoord.xy / resolution;
      vec2 uv = coverUv(screenUv);
      vec2 rotatedUv = rotate(uv, rotation);
      vec2 gridUv = fract(rotatedUv * gridSize);
      vec2 gridUvCenterInScreenCoords = rotate((floor(rotatedUv * gridSize) + 0.5) / gridSize, -rotation);
      float baseDot = sdfCircle(gridUv, 0.25);
      float screenMask = smoothstep(0.0, 1.0, 1.0 - uv.y);
      vec2 centerDisplace = vec2(0.7, 1.1);
      float circleMaskCenter = length(uv - centerDisplace);
      float circleMaskFromCenter = smoothstep(0.5, 1.0, circleMaskCenter);
      float combinedMask = screenMask * circleMaskFromCenter;
      float circleAnimatedMask = sin(time * 2.0 + circleMaskCenter * 10.0);
      float mouseInfluence = texture2D(mouseTrail, gridUvCenterInScreenCoords).r;
      float scaleInfluence = max(mouseInfluence * 0.5, circleAnimatedMask * 0.3);
      float dotSize = min(pow(circleMaskCenter, 2.0) * 0.3, 0.3);
      float sdfDot = sdfCircle(gridUv, dotSize * (1.0 + scaleInfluence * 0.5));
      float smoothDot = smoothstep(0.05, 0.0, sdfDot);
      float opacityInfluence = max(mouseInfluence * 50.0, circleAnimatedMask * 0.5);
      vec3 composition = mix(bgColor, dotColor, smoothDot * combinedMask * dotOpacity * (1.0 + opacityInfluence));
      gl_FragColor = vec4(composition, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
)

interface SceneProps {
  appTheme: ScheduleTheme;
}

// Theme color configurations
const THEME_COLORS: Record<ScheduleTheme, { dotColor: string; bgColor: string; dotOpacity: number }> = {
  DEFAULT: { dotColor: '#00F0FF', bgColor: '#0A0E27', dotOpacity: 0.15 },
  MINIMALIST: { dotColor: '#000000', bgColor: '#FFFFFF', dotOpacity: 0.15 },
  SCHOOL: { dotColor: '#EA580C', bgColor: '#FFFDF0', dotOpacity: 0.15 },
  NEON: { dotColor: '#22D3EE', bgColor: '#0F172A', dotOpacity: 0.15 },
};

export function Scene({ appTheme }: SceneProps) {
  const size = useThree((s) => s.size)
  const viewport = useThree((s) => s.viewport)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  
  const rotation = 0
  const gridSize = 100

  const themeColors = THEME_COLORS[appTheme] || THEME_COLORS.DEFAULT;

  const [trail, onMove] = useTrailTexture({
    size: 512,
    radius: 0.1,
    maxAge: 400,
    interpolate: 1,
    ease: function easeInOutCirc(x: number) {
      return x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 :
        (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2
    }
  })

  // @ts-ignore - shaderMaterial creates a class but TS might not infer it correctly
  const dotMaterial = useMemo(() => new DotMaterial(), [])

  // Store reference for cleanup
  useEffect(() => {
    materialRef.current = dotMaterial;
  }, [dotMaterial]);

  // Update theme colors
  useEffect(() => {
    dotMaterial.uniforms.dotColor.value.setHex(parseInt(themeColors.dotColor.replace('#', '0x'), 16))
    dotMaterial.uniforms.bgColor.value.setHex(parseInt(themeColors.bgColor.replace('#', '0x'), 16))
    dotMaterial.uniforms.dotOpacity.value = themeColors.dotOpacity
  }, [appTheme, dotMaterial, themeColors])

  // Cleanup resources on unmount
  useEffect(() => {
    return () => {
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      // Dispose trail texture if it has dispose method
      if (trail && 'dispose' in trail && typeof trail.dispose === 'function') {
        trail.dispose();
      }
    };
  }, [trail]);

  // Throttled animation update for performance
  useFrame((state, delta) => {
    // Cap delta to prevent large jumps when tab regains focus
    const cappedDelta = Math.min(delta, 0.1);
    dotMaterial.uniforms.time.value += cappedDelta;
  })

  const handlePointerMove = (e: any) => onMove(e)
  
  const scale = Math.max(viewport.width, viewport.height) / 2

  // Aliasing for JSX type compatibility
  const Mesh = 'mesh' as any;
  const PlaneGeometry = 'planeGeometry' as any;
  const Primitive = 'primitive' as any;

  return (
    <Mesh scale={[scale, scale, 1]} onPointerMove={handlePointerMove}>
      <PlaneGeometry args={[2, 2]} />
      <Primitive
        object={dotMaterial}
        resolution={[size.width * viewport.dpr, size.height * viewport.dpr]}
        rotation={rotation}
        gridSize={gridSize}
        mouseTrail={trail}
        render={0}
      />
    </Mesh>
  )
}
