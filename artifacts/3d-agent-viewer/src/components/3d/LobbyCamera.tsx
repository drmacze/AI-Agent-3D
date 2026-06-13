import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export function LobbyCamera() {
  const { camera } = useThree()
  const t = useRef(0)
  const look = useRef(new THREE.Vector3())

  useEffect(() => {
    const pc = camera as unknown as THREE.PerspectiveCamera
    pc.fov = 55
    pc.updateProjectionMatrix()
  }, [camera])

  useFrame((_, delta) => {
    t.current += delta * 0.06
    const angle = t.current
    const radius = 14 + Math.sin(t.current * 0.4) * 2
    const height = 6.5 + Math.sin(t.current * 0.25) * 1.5

    camera.position.x = Math.sin(angle) * radius
    camera.position.y = height
    camera.position.z = Math.cos(angle) * radius

    // Slowly look at slightly offset target for cinematic feel
    const targetX = Math.sin(t.current * 0.3) * 2
    const targetZ = Math.cos(t.current * 0.2) * 1.5
    look.current.lerp(new THREE.Vector3(targetX, 1.2, targetZ), 0.015)
    camera.lookAt(look.current)
  })

  return null
}
