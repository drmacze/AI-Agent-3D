import { Suspense, useMemo, useRef, Component, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useListAgents, getListAgentsQueryKey } from "@workspace/api-client-react";
import { AgentAvatar } from "./AgentAvatar";
import { OfficeFloor } from "./OfficeFloor";
import { OfficeDesk } from "./OfficeDesk";
import { OfficeChair } from "./OfficeChair";
import { ConnectionLine } from "./ConnectionLine";
import { useGameTime } from "@/context/GameTimeContext";

// ── WebGL error boundary ─────────────────────────────────────────────────────
class WebGLErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  componentDidCatch() { this.setState({ failed: true }); }
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#e8e4de]">
          <div className="text-center text-gray-500 space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            </div>
            <p className="font-semibold text-gray-700">DLavie OS Office</p>
            <p className="text-sm">3D view requires WebGL — open on a real device or browser</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Desk stations — 2 rows of 3 ──────────────────────────────────────────────
const DESK_STATIONS = [
  { pos: [-5, 0, -3] as [number,number,number], rot: 0,         chairPos: [-5, 0, -1.8] as [number,number,number], chairRot: 0 },
  { pos: [-1, 0, -3] as [number,number,number], rot: 0,         chairPos: [-1, 0, -1.8] as [number,number,number], chairRot: 0 },
  { pos:  [3, 0, -3] as [number,number,number], rot: 0,         chairPos:  [3, 0, -1.8] as [number,number,number], chairRot: 0 },
  { pos: [-5, 0,  2] as [number,number,number], rot: Math.PI,   chairPos: [-5, 0,  3.2] as [number,number,number], chairRot: Math.PI },
  { pos: [-1, 0,  2] as [number,number,number], rot: Math.PI,   chairPos: [-1, 0,  3.2] as [number,number,number], chairRot: Math.PI },
  { pos:  [3, 0,  2] as [number,number,number], rot: Math.PI,   chairPos:  [3, 0,  3.2] as [number,number,number], chairRot: Math.PI },
];

// ── Dynamic lights that react to game time ────────────────────────────────────
function DynamicLights() {
  const ambRef  = useRef<THREE.AmbientLight>(null);
  const sunRef  = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const { lightConfig } = useGameTime();

  const targetAmb  = useMemo(() => new THREE.Color(), []);
  const targetSun  = useMemo(() => new THREE.Color(), []);
  const targetFill = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    if (!ambRef.current || !sunRef.current || !fillRef.current) return;
    const speed = delta * 0.8;
    targetAmb.set(lightConfig.ambientColor);
    targetSun.set(lightConfig.sunColor);
    targetFill.set(lightConfig.fillColor);
    ambRef.current.color.lerp(targetAmb, speed);
    ambRef.current.intensity = THREE.MathUtils.lerp(ambRef.current.intensity, lightConfig.ambientIntensity, speed);
    sunRef.current.color.lerp(targetSun, speed);
    sunRef.current.intensity = THREE.MathUtils.lerp(sunRef.current.intensity, lightConfig.sunIntensity, speed);
    fillRef.current.color.lerp(targetFill, speed);
    fillRef.current.intensity = THREE.MathUtils.lerp(fillRef.current.intensity, lightConfig.fillIntensity, speed);
  });

  return (
    <>
      <ambientLight ref={ambRef} color={lightConfig.ambientColor} intensity={lightConfig.ambientIntensity} />
      <directionalLight ref={sunRef} color={lightConfig.sunColor} intensity={lightConfig.sunIntensity} position={[14, 10, 2]} />
      <directionalLight ref={fillRef} color={lightConfig.fillColor} intensity={lightConfig.fillIntensity} position={[0, 8, 0]} />
      {/* Warm lamp near coffee machine */}
      <pointLight color="#ffcc88" intensity={0.6} distance={5} position={[-10.5, 2.5, -7.5]} />
      {/* Accent fill from window side */}
      <directionalLight color="#d8eeff" intensity={0.3} position={[13, 3, 0]} />
    </>
  );
}

// ── WebGL detection ───────────────────────────────────────────────────────────
function checkWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
  } catch { return false; }
}

// ── Scene background that matches game time ───────────────────────────────────
function SceneBackground() {
  const { lightConfig } = useGameTime();
  return <color attach="background" args={[lightConfig.bgColor]} />;
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  onSelectAgent: (id: number) => void;
  selectedAgentId: number | null;
}

export function AgentScene({ onSelectAgent, selectedAgentId }: Props) {
  const webGLAvailable = useMemo(() => checkWebGL(), []);

  const { data: agents } = useListAgents({
    query: { refetchInterval: 2500, queryKey: getListAgentsQueryKey() },
  });

  const chattingPairs = useMemo(() => {
    if (!agents) return [];
    const pairs: Array<[number, number]> = [];
    const seen = new Set<string>();
    agents.forEach((agent) => {
      if (agent.status === "chatting" && agent.interactingWithId) {
        const key = [agent.id, agent.interactingWithId].sort().join("-");
        if (!seen.has(key)) { seen.add(key); pairs.push([agent.id, agent.interactingWithId]); }
      }
    });
    return pairs;
  }, [agents]);

  if (!webGLAvailable) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#e8e4de]">
        <div className="text-center text-gray-500 space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{color:"#9ca3af"}}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            </div>
          <p className="font-semibold text-gray-700">DLavie OS Office</p>
          <p className="text-sm">3D view requires WebGL — open on a real device or browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" data-testid="3d-scene-container">
      <WebGLErrorBoundary>
        <Canvas
          camera={{ position: [0, 14, 14], fov: 42 }}
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          shadows={false}
        >
          <SceneBackground />
          <DynamicLights />

          <Suspense fallback={null}>
            <OfficeFloor />

            {/* Desk stations */}
            {DESK_STATIONS.map((station, i) => {
              const agent = agents?.[i];
              return (
                <group key={i}>
                  <OfficeDesk
                    position={station.pos}
                    rotation={station.rot}
                    hasAgent={!!agent}
                    agentColor={agent?.color}
                    agentStatus={agent?.status}
                  />
                  <OfficeChair
                    position={station.chairPos}
                    rotation={station.chairRot}
                    isOccupied={agent?.status === "working"}
                  />
                </group>
              );
            })}

            {/* Agent avatars */}
            {agents?.map((agent) => (
              <AgentAvatar
                key={agent.id}
                agent={agent}
                isSelected={selectedAgentId === agent.id}
                onClick={() => onSelectAgent(agent.id)}
              />
            ))}

            {/* Chat connection lines */}
            {agents && chattingPairs.map(([id1, id2]) => {
              const a1 = agents.find((a) => a.id === id1);
              const a2 = agents.find((a) => a.id === id2);
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

          <OrbitControls
            makeDefault
            minPolarAngle={Math.PI / 10}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={6}
            maxDistance={32}
            target={[0, 0, 0]}
          />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
