import { useMemo } from 'react'
import { EffectComposer, Bloom, Vignette, DepthOfField, ChromaticAberration, HueSaturation } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'

const FLOOR_GRADING: Record<number, { hue: number; saturation: number }> = {
  1: { hue:  0.00, saturation:  0.10 },
  2: { hue:  0.04, saturation:  0.18 },
  3: { hue: -0.02, saturation:  0.12 },
  4: { hue:  0.05, saturation:  0.22 },
  5: { hue:  0.03, saturation:  0.14 },
}

interface Props {
  chatMode?: boolean
  floorId?: number
}

export function PostProcessingEffects({ chatMode = false, floorId = 1 }: Props) {
  const grading = FLOOR_GRADING[floorId] ?? FLOOR_GRADING[1]
  const aberrationOffset = useMemo(() => new Vector2(0.0004, 0.0002), [])

  return (
    <EffectComposer multisampling={0}>
      <HueSaturation
        hue={grading.hue}
        saturation={grading.saturation}
        blendFunction={BlendFunction.NORMAL}
      />
      <Bloom
        luminanceThreshold={0.52}
        luminanceSmoothing={0.85}
        intensity={chatMode ? 0.28 : 0.16}
        mipmapBlur
      />
      {chatMode && (
        <DepthOfField
          focusDistance={0.007}
          focalLength={0.022}
          bokehScale={2.8}
        />
      )}
      <ChromaticAberration
        offset={aberrationOffset}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette
        offset={0.32}
        darkness={chatMode ? 0.65 : 0.48}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
