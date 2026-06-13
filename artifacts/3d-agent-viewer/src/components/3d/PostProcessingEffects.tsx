import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export function PostProcessingEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.65}
        luminanceSmoothing={0.7}
        intensity={0.09}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.45}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
