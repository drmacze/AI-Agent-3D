import { useMemo } from 'react'
import { EffectComposer, Bloom, Vignette, DepthOfField, ChromaticAberration, HueSaturation } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import type { GraphicsQuality } from '@/context/SettingsContext'

const FLOOR_GRADING: Record<number, { hue: number; saturation: number }> = {
  1: { hue:  0.00, saturation:  0.12 },
  2: { hue:  0.04, saturation:  0.20 },
  3: { hue: -0.02, saturation:  0.14 },
  4: { hue:  0.05, saturation:  0.24 },
  5: { hue:  0.03, saturation:  0.16 },
}

interface Props {
  chatMode?: boolean
  floorId?: number
  quality?: GraphicsQuality
}

export function PostProcessingEffects({ chatMode = false, floorId = 1, quality = 'high' }: Props) {
  const grading = FLOOR_GRADING[floorId] ?? FLOOR_GRADING[1]
  const aberrationOffset = useMemo(() => new Vector2(0.0004, 0.0002), [])

  const isLow    = quality === 'low'
  const isMobile = quality === 'mobile'
  const isMedium = quality === 'medium'

  const showBloom    = !isLow && !isMobile && !isMedium
  const showCA       = !isLow && !isMobile && !isMedium
  const showDoF      = chatMode && !isLow && !isMobile && !isMedium
  const showVignette = !isLow

  // On low quality, only HueSaturation (very cheap, big visual payoff)
  // On mobile quality, HueSaturation + Vignette (both cheap, great visual polish)
  // On medium+, full stack minus CA/DoF
  // On high/ultra, everything

  return (
    <EffectComposer multisampling={0}>
      <HueSaturation
        hue={grading.hue}
        saturation={isMobile ? grading.saturation + 0.08 : grading.saturation}
        blendFunction={BlendFunction.NORMAL}
      />
      {showBloom && (
        <Bloom
          luminanceThreshold={0.52}
          luminanceSmoothing={0.85}
          intensity={chatMode ? 0.28 : 0.18}
          mipmapBlur
        />
      )}
      {showDoF && (
        <DepthOfField
          focusDistance={0.007}
          focalLength={0.022}
          bokehScale={2.8}
        />
      )}
      {showCA && (
        <ChromaticAberration
          offset={aberrationOffset}
          blendFunction={BlendFunction.NORMAL}
          radialModulation={false}
          modulationOffset={0}
        />
      )}
      {showVignette && (
        <Vignette
          offset={isMobile ? 0.28 : 0.32}
          darkness={chatMode ? 0.65 : (isMobile ? 0.42 : 0.48)}
          blendFunction={BlendFunction.NORMAL}
        />
      )}
    </EffectComposer>
  )
}
