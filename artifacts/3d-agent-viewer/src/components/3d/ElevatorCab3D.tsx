import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import * as THREE from "three"
import { useFloor, FLOOR_THEMES, type FloorId } from "@/context/FloorContext"

// Elevator cab:
// Interior x: -14.0 to -11.85, z: -1.45 to 1.45, y: 0 to 4
// Door opening at x=-11.85 face, z: -1.3 to 1.3, y: 0 to 3

export function ElevatorCab3D() {
  const { isElevatorOpen, isRiding, setFloor, currentFloor, openElevator } = useFloor()
  const leftDoorRef  = useRef<THREE.Mesh>(null)
  const rightDoorRef = useRef<THREE.Mesh>(null)
  const [hoveredFloor, setHoveredFloor] = useState<FloorId | null>(null)

  const shouldOpen = isElevatorOpen && !isRiding

  useFrame((_, delta) => {
    if (!leftDoorRef.current || !rightDoorRef.current) return
    const speed   = delta * 3.5
    const openZ   = 1.58
    const closedZ = 0.65
    const targetZ = shouldOpen ? openZ : closedZ
    leftDoorRef.current.position.z  = THREE.MathUtils.lerp(leftDoorRef.current.position.z,  targetZ, speed)
    rightDoorRef.current.position.z = THREE.MathUtils.lerp(rightDoorRef.current.position.z, -targetZ, speed)
  })

  const floors: FloorId[] = [5, 4, 3, 2, 1]

  return (
    <group>
      {/* === EXTERIOR ELEVATOR SURROUND === */}
      {/* Top trim (gold) */}
      <mesh position={[-11.86, 3.5, 0]}>
        <boxGeometry args={[0.1, 1.0, 2.92]} />
        <meshLambertMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.28} />
      </mesh>
      {/* Left door frame post */}
      <mesh position={[-11.86, 1.5, 1.44]}>
        <boxGeometry args={[0.1, 3.0, 0.1]} />
        <meshLambertMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.2} />
      </mesh>
      {/* Right door frame post */}
      <mesh position={[-11.86, 1.5, -1.44]}>
        <boxGeometry args={[0.1, 3.0, 0.1]} />
        <meshLambertMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.2} />
      </mesh>

      {/* === SLIDING DOOR PANELS === */}
      {/* Left panel (slides to z+) */}
      <mesh ref={leftDoorRef} position={[-11.86, 1.5, 0.65]}>
        <boxGeometry args={[0.07, 3.0, 1.3]} />
        <meshLambertMaterial color="#1c1e2c" />
      </mesh>
      {/* Left panel center stripe */}
      <mesh position={[0, 0, 0]}>
        {/* decorative handled in left door group - skip for perf */}
      </mesh>

      {/* Right panel (slides to z-) */}
      <mesh ref={rightDoorRef} position={[-11.86, 1.5, -0.65]}>
        <boxGeometry args={[0.07, 3.0, 1.3]} />
        <meshLambertMaterial color="#1c1e2c" />
      </mesh>

      {/* === OUTSIDE CALL PANEL === */}
      <mesh position={[-11.65, 1.2, 0.84]}>
        <boxGeometry args={[0.05, 0.45, 0.28]} />
        <meshLambertMaterial color="#1a1c28" />
      </mesh>
      {/* ▲ up button */}
      <mesh
        position={[-11.62, 1.32, 0.84]}
        onClick={(e) => { e.stopPropagation(); openElevator() }}
      >
        <boxGeometry args={[0.02, 0.07, 0.07]} />
        <meshLambertMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={isElevatorOpen ? 1.0 : 0.4}
        />
      </mesh>
      {/* ▼ down button */}
      <mesh position={[-11.62, 1.12, 0.84]}>
        <boxGeometry args={[0.02, 0.07, 0.07]} />
        <meshLambertMaterial color="#3a3c4e" />
      </mesh>

      {/* Floor indicator display (outside, above door) */}
      <mesh position={[-11.78, 3.12, 0]}>
        <boxGeometry args={[0.04, 0.3, 0.55]} />
        <meshLambertMaterial
          color="#050810"
          emissive={FLOOR_THEMES[currentFloor].accent}
          emissiveIntensity={0.7}
        />
      </mesh>

      {/* === CAB INTERIOR WALLS === */}
      {/* Back wall (west) */}
      <mesh position={[-14.02, 2, 0]}>
        <boxGeometry args={[0.1, 4.1, 2.94]} />
        <meshLambertMaterial color="#22253a" />
      </mesh>
      {/* Left wall (z+) */}
      <mesh position={[-12.93, 2, 1.47]}>
        <boxGeometry args={[2.28, 4.1, 0.1]} />
        <meshLambertMaterial color="#22253a" />
      </mesh>
      {/* Right wall (z-) */}
      <mesh position={[-12.93, 2, -1.47]}>
        <boxGeometry args={[2.28, 4.1, 0.1]} />
        <meshLambertMaterial color="#22253a" />
      </mesh>
      {/* Ceiling */}
      <mesh position={[-12.93, 4.06, 0]}>
        <boxGeometry args={[2.28, 0.1, 2.94]} />
        <meshLambertMaterial color="#1a1c28" />
      </mesh>
      {/* Cab floor */}
      <mesh position={[-12.93, 0.018, 0]}>
        <boxGeometry args={[2.28, 0.036, 2.8]} />
        <meshLambertMaterial color="#34374e" />
      </mesh>
      {/* Ceiling light panel */}
      <mesh position={[-12.93, 3.92, 0]}>
        <boxGeometry args={[1.1, 0.035, 0.65]} />
        <meshLambertMaterial color="#fffff4" emissive="#fffff4" emissiveIntensity={0.9} />
      </mesh>
      <pointLight color="#fffbe8" intensity={1.4} distance={4.5} position={[-12.93, 3.85, 0]} />

      {/* Handrail on back wall */}
      <mesh position={[-13.92, 1.05, 0]}>
        <boxGeometry args={[0.03, 0.06, 2.0]} />
        <meshLambertMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[-13.92, 1.05, -1.0]}><boxGeometry args={[0.03, 0.22, 0.04]} /><meshLambertMaterial color="#c8a020" /></mesh>
      <mesh position={[-13.92, 1.05, 1.0]}><boxGeometry args={[0.03, 0.22, 0.04]} /><meshLambertMaterial color="#c8a020" /></mesh>

      {/* === FLOOR BUTTON PANEL (inside right wall z=1.42) === */}
      {/* Panel housing */}
      <mesh position={[-12.55, 2.2, 1.4]}>
        <boxGeometry args={[0.45, 1.9, 0.06]} />
        <meshLambertMaterial color="#13141f" />
      </mesh>
      {/* Panel border glow */}
      <mesh position={[-12.55, 2.2, 1.43]}>
        <boxGeometry args={[0.47, 1.92, 0.01]} />
        <meshLambertMaterial color="#c8a020" emissive="#c8a020" emissiveIntensity={0.12} />
      </mesh>

      {/* Floor number buttons */}
      {floors.map((floor, i) => {
        const theme  = FLOOR_THEMES[floor]
        const isCurrent = floor === currentFloor
        const isHovered = hoveredFloor === floor
        const by = 2.96 - i * 0.38

        return (
          <group key={floor}>
            {/* Button face */}
            <mesh
              position={[-12.55, by, 1.44]}
              onPointerOver={(e) => { e.stopPropagation(); setHoveredFloor(floor) }}
              onPointerOut={() => setHoveredFloor(null)}
              onClick={(e) => { e.stopPropagation(); if (!isCurrent) setFloor(floor) }}
            >
              <boxGeometry args={[0.1, 0.1, 0.04]} />
              <meshLambertMaterial
                color={isCurrent ? "#ffd700" : isHovered ? "#c8d4ff" : "#1e2038"}
                emissive={isCurrent ? "#ffd700" : isHovered ? "#8899ff" : theme.accent}
                emissiveIntensity={isCurrent ? 0.95 : isHovered ? 0.55 : 0.18}
              />
            </mesh>
            {/* Button label */}
            <Html
              position={[-12.38, by, 1.44]}
              center
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              <div style={{
                color: isCurrent ? "#ffd700" : "rgba(200,200,220,0.7)",
                fontSize: 7, fontWeight: 800, fontFamily: "monospace",
              }}>
                {floor}
              </div>
            </Html>
            {/* Tiny emoji label */}
            <Html
              position={[-12.7, by, 1.44]}
              center
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              <div style={{ fontSize: 7 }}>{theme.emoji}</div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}
