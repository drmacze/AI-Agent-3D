import { useMemo } from "react"
import * as THREE from "three"
import { FLOOR_THEMES, type FloorId } from "@/context/FloorContext"

// ── Ceiling System ─────────────────────────────────────────────────────────────
interface CeilingProps { floorId: FloorId; isLow?: boolean; isMobile?: boolean }
export function CeilingSystem({ floorId, isLow = false, isMobile = false }: CeilingProps) {
  const theme = FLOOR_THEMES[floorId]

  const hLines = useMemo(() => {
    const lines: number[] = []
    for (let z = -8.8; z <= 9; z += 2.2) lines.push(z)
    return lines
  }, [])
  const vLines = useMemo(() => {
    const lines: number[] = []
    for (let x = -13.2; x <= 13.2; x += 2.2) lines.push(x)
    return lines
  }, [])

  const lightPanels: [number, number][] = [
    [-7,  -4.5], [-2, -4.5], [3,  -4.5],
    [-7,   4.5], [-2,  4.5], [3,   4.5],
  ]

  // 3 strategic ceiling lights — cover the main work areas without all 6
  const tubeLights: [number, number, number][] = isLow ? [] : isMobile
    ? [[0, 3.4, 0]]
    : [[-4.5, 3.5, -4.5], [0.5, 3.5, 0], [3, 3.5, 4.5]]

  return (
    <group>
      {/* Base ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.0, 0]}>
        <planeGeometry args={[28, 20]} />
        <meshStandardMaterial color="#e8e6e1" roughness={0.95} metalness={0.0} />
      </mesh>

      {/* T-bar grid horizontal */}
      {hLines.map((z, i) => (
        <mesh key={`h${i}`} position={[0, 3.992, z]}>
          <boxGeometry args={[28.2, 0.018, 0.04]} />
          <meshStandardMaterial color="#c0bdb6" roughness={0.88} metalness={0.02} />
        </mesh>
      ))}
      {/* T-bar grid vertical */}
      {vLines.map((x, i) => (
        <mesh key={`v${i}`} position={[x, 3.992, 0]}>
          <boxGeometry args={[0.04, 0.018, 20.2]} />
          <meshStandardMaterial color="#c0bdb6" roughness={0.88} metalness={0.02} />
        </mesh>
      ))}

      {/* Recessed light panels — brighter emissive = visible tube light look */}
      {lightPanels.map(([x, z], i) => (
        <group key={`lp${i}`} position={[x, 3.972, z]}>
          {/* Panel frame */}
          <mesh>
            <boxGeometry args={[1.8, 0.035, 0.55]} />
            <meshStandardMaterial color="#d8d5cf" roughness={0.82} metalness={0.06} />
          </mesh>
          {/* Emissive tube surface — high intensity for visible glow */}
          <mesh position={[0, -0.013, 0]}>
            <boxGeometry args={[1.68, 0.006, 0.45]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#fffef0"
              emissiveIntensity={2.2}
              roughness={1}
              metalness={0}
            />
          </mesh>
          {/* Second inner tube for depth */}
          <mesh position={[0.4, -0.015, 0]}>
            <boxGeometry args={[0.55, 0.004, 0.38]} />
            <meshStandardMaterial color="#fffff8" emissive="#fffff0" emissiveIntensity={1.6} roughness={1} metalness={0} />
          </mesh>
          <mesh position={[-0.4, -0.015, 0]}>
            <boxGeometry args={[0.55, 0.004, 0.38]} />
            <meshStandardMaterial color="#fffff8" emissive="#fffff0" emissiveIntensity={1.6} roughness={1} metalness={0} />
          </mesh>
          {/* Accent trim strip */}
          <mesh position={[0, -0.016, 0.24]}>
            <boxGeometry args={[1.68, 0.004, 0.012]} />
            <meshStandardMaterial
              color={theme.accent}
              emissive={theme.accent}
              emissiveIntensity={0.8}
              roughness={0.3}
            />
          </mesh>
        </group>
      ))}

      {/* Actual point lights at strategic positions — illuminate the floor below */}
      {tubeLights.map(([x, y, z], i) => (
        <pointLight
          key={`tl${i}`}
          position={[x, y, z]}
          color="#fffef0"
          intensity={isMobile ? 1.2 : 1.8}
          distance={isMobile ? 10 : 12}
          decay={1.5}
        />
      ))}
    </group>
  )
}

// ── Wall System ────────────────────────────────────────────────────────────────
export function WallSystem({ floorId }: { floorId: FloorId }) {
  const theme = FLOOR_THEMES[floorId]

  return (
    <group>
      {/* ── Main wall planes ── */}
      <mesh position={[0, 2, -10]}>
        <planeGeometry args={[28, 4]} />
        <meshStandardMaterial color="#eceae5" roughness={0.88} metalness={0.0} />
      </mesh>
      <mesh position={[0, 2, 10]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[28, 4]} />
        <meshStandardMaterial color="#f0eee9" roughness={0.88} metalness={0.0} />
      </mesh>
      <mesh position={[-14, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 4]} />
        <meshStandardMaterial color="#eeeae4" roughness={0.88} metalness={0.0} />
      </mesh>
      <mesh position={[14, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 4]} />
        <meshStandardMaterial color="#f5f2ee" roughness={0.88} metalness={0.0} />
      </mesh>

      {/* ── Feature / accent wall (south wall left section) ── */}
      <mesh position={[-7, 2, -9.94]}>
        <planeGeometry args={[8, 3.6]} />
        <meshStandardMaterial color={theme.color} roughness={0.85} metalness={0.0} />
      </mesh>
      {/* Accent vertical dividers */}
      {[-11.05, -7.05, -3.05].map((x, i) => (
        <mesh key={i} position={[x, 2.0, -9.93]}>
          <boxGeometry args={[0.05, 3.6, 0.04]} />
          <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.18} roughness={0.4} />
        </mesh>
      ))}

      {/* ── Department sign (glowing) ── */}
      <mesh position={[-7, 3.2, -9.9]}>
        <boxGeometry args={[5, 0.5, 0.06]} />
        <meshStandardMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.5} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* ── Baseboards ── */}
      <mesh position={[0,   0.075, -9.97]}>
        <boxGeometry args={[28, 0.15, 0.04]} />
        <meshStandardMaterial color="#a8a09a" roughness={0.72} metalness={0.06} />
      </mesh>
      <mesh position={[0,   0.075, 9.97]}>
        <boxGeometry args={[28, 0.15, 0.04]} />
        <meshStandardMaterial color="#a8a09a" roughness={0.72} metalness={0.06} />
      </mesh>
      <mesh position={[-13.97, 0.075, 0]}>
        <boxGeometry args={[0.04, 0.15, 20]} />
        <meshStandardMaterial color="#a8a09a" roughness={0.72} metalness={0.06} />
      </mesh>
      <mesh position={[13.97, 0.075, 0]}>
        <boxGeometry args={[0.04, 0.15, 20]} />
        <meshStandardMaterial color="#a8a09a" roughness={0.72} metalness={0.06} />
      </mesh>

      {/* ── Crown molding ── */}
      <mesh position={[0,   3.925, -9.97]}>
        <boxGeometry args={[28, 0.12, 0.055]} />
        <meshStandardMaterial color="#dddbd6" roughness={0.78} metalness={0.03} />
      </mesh>
      <mesh position={[0,   3.925, 9.97]}>
        <boxGeometry args={[28, 0.12, 0.055]} />
        <meshStandardMaterial color="#dddbd6" roughness={0.78} metalness={0.03} />
      </mesh>
      <mesh position={[-13.97, 3.925, 0]}>
        <boxGeometry args={[0.055, 0.12, 20]} />
        <meshStandardMaterial color="#dddbd6" roughness={0.78} metalness={0.03} />
      </mesh>
      <mesh position={[13.97, 3.925, 0]}>
        <boxGeometry args={[0.055, 0.12, 20]} />
        <meshStandardMaterial color="#dddbd6" roughness={0.78} metalness={0.03} />
      </mesh>

      {/* ── Windows (right wall, x=+14) ── */}
      {[-4, 0, 4].map((z, i) => (
        <group key={i} position={[13.95, 2.2, z]}>
          <mesh rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[2.6, 2.2]} />
            <meshStandardMaterial
              color="#c8e4f5"
              transparent
              opacity={0.88}
              emissive={theme.accent}
              emissiveIntensity={0.20}
              roughness={0.04}
              metalness={0.0}
            />
          </mesh>
          {[
            { pos: [0,  1.15, 0] as [number,number,number], size: [2.7, 0.09, 0.09] as [number,number,number] },
            { pos: [0, -1.15, 0] as [number,number,number], size: [2.7, 0.09, 0.09] as [number,number,number] },
            { pos: [-1.35, 0, 0] as [number,number,number], size: [0.09, 2.3, 0.09] as [number,number,number] },
            { pos: [ 1.35, 0, 0] as [number,number,number], size: [0.09, 2.3, 0.09] as [number,number,number] },
          ].map((f, j) => (
            <mesh key={j} position={f.pos} rotation={[0, -Math.PI / 2, 0]}>
              <boxGeometry args={f.size} />
              <meshStandardMaterial color="#e8e4de" roughness={0.55} metalness={0.18} />
            </mesh>
          ))}
          {/* Window sill */}
          <mesh position={[0, -1.12, -0.06]} rotation={[0, -Math.PI / 2, 0]}>
            <boxGeometry args={[2.65, 0.06, 0.14]} />
            <meshStandardMaterial color="#d8d4ce" roughness={0.6} metalness={0.08} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ── Per-Floor Specific Zone ────────────────────────────────────────────────────
export function PerFloorZone({ floorId }: { floorId: FloorId }) {
  const theme = FLOOR_THEMES[floorId]
  if (floorId === 1) return <EngineeringZone accent={theme.accent} />
  if (floorId === 2) return <DesignZone accent={theme.accent} />
  if (floorId === 3) return <DataAIZone accent={theme.accent} />
  if (floorId === 4) return <OpsZone accent={theme.accent} />
  return <ExecutiveZone accent={theme.accent} />
}

// ── Floor 1: Engineering — Server Rack ────────────────────────────────────────
function EngineeringZone({ accent }: { accent: string }) {
  const statusColors = useMemo(() => [
    "#00ff88", accent, "#00aaff", "#00ff88", accent, "#00ff88", "#00aaff", accent,
  ], [accent])

  return (
    <group position={[-11.5, 0, 3.5]}>
      {/* Rack frame */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.72, 2.2, 0.95]} />
        <meshStandardMaterial color="#12161f" roughness={0.35} metalness={0.55} />
      </mesh>
      {/* Rack rails */}
      {[-0.33, 0.33].map((x, ri) => (
        <mesh key={ri} position={[x, 1.1, 0.44]}>
          <boxGeometry args={[0.025, 2.1, 0.04]} />
          <meshStandardMaterial color="#1e2838" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
      {/* Rack units */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={i} position={[0, 0.22 + i * 0.245, 0]}>
          <mesh>
            <boxGeometry args={[0.66, 0.21, 0.88]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#0a0f1a" : "#0d1220"} roughness={0.28} metalness={0.62} />
          </mesh>
          {/* Front panel detail */}
          <mesh position={[0, 0, 0.445]}>
            <boxGeometry args={[0.62, 0.17, 0.01]} />
            <meshStandardMaterial color="#060a10" roughness={0.2} metalness={0.5} />
          </mesh>
          {/* Status LEDs */}
          <mesh position={[-0.24, 0.03, 0.452]}>
            <boxGeometry args={[0.011, 0.011, 0.005]} />
            <meshStandardMaterial color={statusColors[i]} emissive={statusColors[i]} emissiveIntensity={1.4} roughness={0} />
          </mesh>
          <mesh position={[-0.19, 0.03, 0.452]}>
            <boxGeometry args={[0.011, 0.011, 0.005]} />
            <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.9} roughness={0} />
          </mesh>
          {/* Drive activity bar */}
          <mesh position={[0.05, 0.0, 0.452]}>
            <boxGeometry args={[0.25, 0.022, 0.005]} />
            <meshStandardMaterial color="#1a2030" roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0.05 - 0.05 * (i % 3), 0.0, 0.453]}>
            <boxGeometry args={[0.12 + (i % 3) * 0.04, 0.014, 0.004]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.6} roughness={0} />
          </mesh>
        </group>
      ))}
      {/* Cable management panel - back */}
      {[-0.08, 0, 0.08].map((x, i) => (
        <mesh key={i} position={[x, 0.9, -0.5]}>
          <cylinderGeometry args={[0.016, 0.016, 1.8, 5]} />
          <meshStandardMaterial color={["#1a3060", "#2a1060", "#104a20"][i]} roughness={0.88} metalness={0.0} />
        </mesh>
      ))}
      {/* Floor cable run */}
      <mesh position={[0, 0.02, -0.3]}>
        <boxGeometry args={[0.18, 0.04, 0.5]} />
        <meshStandardMaterial color="#0a0e18" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  )
}

// ── Floor 2: Design — Mood Board ──────────────────────────────────────────────
const SWATCH_COLORS = [
  "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
]
const REF_COLORS   = ["#e8e4de", "#e8e4de", "#2a1f3a"]

function DesignZone({ accent }: { accent: string }) {
  const swatches = useMemo(() => SWATCH_COLORS, [])

  return (
    <group position={[-13.88, 0, -4]} rotation={[0, Math.PI / 2, 0]}>
      {/* Mood board backing panel */}
      <mesh position={[0, 2.05, 0]}>
        <boxGeometry args={[3.4, 2.2, 0.06]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.92} metalness={0.0} />
      </mesh>
      {/* Board frame */}
      <mesh position={[0, 2.05, 0.035]}>
        <boxGeometry args={[3.5, 2.3, 0.02]} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.1} emissive={accent} emissiveIntensity={0.08} />
      </mesh>
      {/* Color swatches row */}
      {swatches.map((color, i) => (
        <mesh key={i} position={[-1.5 + i * 0.33, 2.7, 0.07]}>
          <boxGeometry args={[0.28, 0.28, 0.015]} />
          <meshStandardMaterial color={color} roughness={0.85} metalness={0.0} />
        </mesh>
      ))}
      {/* Reference images */}
      {[-0.9, 0.0, 0.9].map((x, i) => (
        <group key={i} position={[x, 1.78, 0.07]}>
          <mesh>
            <boxGeometry args={[0.72, 0.88, 0.012]} />
            <meshStandardMaterial
              color={REF_COLORS[i]}
              roughness={0.88}
              metalness={0.0}
              emissive={i === 2 ? accent : "black"}
              emissiveIntensity={i === 2 ? 0.12 : 0}
            />
          </mesh>
          {/* Pin */}
          <mesh position={[0, 0.47, 0.02]}>
            <sphereGeometry args={[0.018, 6, 5]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {/* Stylus / pen on ledge */}
      <mesh position={[1.2, 1.1, 0.1]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.014, 0.009, 0.38, 8]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  )
}

// ── Floor 3: Data/AI — Visualization Display ──────────────────────────────────
const BAR_HEIGHTS = [0.28, 0.62, 0.44, 0.78, 0.36, 0.90, 0.52, 0.68]

function DataAIZone({ accent }: { accent: string }) {
  return (
    <group position={[-11.5, 0, 0]}>
      {/* Display stand */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.12, 1.0, 0.12]} />
        <meshStandardMaterial color="#12161f" roughness={0.35} metalness={0.65} />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.55, 0.06, 0.45]} />
        <meshStandardMaterial color="#0a0f1a" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Monitor bezel */}
      <mesh position={[0, 1.72, 0]}>
        <boxGeometry args={[2.45, 1.52, 0.09]} />
        <meshStandardMaterial color="#0a0f1a" roughness={0.22} metalness={0.72} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 1.72, 0.055]}>
        <boxGeometry args={[2.30, 1.38, 0.01]} />
        <meshStandardMaterial color="#020810" emissive={accent} emissiveIntensity={0.20} roughness={0.08} />
      </mesh>
      {/* Data bars */}
      {BAR_HEIGHTS.map((h, i) => (
        <mesh key={i} position={[-0.88 + i * 0.26, 1.08 + h * 0.5, 0.062]}>
          <boxGeometry args={[0.18, h, 0.005]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} roughness={0} />
        </mesh>
      ))}
      {/* Grid lines on screen */}
      {[0.3, 0.6, 0.9].map((y, i) => (
        <mesh key={i} position={[0, 1.08 + y * 0.78, 0.062]}>
          <boxGeometry args={[2.24, 0.005, 0.003]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.25} roughness={0} />
        </mesh>
      ))}
      {/* Neural network nodes (decorative) */}
      {[
        [-0.7, 2.25], [0.0, 2.25], [0.7, 2.25],
        [-0.35, 2.48], [0.35, 2.48],
        [0.0, 2.68],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.062]}>
          <circleGeometry args={[0.030, 8]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.0} roughness={0} />
        </mesh>
      ))}
    </group>
  )
}

// ── Floor 4: Operations — Monitoring Console ──────────────────────────────────
const MONITOR_COLORS = ["#ff4444", "#22cc88", "#22cc88"] as const

function OpsZone({ accent }: { accent: string }) {
  return (
    <group position={[-11.0, 0, 4]}>
      {/* Console desk */}
      <mesh position={[0, 0.74, 0.12]}>
        <boxGeometry args={[3.1, 0.06, 0.75]} />
        <meshStandardMaterial color="#0f1318" roughness={0.38} metalness={0.52} />
      </mesh>
      {/* Desk panel front */}
      <mesh position={[0, 0.44, 0.48]}>
        <boxGeometry args={[3.1, 0.62, 0.04]} />
        <meshStandardMaterial color="#0a0d12" roughness={0.35} metalness={0.55} />
      </mesh>
      {/* Three monitors */}
      {[-1.05, 0.0, 1.05].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* Monitor bezel */}
          <mesh position={[0, 1.72, 0.02]}>
            <boxGeometry args={[0.88, 0.54, 0.07]} />
            <meshStandardMaterial color="#0a0d12" roughness={0.25} metalness={0.70} />
          </mesh>
          {/* Screen — center monitor shows alert (red) */}
          <mesh position={[0, 1.72, 0.058]}>
            <boxGeometry args={[0.82, 0.48, 0.008]} />
            <meshStandardMaterial
              color="#020508"
              emissive={i === 1 ? MONITOR_COLORS[0] : MONITOR_COLORS[1]}
              emissiveIntensity={0.28}
              roughness={0.08}
            />
          </mesh>
          {/* Status bar line (accent) */}
          <mesh position={[0, 1.49, 0.060]}>
            <boxGeometry args={[0.82, 0.025, 0.004]} />
            <meshStandardMaterial color={i === 1 ? "#ff4444" : accent} emissive={i === 1 ? "#ff4444" : accent} emissiveIntensity={0.7} roughness={0} />
          </mesh>
          {/* Stand */}
          <mesh position={[0, 1.25, 0]}>
            <boxGeometry args={[0.055, 0.95, 0.055]} />
            <meshStandardMaterial color="#0f1318" roughness={0.35} metalness={0.60} />
          </mesh>
        </group>
      ))}
      {/* Keyboard */}
      <mesh position={[0, 0.80, 0.28]}>
        <boxGeometry args={[0.52, 0.022, 0.17]} />
        <meshStandardMaterial color="#0d1018" roughness={0.45} metalness={0.3} />
      </mesh>
      {/* Alert indicator light */}
      <mesh position={[1.3, 0.85, 0.46]}>
        <cylinderGeometry args={[0.018, 0.018, 0.06, 8]} />
        <meshStandardMaterial color="#ff2222" emissive="#ff2222" emissiveIntensity={1.5} roughness={0} />
      </mesh>
    </group>
  )
}

// ── Floor 5: Executive — Trophy Cabinet + Bar ─────────────────────────────────
function ExecutiveZone({ accent }: { accent: string }) {
  return (
    <group>
      {/* Trophy cabinet — left back corner */}
      <group position={[-11.2, 0, -7.5]}>
        {/* Cabinet body */}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[1.8, 2.4, 0.52]} />
          <meshStandardMaterial color="#100c06" roughness={0.25} metalness={0.18} />
        </mesh>
        {/* Glass door */}
        <mesh position={[0, 1.2, 0.265]}>
          <boxGeometry args={[1.74, 2.34, 0.025]} />
          <meshStandardMaterial color="#a8c8e8" transparent opacity={0.28} roughness={0.04} metalness={0.0} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.78, 1.2, 0.285]}>
          <boxGeometry args={[0.02, 0.18, 0.02]} />
          <meshStandardMaterial color="#c8a040" roughness={0.12} metalness={0.92} />
        </mesh>
        {/* Shelf items */}
        {[0.42, 1.0, 1.58].map((y, si) => (
          <group key={si}>
            {/* Trophy */}
            <mesh position={[-0.45, y + 0.05, 0.06]}>
              <cylinderGeometry args={[0.032, 0.055, 0.20, 7]} />
              <meshStandardMaterial color="#d4a030" roughness={0.08} metalness={0.92} />
            </mesh>
            <mesh position={[-0.45, y + 0.17, 0.06]}>
              <cylinderGeometry args={[0.010, 0.010, 0.08, 7]} />
              <meshStandardMaterial color="#d4a030" roughness={0.08} metalness={0.92} />
            </mesh>
            <mesh position={[-0.45, y + 0.225, 0.06]}>
              <sphereGeometry args={[0.028, 8, 7]} />
              <meshStandardMaterial color="#e8c050" roughness={0.06} metalness={0.95} />
            </mesh>
            {/* Plaque/certificate */}
            <mesh position={[0.1, y + 0.1, 0.05]}>
              <boxGeometry args={[0.26, 0.30, 0.04]} />
              <meshStandardMaterial color="#f5f0e8" roughness={0.90} metalness={0.0} />
            </mesh>
            <mesh position={[0.1, y + 0.1, 0.075]}>
              <boxGeometry args={[0.22, 0.04, 0.005]} />
              <meshStandardMaterial color={accent} roughness={0.4} metalness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Executive bar / credenza — right side */}
      <group position={[9.0, 0, 7.0]}>
        {/* Body */}
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[2.2, 1.04, 0.60]} />
          <meshStandardMaterial color="#0c0804" roughness={0.18} metalness={0.22} />
        </mesh>
        {/* Marble top */}
        <mesh position={[0, 1.06, 0]}>
          <boxGeometry args={[2.26, 0.045, 0.65]} />
          <meshStandardMaterial color="#d8d0c4" roughness={0.08} metalness={0.08} />
        </mesh>
        {/* Inlay strip */}
        <mesh position={[0, 1.084, 0]}>
          <boxGeometry args={[2.20, 0.008, 0.60]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.1} roughness={0.3} />
        </mesh>
        {/* Whisky bottle */}
        <mesh position={[-0.65, 1.24, 0.04]}>
          <cylinderGeometry args={[0.042, 0.058, 0.36, 9]} />
          <meshStandardMaterial color={accent} transparent opacity={0.60} roughness={0.04} metalness={0.05} />
        </mesh>
        {/* Bottle cap */}
        <mesh position={[-0.65, 1.44, 0.04]}>
          <cylinderGeometry args={[0.026, 0.026, 0.04, 8]} />
          <meshStandardMaterial color="#c8a030" roughness={0.12} metalness={0.85} />
        </mesh>
        {/* Crystal glasses */}
        {[-0.22, 0.0, 0.22].map((x, i) => (
          <mesh key={i} position={[x, 1.14, 0.10]}>
            <cylinderGeometry args={[0.034, 0.026, 0.10, 9]} />
            <meshStandardMaterial color="#d0e8f0" transparent opacity={0.48} roughness={0.04} metalness={0.0} />
          </mesh>
        ))}
        {/* Decorative framed art above */}
        <mesh position={[0, 2.0, -0.31]}>
          <boxGeometry args={[1.8, 0.90, 0.04]} />
          <meshStandardMaterial color="#1a1208" roughness={0.3} metalness={0.12} />
        </mesh>
        <mesh position={[0, 2.0, -0.29]}>
          <boxGeometry args={[1.65, 0.75, 0.02]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.12} roughness={0.6} metalness={0.0} />
        </mesh>
      </group>
    </group>
  )
}
