import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'

function DevMonitor({ pos, hue }: { pos: [number, number, number]; hue: string }) {
  const ref = useRef<THREE.Mesh>(null)
  const phase = useRef(Math.random() * Math.PI * 2)
  useFrame(state => {
    if (!ref.current) return
    const mat = ref.current.material as THREE.MeshLambertMaterial
    mat.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 1.2 + phase.current) * 0.15
  })
  return (
    <group position={pos}>
      <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.06, 0.22, 0.06]} /><meshLambertMaterial color="#222" /></mesh>
      <mesh ref={ref} position={[0, 0.52, 0]}>
        <boxGeometry args={[0.7, 0.46, 0.04]} />
        <meshLambertMaterial color="#0a0f14" emissive={hue} emissiveIntensity={0.5} />
      </mesh>
      {/* Code lines */}
      {[0.14, 0.06, -0.02, -0.1].map((y, i) => (
        <mesh key={i} position={[-(0.1 - (i % 2) * 0.05), 0.52 + y, 0.026]}>
          <boxGeometry args={[0.18 + (i % 3) * 0.1, 0.025, 0.005]} />
          <meshLambertMaterial color={hue} emissive={hue} emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function ServerRack() {
  const lightRef = useRef<THREE.PointLight>(null)
  useFrame(state => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.3 + Math.sin(state.clock.elapsedTime * 3.5) * 0.12
    }
  })
  return (
    <group position={[0.5, 0, 0.1]}>
      <mesh position={[0, 0.9, 0]}><boxGeometry args={[0.5, 1.8, 0.35]} /><meshLambertMaterial color="#111" /></mesh>
      {[0.2, 0.5, 0.8, 1.1, 1.4].map((y, i) => (
        <mesh key={i} position={[0, y, 0.18]}>
          <boxGeometry args={[0.44, 0.22, 0.01]} />
          <meshLambertMaterial color="#0d1520" emissive={i % 2 === 0 ? '#00ff88' : '#3388ff'} emissiveIntensity={0.55} />
        </mesh>
      ))}
      {[0.2, 0.6, 1.0, 1.5].map((y, i) => (
        <mesh key={i} position={[0.18, y, 0.19]}>
          <sphereGeometry args={[0.025, 6, 5]} />
          <meshLambertMaterial color={i % 2 === 0 ? '#00ff00' : '#ff4400'} emissive={i % 2 === 0 ? '#00ff00' : '#ff4400'} emissiveIntensity={1.2} />
        </mesh>
      ))}
      <pointLight ref={lightRef} color="#00ff88" intensity={0.3} distance={4} position={[0, 1, 0.5]} />
    </group>
  )
}

export function DeveloperRoom() {
  const { user, devRoomOpen, setDevRoomOpen } = useGameStore()
  const isDev = user?.isDev ?? false
  const [doorAjar, setDoorAjar] = useState(false)
  const [shake, setShake] = useState(false)
  const doorRef = useRef<THREE.Group>(null)
  const shakeRef = useRef(0)
  const nameGlowRef = useRef<THREE.Mesh>(null)

  // Auto-open door for dev
  useEffect(() => {
    if (isDev && devRoomOpen) setDoorAjar(true)
  }, [isDev, devRoomOpen])

  useFrame((state, dt) => {
    if (!doorRef.current) return
    const targetRot = doorAjar ? -Math.PI / 2 : 0
    doorRef.current.rotation.y = THREE.MathUtils.lerp(doorRef.current.rotation.y, targetRot, 8 * dt)
    if (shake) {
      shakeRef.current += dt * 40
      doorRef.current.position.x = 12.6 + Math.sin(shakeRef.current) * 0.03
    } else {
      doorRef.current.position.x = 12.6
    }
    if (nameGlowRef.current) {
      const mat = nameGlowRef.current.material as THREE.MeshLambertMaterial
      mat.emissiveIntensity = 0.3 + Math.abs(Math.sin(state.clock.elapsedTime * 1.5)) * 0.4
    }
  })

  function handleDoorClick() {
    if (isDev) {
      setDevRoomOpen(!devRoomOpen)
      setDoorAjar(!doorAjar)
    } else {
      setShake(true)
      setTimeout(() => setShake(false), 700)
    }
  }

  // Room position: back-right corner x=10..14, z=-7..-10
  const RX = 12.5, RZ = -8

  return (
    <group>
      {/* Door frame */}
      <mesh position={[13.88, 1.35, -7.5]}>
        <boxGeometry args={[0.05, 2.7, 1.4]} />
        <meshLambertMaterial color="#5a3010" />
      </mesh>
      {/* Door (pivot at left edge x=12.6, z=-7.5) */}
      <group ref={doorRef} position={[12.6, 0, -7.5]}>
        <mesh position={[0.65, 1.35, 0]}>
          <boxGeometry args={[1.3, 2.7, 0.07]} />
          <meshLambertMaterial color="#3a1a08" />
        </mesh>
        {/* Door window */}
        <mesh position={[0.65, 1.5, 0.04]}>
          <boxGeometry args={[0.4, 0.5, 0.01]} />
          <meshLambertMaterial color="#1a3a5a" transparent opacity={0.8} emissive="#4488ff" emissiveIntensity={isDev ? 0.5 : 0.15} />
        </mesh>
        {/* Door handle */}
        <mesh position={[1.1, 1.3, 0.07]}><sphereGeometry args={[0.045, 8, 6]} /><meshLambertMaterial color="#c8a830" /></mesh>
      </group>

      {/* Nameplate above door */}
      <group position={[13.3, 2.82, -7.5]}>
        <mesh><boxGeometry args={[0.95, 0.24, 0.07]} /><meshLambertMaterial color="#1a1028" /></mesh>
        <mesh ref={nameGlowRef} position={[0, 0, 0.04]}>
          <boxGeometry args={[0.93, 0.22, 0.01]} />
          <meshLambertMaterial color="#7c3aed" emissive="#7c3aed" emissiveIntensity={0.35} transparent opacity={0.85} />
        </mesh>
        <Html position={[0, 0, 0.08]} center style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#c4b5fd', letterSpacing: 1, textShadow: '0 0 8px #7c3aed', whiteSpace: 'nowrap' }}>
            {isDev ? '⚡ DRMACZE' : '🔐 DRMACZE'}
          </div>
        </Html>
      </group>

      {/* Lock indicator */}
      <Html position={[13.4, 1.35, -7.5]} center style={{ pointerEvents: 'auto' }}>
        <div onClick={handleDoorClick}
          style={{ cursor: 'pointer', fontSize: 22, filter: isDev ? 'drop-shadow(0 0 8px #7c3aed)' : 'none', userSelect: 'none' }}
          title={isDev ? 'Developer Room — Click to open' : 'Access Denied — Developer only'}>
          {isDev ? (doorAjar ? '🟢' : '🔓') : '🔒'}
        </div>
      </Html>

      {/* Ambient glow when door is open */}
      {doorAjar && (
        <pointLight color="#7c3aed" intensity={0.8} distance={6} position={[RX - 1, 1.5, RZ]} />
      )}

      {/* Dev room interior (only visible when door is open) */}
      {doorAjar && (
        <group position={[RX - 0.8, 0, RZ]}>
          {/* Room walls */}
          <mesh position={[-0.5, 2, -1.5]}><planeGeometry args={[3, 4]} /><meshLambertMaterial color="#0d0818" /></mesh>
          <mesh position={[-2, 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[3, 4]} /><meshLambertMaterial color="#0a0614" /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.8, 0.01, 0]}><planeGeometry args={[3, 3]} /><meshLambertMaterial color="#0a0818" /></mesh>

          {/* Desk */}
          <mesh position={[-0.8, 0.75, -1.1]}><boxGeometry args={[1.8, 0.07, 0.7]} /><meshLambertMaterial color="#1a0a2a" /></mesh>

          {/* Triple monitors */}
          <DevMonitor pos={[-1.2, 0.75, -1.35]} hue="#00ff88" />
          <DevMonitor pos={[-0.8, 0.75, -1.38]} hue="#4488ff" />
          <DevMonitor pos={[-0.4, 0.75, -1.35]} hue="#ff44aa" />

          {/* Server rack */}
          <ServerRack />

          {/* Chair */}
          <mesh position={[-0.8, 0.44, -0.55]}><boxGeometry args={[0.44, 0.06, 0.44]} /><meshLambertMaterial color="#2a1040" /></mesh>
          <mesh position={[-0.8, 0.75, -0.9]}><boxGeometry args={[0.44, 0.55, 0.07]} /><meshLambertMaterial color="#2a1040" /></mesh>

          {/* Dev room plaque */}
          <Html position={[-0.8, 2.5, -1.45]} center style={{ pointerEvents: 'none' }}>
            <div style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 8, padding: '4px 10px', color: '#c4b5fd', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 0 10px #7c3aed' }}>
              ⚡ Developer Mode — Welcome, {user?.username}
            </div>
          </Html>

          <pointLight color="#7c3aed" intensity={0.6} distance={5} position={[-0.8, 3.2, -0.8]} />
          <pointLight color="#00ff88" intensity={0.3} distance={3} position={[0.5, 1.5, -1]} />
        </group>
      )}
    </group>
  )
}
