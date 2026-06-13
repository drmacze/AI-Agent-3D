import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export function PostProcessingEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.22}
        luminanceSmoothing={0.9}
        intensity={0.85}
        levels={6}
        mipmapBlur
      />
      <Vignette
        offset={0.22}
        darkness={0.55}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
