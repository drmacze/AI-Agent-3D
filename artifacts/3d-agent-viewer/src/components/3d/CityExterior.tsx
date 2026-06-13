import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Building({ pos, w, h, d, color, winColor }: {
  pos: [number, number, number]; w: number; h: number; d: number; color: string; winColor: string
}) {
  const windowRows = Math.floor(h / 0.9)
  const windowCols = Math.floor(w / 0.7)
  return (
    <group position={pos}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {Array.from({ length: windowRows }, (_, r) =>
        Array.from({ length: windowCols }, (_, c) => {
          const lit = Math.random() > 0.3
          const wx = (c - (windowCols - 1) / 2) * 0.7
          const wy = 0.8 + r * 0.9
          return (
            <mesh key={`${r}-${c}`} position={[wx, wy, d / 2 + 0.01]}>
              <boxGeometry args={[0.32, 0.44, 0.02]} />
              <meshLambertMaterial color={lit ? winColor : '#0a0a14'} emissive={lit ? winColor : '#0'} emissiveIntensity={lit ? 0.6 : 0} />
            </mesh>
          )
        })
      )}
    </group>
  )
}

function AnimatedCar({ startX, z, speed, color }: { startX: number; z: number; speed: number; color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (!ref.current) return
    ref.current.position.x += speed * dt
    if (speed > 0 && ref.current.position.x > 28) ref.current.position.x = -28
    if (speed < 0 && ref.current.position.x < -28) ref.current.position.x = 28
  })
  return (
    <group ref={ref} position={[startX, 0.15, z]}>
      <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.6, 0.22, 0.28]} /><meshLambertMaterial color={color} /></mesh>
      <mesh position={[0, 0.28, 0]}><boxGeometry args={[0.36, 0.14, 0.22]} /><meshLambertMaterial color={color} transparent opacity={0.85} /></mesh>
      <mesh position={[0.2, 0.1, 0.15]}><boxGeometry args={[0.08, 0.08, 0.08]} /><meshLambertMaterial color="#fffff0" emissive="#fffff0" emissiveIntensity={0.9} /></mesh>
      <mesh position={[-0.2, 0.1, -0.15]}><boxGeometry args={[0.08, 0.08, 0.08]} /><meshLambertMaterial color="#ff2020" emissive="#ff2020" emissiveIntensity={0.9} /></mesh>
    </group>
  )
}

const BUILDINGS_FRONT = [
  { pos: [20, 0, -4] as [number, number, number], w: 4.5, h: 14, d: 5, color: '#2a3040', winColor: '#f0e090' },
  { pos: [26, 0, -6] as [number, number, number], w: 3.5, h: 20, d: 4.5, color: '#1e2535', winColor: '#90d0ff' },
  { pos: [32, 0, -3] as [number, number, number], w: 5, h: 9, d: 5.5, color: '#252a38', winColor: '#ffe090' },
  { pos: [38, 0, -5] as [number, number, number], w: 4, h: 16, d: 4, color: '#1a2030', winColor: '#aaffcc' },
  { pos: [44, 0, -4] as [number, number, number], w: 6, h: 11, d: 5, color: '#22283a', winColor: '#f0b080' },
  { pos: [20, 0, 5] as [number, number, number], w: 3, h: 8, d: 4, color: '#2d3445', winColor: '#d0f0ff' },
  { pos: [28, 0, 6] as [number, number, number], w: 4, h: 12, d: 5, color: '#1e2838', winColor: '#ffeeaa' },
  { pos: [36, 0, 4] as [number, number, number], w: 5, h: 18, d: 4.5, color: '#202840', winColor: '#aaccff' },
]

const BUILDINGS_BACK = [
  { pos: [-4, 0, -20] as [number, number, number], w: 5, h: 13, d: 4, color: '#1a2030', winColor: '#f0e080' },
  { pos: [4, 0, -22] as [number, number, number], w: 4, h: 18, d: 5, color: '#252a38', winColor: '#80e0ff' },
  { pos: [12, 0, -19] as [number, number, number], w: 4.5, h: 10, d: 4, color: '#202535', winColor: '#f0a070' },
  { pos: [-12, 0, -20] as [number, number, number], w: 5, h: 15, d: 4.5, color: '#1e2840', winColor: '#c0ffaa' },
  { pos: [-18, 0, -18] as [number, number, number], w: 4, h: 22, d: 5, color: '#18202e', winColor: '#ffffaa' },
  { pos: [0, 0, -28] as [number, number, number], w: 7, h: 8, d: 4, color: '#28303a', winColor: '#ffaacc' },
]

const CARS = [
  { startX: -12, z: 14, speed: 5.5, color: '#c0392b' },
  { startX: 6, z: 14.6, speed: -4, color: '#2980b9' },
  { startX: -4, z: 15.2, speed: 6, color: '#27ae60' },
  { startX: 18, z: 14, speed: -5, color: '#f39c12' },
  { startX: -8, z: 15.6, speed: 3.5, color: '#8e44ad' },
  { startX: 16, z: -20, speed: -5, color: '#16a085' },
  { startX: -6, z: -20.4, speed: 4.5, color: '#e74c3c' },
]

export function CityExterior() {
  const skyRef = useRef<THREE.Mesh>(null)

  return (
    <group>
      {/* Ground plane extending beyond office */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, -0.02, 0]}>
        <planeGeometry args={[60, 40]} />
        <meshLambertMaterial color="#141820" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -18]}>
        <planeGeometry args={[40, 40]} />
        <meshLambertMaterial color="#141820" />
      </mesh>

      {/* Road markings */}
      {[-0.5, 0.5].map((dz, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[18, 0.01, 14.5 + dz * 0.6]}>
          <planeGeometry args={[60, 0.14]} />
          <meshLambertMaterial color="#ffffff" transparent opacity={0.25} />
        </mesh>
      ))}
      {[-0.5, 0.5].map((dz, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -20 + dz * 0.6]}>
          <planeGeometry args={[40, 0.14]} />
          <meshLambertMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>
      ))}

      {/* Buildings — right side (visible through right wall windows) */}
      {BUILDINGS_FRONT.map((b, i) => <Building key={`fr-${i}`} {...b} />)}

      {/* Buildings — back (visible through back wall / above back wall) */}
      {BUILDINGS_BACK.map((b, i) => <Building key={`bk-${i}`} {...b} />)}

      {/* Animated cars */}
      {CARS.map((c, i) => <AnimatedCar key={i} {...c} />)}

      {/* Street lights */}
      {[-8, -2, 4, 10, 16].map((x, i) => (
        <group key={i} position={[x + 14, 0, 14]}>
          <mesh position={[0, 2.5, 0]}><cylinderGeometry args={[0.06, 0.06, 5, 6]} /><meshLambertMaterial color="#888" /></mesh>
          <mesh position={[0.6, 4.9, 0]}><cylinderGeometry args={[0.04, 0.04, 1.2, 6]} /><meshLambertMaterial color="#888" /></mesh>
          <mesh position={[0.7, 4.9, 0]}><sphereGeometry args={[0.15, 6, 5]} /><meshLambertMaterial color="#fffde0" emissive="#fffde0" emissiveIntensity={1.2} /></mesh>
          <pointLight color="#fff8d0" intensity={0.6} distance={6} position={[0.7, 4.9, 0]} />
        </group>
      ))}
    </group>
  )
}
