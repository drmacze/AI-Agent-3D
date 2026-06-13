import { Suspense, useMemo, useRef, useCallback, Component, ReactNode, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useListAgents, getListAgentsQueryKey } from "@workspace/api-client-react";
import { AgentAvatar } from "./AgentAvatar";
import { NpcAvatar } from "./NpcAvatar";
import { PlayerAvatar } from "./PlayerAvatar";
import { ConnectionLine } from "./ConnectionLine";
import { useGameTime } from "@/context/GameTimeContext";
import { useFloor, FLOOR_THEMES, type FloorId, type NpcAgent } from "@/context/FloorContext";
import { useGameStore } from "@/store/gameStore";
import { FirstPersonController } from "./FirstPersonController";
import { ElevatorCab3D } from "./ElevatorCab3D";
import { LobbyCamera } from "./LobbyCamera";
import { CityExterior } from "./CityExterior";
import { DeveloperRoom } from "./DeveloperRoom";
import { OfficeFloor } from "./OfficeFloor";
import { NpcConversations } from "./NpcConversations";
import { PostProcessingEffects } from "./PostProcessingEffects";
import { TouchControls } from "@/components/ui/TouchControls";
import { useSettings } from "@/context/SettingsContext";
import { FPSCounter } from "@/components/ui/FPSCounter";

// ── WebGL error boundary ──────────────────────────────────────────────────────
class WebGLErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { failed: false }; }
  componentDidCatch() { this.setState({ failed: true }); }
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return (
      <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e]">
        <div className="text-center text-gray-300 space-y-2">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </div>
          <p className="font-semibold">DLavie OS Office</p>
          <p className="text-sm text-gray-500">WebGL required</p>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ── Desk stations ─────────────────────────────────────────────────────────────
const DESK_STATIONS = [
  { pos: [-5, 0, -3] as [number,number,number], rot: 0,        chairPos: [-5, 0, -1.8] as [number,number,number] },
  { pos: [-1, 0, -3] as [number,number,number], rot: 0,        chairPos: [-1, 0, -1.8] as [number,number,number] },
  { pos:  [3, 0, -3] as [number,number,number], rot: 0,        chairPos:  [3, 0, -1.8] as [number,number,number] },
  { pos: [-5, 0,  2] as [number,number,number], rot: Math.PI,  chairPos: [-5, 0,  3.2] as [number,number,number] },
  { pos: [-1, 0,  2] as [number,number,number], rot: Math.PI,  chairPos: [-1, 0,  3.2] as [number,number,number] },
  { pos:  [3, 0,  2] as [number,number,number], rot: Math.PI,  chairPos:  [3, 0,  3.2] as [number,number,number] },
];

// ── Dynamic lights ────────────────────────────────────────────────────────────
function DynamicLights({ floorId }: { floorId: FloorId }) {
  const ambRef  = useRef<THREE.AmbientLight>(null);
  const sunRef  = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const floorRef = useRef<THREE.PointLight>(null);
  const { lightConfig } = useGameTime();
  const theme = FLOOR_THEMES[floorId];

  const ta = useMemo(() => new THREE.Color(), []);
  const ts = useMemo(() => new THREE.Color(), []);
  const tf = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    if (!ambRef.current || !sunRef.current || !fillRef.current) return;
    const sp = delta * 0.8;
    ta.set(lightConfig.ambientColor); ts.set(lightConfig.sunColor); tf.set(lightConfig.fillColor);
    ambRef.current.color.lerp(ta, sp);
    ambRef.current.intensity = THREE.MathUtils.lerp(ambRef.current.intensity, lightConfig.ambientIntensity, sp);
    sunRef.current.color.lerp(ts, sp);
    sunRef.current.intensity = THREE.MathUtils.lerp(sunRef.current.intensity, lightConfig.sunIntensity, sp);
    fillRef.current.color.lerp(tf, sp);
    fillRef.current.intensity = THREE.MathUtils.lerp(fillRef.current.intensity, lightConfig.fillIntensity, sp);
    // Floor accent light pulse
    if (floorRef.current) {
      floorRef.current.intensity = 0.4 + Math.sin(Date.now() * 0.001) * 0.1;
    }
  });

  return (
    <>
      <ambientLight ref={ambRef} color={lightConfig.ambientColor} intensity={lightConfig.ambientIntensity} />
      <directionalLight ref={sunRef} color={lightConfig.sunColor} intensity={lightConfig.sunIntensity} position={[14, 10, 2]} />
      <directionalLight ref={fillRef} color={lightConfig.fillColor} intensity={lightConfig.fillIntensity} position={[0, 8, 0]} />
      <pointLight ref={floorRef} color={theme.accent} intensity={0.4} distance={10} position={[-10.5, 2.5, -7.5]} />
      <pointLight color={theme.accent} intensity={0.3} distance={8} position={[9.5, 2, -7.5]} />
      <directionalLight color="#d8eeff" intensity={0.25} position={[13, 3, 0]} />
      {/* Ceiling LED strips */}
      <pointLight color="#fffbf0" intensity={0.38} distance={14} position={[-4, 3.8, 0]} />
      <pointLight color="#fffbf0" intensity={0.38} distance={14} position={[ 4, 3.8, 0]} />
    </>
  );
}

function SceneBackground() {
  const { lightConfig } = useGameTime();
  return <color attach="background" args={[lightConfig.bgColor]} />;
}

// ── Animated monitor screens ──────────────────────────────────────────────────
function AnimatedMonitor({ pos, accent }: { pos: [number,number,number]; accent: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const phase = useRef(Math.random() * Math.PI * 2);
  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshLambertMaterial;
    mat.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 0.8 + phase.current) * 0.08;
  });
  // Monitor always on the far side of desk (away from agent): pos[2] - 0.18
  const monZ = pos[2] - 0.18;
  return (
    <group>
      {/* Monitor screen */}
      <mesh ref={ref} position={[pos[0], 1.22, monZ]}>
        <boxGeometry args={[0.55, 0.35, 0.03]} />
        <meshLambertMaterial color="#0d1117" emissive={accent} emissiveIntensity={0.25} />
      </mesh>
      {/* Screen bezel */}
      <mesh position={[pos[0], 1.22, monZ - 0.005]}>
        <boxGeometry args={[0.60, 0.40, 0.02]} />
        <meshLambertMaterial color="#1a1a2a" />
      </mesh>
    </group>
  );
}

// ── Floating data particles ───────────────────────────────────────────────────
function DataParticles({ accent }: { accent: string }) {
  const ref = useRef<THREE.Points>(null);
  const count = 60;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 24;
      pos[i * 3 + 1] = Math.random() * 3.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    return pos;
  }, []);
  const speeds = useMemo(() => Array.from({ length: count }, () => 0.2 + Math.random() * 0.5), []);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 1] = (pos.array[i * 3 + 1] + speeds[i] * 0.01) % 4;
      (pos.array as Float32Array)[i * 3] += Math.sin(state.clock.elapsedTime * 0.3 + i * 0.7) * 0.003;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={accent} size={0.04} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

// ── Reflective floor ──────────────────────────────────────────────────────────
function ReflectiveFloor({ floorId }: { floorId: FloorId }) {
  const theme = FLOOR_THEMES[floorId];
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[28, 20]} />
      <MeshReflectorMaterial
        blur={[200, 60]}
        resolution={256}
        mixBlur={1}
        mixStrength={6}
        roughness={0.96}
        depthScale={0.8}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#ccc8c0"
        metalness={0.05}
        mirror={0}
      />
    </mesh>
  );
}

// ── Whiteboard with animated content ─────────────────────────────────────────
function AnimatedWhiteboard({ accent }: { accent: string }) {
  const lineRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material as THREE.MeshLambertMaterial;
    mat.emissiveIntensity = 0.1 + Math.abs(Math.sin(state.clock.elapsedTime * 0.5)) * 0.15;
  });
  return (
    <group position={[-4, 1.8, -9.88]}>
      {/* Board surface */}
      <mesh><boxGeometry args={[3.2, 1.8, 0.05]} /><meshLambertMaterial color="#f8f6f2" /></mesh>
      {/* Board frame */}
      <mesh position={[0, 0, 0.028]}><boxGeometry args={[3.3, 1.85, 0.02]} /><meshLambertMaterial color="#d0ccc6" /></mesh>
      {/* "Diagram" lines */}
      {[[-0.8, 0.3], [0, 0.3], [0.8, 0.3]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.04]}>
          <boxGeometry args={[0.55, 0.35, 0.01]} />
          <meshLambertMaterial color="#e8edf0" />
        </mesh>
      ))}
      <mesh ref={lineRef} position={[0, -0.2, 0.04]}>
        <boxGeometry args={[2.4, 0.04, 0.01]} />
        <meshLambertMaterial color={accent} emissive={accent} emissiveIntensity={0.15} />
      </mesh>
      {[[-0.8, -0.45], [0, -0.45], [0.8, -0.45]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.04]}>
          <boxGeometry args={[0.3, 0.2, 0.01]} />
          <meshLambertMaterial color="#e8edf5" />
        </mesh>
      ))}
      {/* Marker tray */}
      <mesh position={[0, -0.96, 0.02]}><boxGeometry args={[3.2, 0.08, 0.12]} /><meshLambertMaterial color="#c8c4be" /></mesh>
      {[[-0.5, 0], [0, 0], [0.5, 0]].map(([x], i) => (
        <mesh key={i} position={[x, -0.95, 0.07]}>
          <cylinderGeometry args={[0.018, 0.018, 0.14, 6]} />
          <meshLambertMaterial color={i === 0 ? "#e53e3e" : i === 1 ? "#3182ce" : "#38a169"} />
        </mesh>
      ))}
    </group>
  );
}

// ── Coffee station ────────────────────────────────────────────────────────────
function CoffeeStation({ accent }: { accent: string }) {
  const steamRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!steamRef.current) return;
    steamRef.current.position.y = 1.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.04;
    (steamRef.current.material as THREE.MeshLambertMaterial).opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.12;
  });
  return (
    <group position={[-10.5, 0, -8]}>
      <mesh position={[0, 0.55, 0]}><boxGeometry args={[0.55, 1.1, 0.45]} /><meshLambertMaterial color="#2a2a2a" /></mesh>
      <mesh position={[0, 0.8, 0.228]}><boxGeometry args={[0.3, 0.22, 0.01]} /><meshLambertMaterial color="#1a3a5a" emissive={accent} emissiveIntensity={0.45} /></mesh>
      {/* Display numbers */}
      <mesh position={[0, 0.65, 0.23]}><boxGeometry args={[0.18, 0.08, 0.005]} /><meshLambertMaterial color="#0a1628" emissive="#00ff88" emissiveIntensity={0.5} /></mesh>
      <mesh position={[0, 0.26, 0.22]}><boxGeometry args={[0.28, 0.02, 0.2]} /><meshLambertMaterial color="#444444" /></mesh>
      <mesh position={[0, 0.04, 0]}><boxGeometry args={[1.2, 0.08, 0.8]} /><meshLambertMaterial color="#b08060" /></mesh>
      {/* Steam */}
      <mesh ref={steamRef} position={[0, 1.18, 0.1]}>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshLambertMaterial color="#e8e8e8" transparent opacity={0.3} />
      </mesh>
      {/* Coffee cups waiting */}
      {[[-0.18, 0], [0.18, 0]].map(([x], i) => (
        <group key={i} position={[x, 0.12, 0.22]}>
          <mesh><cylinderGeometry args={[0.04, 0.032, 0.07, 8]} /><meshLambertMaterial color="#fff" /></mesh>
          <mesh position={[0, 0.025, 0]}><cylinderGeometry args={[0.038, 0.038, 0.015, 8]} /><meshLambertMaterial color="#3a1808" /></mesh>
        </group>
      ))}
    </group>
  );
}

// ── Floor-specific office props ───────────────────────────────────────────────
function FloorProps({ floorId }: { floorId: FloorId }) {
  const theme = FLOOR_THEMES[floorId];

  return (
    <group>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4, 0]}>
        <planeGeometry args={[28, 20]} /><meshLambertMaterial color="#f0eee9" />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 2, -10]}><planeGeometry args={[28, 4]} /><meshLambertMaterial color="#eceae5" /></mesh>
      <mesh position={[0, 2,  10]} rotation={[0, Math.PI, 0]}><planeGeometry args={[28, 4]} /><meshLambertMaterial color="#f0eee9" /></mesh>
      <mesh position={[-14, 2, 0]} rotation={[0,  Math.PI / 2, 0]}><planeGeometry args={[20, 4]} /><meshLambertMaterial color="#eeeae4" /></mesh>
      <mesh position={[ 14, 2, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[20, 4]} /><meshLambertMaterial color="#f5f2ee" /></mesh>

      {/* Windows with glow */}
      {[-4, 0, 4].map((z, i) => (
        <group key={i} position={[13.95, 2.2, z]}>
          <mesh rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[2.6, 2.2]} />
            <meshLambertMaterial color="#c8e4f5" transparent opacity={0.88} emissive={theme.accent} emissiveIntensity={0.18} />
          </mesh>
          {[
            { pos: [0,  1.15, 0] as [number,number,number], size: [2.7, 0.07, 0.09] as [number,number,number] },
            { pos: [0, -1.15, 0] as [number,number,number], size: [2.7, 0.07, 0.09] as [number,number,number] },
            { pos: [-1.35, 0, 0] as [number,number,number], size: [0.07, 2.3, 0.09] as [number,number,number] },
            { pos: [ 1.35, 0, 0] as [number,number,number], size: [0.07, 2.3, 0.09] as [number,number,number] },
          ].map((f, j) => (
            <mesh key={j} position={f.pos} rotation={[0, -Math.PI / 2, 0]}>
              <boxGeometry args={f.size} /><meshLambertMaterial color="#f8f6f2" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Ceiling LED strips — neutral warm white, same on all floors */}
      {[[-5, 3.96, -3],[0, 3.96, -3],[5, 3.96, -3],[-5, 3.96, 3],[0, 3.96, 3],[5, 3.96, 3]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z] as [number,number,number]}>
          <boxGeometry args={[0.14, 0.04, 2.8]} />
          <meshLambertMaterial color="#fffff8" emissive="#fffde8" emissiveIntensity={0.12} />
        </mesh>
      ))}

      {/* Department sign */}
      <mesh position={[0, 3.2, -9.9]}>
        <boxGeometry args={[5, 0.5, 0.05]} />
        <meshLambertMaterial color={theme.accent} emissive={theme.accent} emissiveIntensity={0.35} transparent opacity={0.85} />
      </mesh>

      {/* Elevator cab is now handled by ElevatorCab3D component in the main scene */}

      {/* Corner plants */}
      {[[-11.5, 0, -8],[-11.5, 0, 8],[11.5, 0, -8]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z] as [number,number,number]}>
          <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.2, 0.16, 0.44, 8]} /><meshLambertMaterial color="#a0704a" /></mesh>
          <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.04, 0.055, 0.52, 6]} /><meshLambertMaterial color="#5a3818" /></mesh>
          <mesh position={[0, 1.1, 0]}><sphereGeometry args={[0.4, 7, 6]} /><meshLambertMaterial color="#2d7a3a" /></mesh>
          <mesh position={[0.2, 0.95, 0.1]}><sphereGeometry args={[0.22, 6, 5]} /><meshLambertMaterial color="#3a8a45" /></mesh>
        </group>
      ))}

      {/* Desk stations */}
      {DESK_STATIONS.map((station, i) => {
        const dx = station.pos[0];
        const dz = station.pos[2];
        const cx = station.chairPos[0];
        const cz = station.chairPos[2];
        // Monitor on FAR side of desk (away from agent), keyboard on NEAR side
        const monZ = dz - 0.18;
        const kbZ  = dz + 0.12;
        // Chair back always behind agent (agent faces -Z, so back = +Z)
        const backZ = cz + 0.21;
        return (
          <group key={i}>
            {/* Desk top */}
            <mesh position={[dx, 0.74, dz]}>
              <boxGeometry args={[1.4, 0.07, 0.78]} /><meshLambertMaterial color="#c8a870" />
            </mesh>
            {/* Desk side panels */}
            <mesh position={[dx - 0.68, 0.38, dz]}>
              <boxGeometry args={[0.04, 0.76, 0.74]} /><meshLambertMaterial color="#b89860" />
            </mesh>
            <mesh position={[dx + 0.68, 0.38, dz]}>
              <boxGeometry args={[0.04, 0.76, 0.74]} /><meshLambertMaterial color="#b89860" />
            </mesh>
            {/* Monitor stand neck */}
            <mesh position={[dx, 0.84, monZ]}>
              <boxGeometry args={[0.055, 0.18, 0.055]} /><meshLambertMaterial color="#2a2a3a" />
            </mesh>
            {/* Monitor stand base */}
            <mesh position={[dx, 0.78, monZ]}>
              <boxGeometry args={[0.24, 0.02, 0.14]} /><meshLambertMaterial color="#2a2a3a" />
            </mesh>
            {/* Animated monitor */}
            <AnimatedMonitor pos={station.pos} accent={theme.accent} />
            {/* Keyboard */}
            <mesh position={[dx, 0.785, kbZ]}>
              <boxGeometry args={[0.38, 0.018, 0.15]} /><meshLambertMaterial color="#1e2030" />
            </mesh>
            {/* Keyboard keys strip */}
            <mesh position={[dx, 0.796, kbZ]}>
              <boxGeometry args={[0.34, 0.008, 0.12]} /><meshLambertMaterial color="#2a2e44" />
            </mesh>
            {/* Mouse */}
            <mesh position={[dx + 0.27, 0.783, kbZ]}>
              <boxGeometry args={[0.08, 0.016, 0.12]} /><meshLambertMaterial color="#28303a" />
            </mesh>
            {/* Desk item: mug */}
            <mesh position={[dx - 0.45, 0.79, dz - 0.08]}>
              <cylinderGeometry args={[0.035, 0.030, 0.08, 8]} /><meshLambertMaterial color="#e8e0d8" />
            </mesh>

            {/* ── Office Chair ── */}
            {/* Seat shell */}
            <mesh position={[cx, 0.44, cz]}>
              <boxGeometry args={[0.46, 0.06, 0.46]} /><meshLambertMaterial color="#2a3448" />
            </mesh>
            {/* Seat cushion */}
            <mesh position={[cx, 0.485, cz]}>
              <boxGeometry args={[0.42, 0.04, 0.42]} /><meshLambertMaterial color={theme.accent} />
            </mesh>
            {/* Back frame */}
            <mesh position={[cx, 0.70, backZ]}>
              <boxGeometry args={[0.44, 0.38, 0.06]} /><meshLambertMaterial color="#2a3448" />
            </mesh>
            {/* Back cushion */}
            <mesh position={[cx, 0.70, backZ - 0.02]}>
              <boxGeometry args={[0.40, 0.34, 0.04]} /><meshLambertMaterial color={theme.accent} />
            </mesh>
            {/* Left armrest */}
            <mesh position={[cx - 0.24, 0.57, cz]}>
              <boxGeometry args={[0.04, 0.05, 0.36]} /><meshLambertMaterial color="#2a3448" />
            </mesh>
            {/* Right armrest */}
            <mesh position={[cx + 0.24, 0.57, cz]}>
              <boxGeometry args={[0.04, 0.05, 0.36]} /><meshLambertMaterial color="#2a3448" />
            </mesh>
            {/* Gas lift pole */}
            <mesh position={[cx, 0.22, cz]}>
              <cylinderGeometry args={[0.034, 0.034, 0.44, 6]} /><meshLambertMaterial color="#3a4858" />
            </mesh>
            {/* Five-star base arms */}
            {[0, 72, 144, 216, 288].map((deg, bi) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <mesh key={bi}
                  position={[cx + Math.sin(rad) * 0.13, 0.045, cz + Math.cos(rad) * 0.13]}
                  rotation={[0, -rad, 0]}>
                  <boxGeometry args={[0.038, 0.038, 0.28]} />
                  <meshLambertMaterial color="#3a4858" />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* Meeting table */}
      <group position={[7, 0, 1]}>
        <mesh position={[0, 0.74, 0]}><boxGeometry args={[2.8, 0.08, 1.4]} /><meshLambertMaterial color="#c8a870" /></mesh>
        <mesh position={[0, 0.78, 0]}><boxGeometry args={[2.9, 0.04, 1.5]} /><meshLambertMaterial color="#a88050" /></mesh>
        {[[-1.25,-0.55],[1.25,-0.55],[-1.25,0.55],[1.25,0.55]].map(([lx,lz], i) => (
          <mesh key={i} position={[lx, 0.35, lz] as [number,number,number]}>
            <boxGeometry args={[0.07,0.7,0.07]} /><meshLambertMaterial color="#907040" />
          </mesh>
        ))}
        {/* Meeting room chairs */}
        {[[-1.25,-0.9],[1.25,-0.9],[-1.25,0.9],[1.25,0.9],[-0.4,-0.9],[0.4,-0.9]].map(([cx,cz], i) => (
          <mesh key={i} position={[cx, 0.44, cz] as [number,number,number]}>
            <boxGeometry args={[0.4,0.04,0.4]} /><meshLambertMaterial color={theme.accent} transparent opacity={0.7} />
          </mesh>
        ))}
        {/* Laptop on table */}
        <mesh position={[0, 0.83, 0]}><boxGeometry args={[0.35, 0.01, 0.28]} /><meshLambertMaterial color="#1a1a2e" /></mesh>
        <mesh position={[0, 0.97, -0.12]} rotation={[-0.45, 0, 0]}><boxGeometry args={[0.35, 0.24, 0.01]} /><meshLambertMaterial color="#1a1a2e" emissive={theme.accent} emissiveIntensity={0.2} /></mesh>
      </group>

      {/* Bookshelf */}
      <group position={[9.5, 0, -8]}>
        <mesh position={[0, 1, 0]}><boxGeometry args={[1.4, 2.0, 0.35]} /><meshLambertMaterial color="#a07850" /></mesh>
        {[0.6, 1.0, 1.4].map((y, shelf) => (
          <group key={shelf}>
            {[[-0.4,-0.1,0.0,0.3,0.15],[-0.2,0.1,0.25,0.22,0.18],[0.0,0.05,0.2,0.18,0.16],[0.22,-0.05,0.18,0.24,0.14]].map(([xo,,,,], book) => (
              <mesh key={book} position={[xo as number, y + 0.15, 0.02]}>
                <boxGeometry args={[0.11, 0.32, 0.22]} />
                <meshLambertMaterial color={["#e53e3e","#3182ce","#38a169","#d69e2e"][book % 4]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Coffee station */}
      <CoffeeStation accent={theme.accent} />

      {/* Whiteboard */}
      <AnimatedWhiteboard accent={theme.accent} />

      {/* Data particles */}
      <DataParticles accent={theme.accent} />
    </group>
  );
}

// ── NPC simulation ────────────────────────────────────────────────────────────
const WANDER_SPOTS: Array<[number, number]> = [
  [-10.5, -8], [-4, -8], [9.5, -8], [-11, 7], [11, -6],
  [7, 1], [0, 0], [-5, -3], [-1, -3], [3, -3], [-5, 3], [-1, 3], [3, 3],
  [4, -5], [-3, 5], [6, -3], [-7, 1], [2, 6], [-8, -3], [8, 3],
];

function useNpcSimulation(npcs: NpcAgent[]) {
  const positions = useRef<Map<string, [number, number]>>(
    new Map(npcs.map(n => [n.id, [n.positionX, n.positionZ]]))
  );
  const timers = useRef<Map<string, number>>(new Map());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      npcs.forEach(npc => {
        const t = timers.current.get(npc.id) ?? 0;
        if (t <= 0) {
          const wander = WANDER_SPOTS[Math.floor(Math.random() * WANDER_SPOTS.length)];
          positions.current.set(npc.id, wander);
          timers.current.set(npc.id, 6 + Math.random() * 14);
        } else {
          timers.current.set(npc.id, t - 3);
        }
      });
      setTick(v => v + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [npcs]);

  return positions.current;
}

// ── Main FloorScene ───────────────────────────────────────────────────────────
interface Props {
  onSelectAgent: (id: number | string) => void;
  selectedAgentId: number | string | null;
  onChatAgent: (agent: unknown) => void;
  onNearNpc?: (name: string | null, agentData?: unknown) => void;
  onNearElevator?: (near: boolean) => void;
}

function checkWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch { return false; }
}

export function FloorScene({ onSelectAgent, selectedAgentId, onChatAgent, onNearNpc, onNearElevator }: Props) {
  const webGLAvailable = useMemo(() => checkWebGL(), []);
  const gameState = useGameStore(s => s.gameState);
  const { currentFloor, getNpcsByFloor } = useFloor();
  const { settings } = useSettings();

  const joystickMove = useRef({ x: 0, y: 0 });
  const joystickLook = useRef({ x: 0, y: 0 });
  const jumpTrigger  = useRef(false);

  const { data: floor1Agents } = useListAgents({
    query: { refetchInterval: 2500, queryKey: getListAgentsQueryKey() },
  });

  const npcs = useMemo(() => getNpcsByFloor(currentFloor), [currentFloor, getNpcsByFloor]);
  const isFloor1 = currentFloor === 1;

  const npcPositions = useMemo(() => {
    if (isFloor1 && floor1Agents) {
      return floor1Agents.map(a => ({ id: String(a.id), name: a.name, x: a.positionX, z: a.positionZ, agentData: a }));
    }
    return npcs.map(n => ({ id: n.id, name: n.name, x: n.positionX, z: n.positionZ, agentData: { ...n, isNpc: true } }));
  }, [isFloor1, floor1Agents, npcs]);

  const chattingPairs = useMemo(() => {
    if (!floor1Agents || !isFloor1) return [];
    const pairs: Array<[number, number]> = [];
    const seen = new Set<string>();
    floor1Agents.forEach(agent => {
      if (agent.status === "chatting" && agent.interactingWithId) {
        const key = [agent.id, agent.interactingWithId].sort().join("-");
        if (!seen.has(key)) { seen.add(key); pairs.push([agent.id, agent.interactingWithId]); }
      }
    });
    return pairs;
  }, [floor1Agents, isFloor1]);

  const playerPos: [number, number, number] = [0, 0, 6];

  if (!webGLAvailable) return (
    <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e]">
      <div className="text-center text-gray-300 space-y-2">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{color:"#9ca3af"}}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </div><p>WebGL required</p>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full" style={{ position: 'relative' }}>
      <WebGLErrorBoundary>
        <Canvas
          camera={{ fov: 70 }}
          dpr={[1, Math.min(settings.pixelRatio, 1.5)]}
          performance={{ min: 0.5 }}
          gl={{
            antialias: settings.antialias,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.88,
            powerPreference: 'high-performance',
          }}
          shadows={settings.shadowsEnabled}
        >
          <SceneBackground />
          <DynamicLights floorId={currentFloor} />

          {/* Camera control — lobby = cinematic orbit, playing = first-person */}
          {gameState === 'lobby'   && <LobbyCamera />}
          {gameState === 'playing' && (
            <FirstPersonController
              joystickMove={joystickMove}
              joystickLook={joystickLook}
              jumpTrigger={jumpTrigger}
              npcPositions={npcPositions}
              onNearNpc={onNearNpc}
              onNearElevator={onNearElevator}
            />
          )}

          {/* Post-processing: bloom + vignette */}
          {settings.bloomEnabled && <PostProcessingEffects />}

          <Suspense fallback={null}>
            <ReflectiveFloor floorId={currentFloor} />
            <ElevatorCab3D />
            <FloorProps floorId={currentFloor} />

            {/* City exterior visible through windows */}
            <CityExterior />

            {/* Developer room (Drmacze) */}
            <DeveloperRoom />

            {/* NPC-to-NPC conversation bubbles */}
            <NpcConversations />

            {/* Player character (only visible in lobby / third-person view) */}
            {gameState === 'lobby' && <PlayerAvatar position={playerPos} />}

            {/* Floor 1 — DB agents */}
            {isFloor1 && floor1Agents?.map(agent => (
              <AgentAvatar
                key={agent.id}
                agent={agent}
                isSelected={selectedAgentId === agent.id}
                onClick={() => { onSelectAgent(agent.id); onChatAgent(agent); }}
              />
            ))}

            {/* Floors 2-5 — NPC agents */}
            {!isFloor1 && npcs.map(npc => (
              <NpcAvatar
                key={npc.id}
                agent={npc}
                isSelected={selectedAgentId === npc.id}
                onClick={() => { onSelectAgent(npc.id); onChatAgent({ ...npc, isNpc: true }); }}
              />
            ))}

            {/* Chat connection lines (floor 1) */}
            {isFloor1 && floor1Agents && chattingPairs.map(([id1, id2]) => {
              const a1 = floor1Agents.find(a => a.id === id1);
              const a2 = floor1Agents.find(a => a.id === id2);
              if (!a1 || !a2) return null;
              return (
                <ConnectionLine
                  key={`conn-${id1}-${id2}`}
                  start={[a1.positionX, 1.3, a1.positionZ]}
                  end={[a2.positionX, 1.3, a2.positionZ]}
                  color="#2563eb"
                />
              );
            })}

          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>

      {/* Touch joystick (rendered over canvas, outside WebGL) */}
      {gameState === 'playing' && (
        <TouchControls
          joystickMove={joystickMove}
          joystickLook={joystickLook}
        />
      )}

      {/* FPS Counter overlay */}
      {settings.showFPS && <FPSCounter />}
    </div>
  );
}
