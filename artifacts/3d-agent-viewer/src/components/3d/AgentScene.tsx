import { Suspense, useMemo, Component, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";

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
            <div className="text-4xl">🏢</div>
            <p className="font-semibold text-gray-700">DLavie OS Office</p>
            <p className="text-sm">3D view requires WebGL — use a real device or browser</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useListAgents, getListAgentsQueryKey } from "@workspace/api-client-react";
import { AgentAvatar } from "./AgentAvatar";
import { OfficeFloor } from "./OfficeFloor";
import { OfficeDesk } from "./OfficeDesk";
import { OfficeChair } from "./OfficeChair";
import { OfficePlant } from "./OfficePlant";
import { MeetingTable } from "./MeetingTable";
import { ConnectionLine } from "./ConnectionLine";

interface AgentSceneProps {
  onSelectAgent: (id: number) => void;
  selectedAgentId: number | null;
}

// Pre-calculated desk stations — 6 positions in 2 rows of 3
const DESK_STATIONS = [
  { pos: [-5, 0, -3] as [number, number, number], rot: 0,         chairPos: [-5, 0, -1.8] as [number, number, number], chairRot: 0 },
  { pos: [-1, 0, -3] as [number, number, number], rot: 0,         chairPos: [-1, 0, -1.8] as [number, number, number], chairRot: 0 },
  { pos:  [3, 0, -3] as [number, number, number], rot: 0,         chairPos:  [3, 0, -1.8] as [number, number, number], chairRot: 0 },
  { pos: [-5, 0,  2] as [number, number, number], rot: Math.PI,   chairPos: [-5, 0,  3.2] as [number, number, number], chairRot: Math.PI },
  { pos: [-1, 0,  2] as [number, number, number], rot: Math.PI,   chairPos: [-1, 0,  3.2] as [number, number, number], chairRot: Math.PI },
  { pos:  [3, 0,  2] as [number, number, number], rot: Math.PI,   chairPos:  [3, 0,  3.2] as [number, number, number], chairRot: Math.PI },
];

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function AgentScene({ onSelectAgent, selectedAgentId }: AgentSceneProps) {
  const webGLAvailable = useMemo(() => checkWebGL(), []);

  const { data: agents } = useListAgents({
    query: { refetchInterval: 3000, queryKey: getListAgentsQueryKey() },
  });

  const chattingPairs = useMemo(() => {
    if (!agents) return [];
    const pairs: Array<[number, number]> = [];
    const seen = new Set<string>();
    agents.forEach((agent) => {
      if (agent.status === "chatting" && agent.interactingWithId) {
        const key = [agent.id, agent.interactingWithId].sort().join("-");
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push([agent.id, agent.interactingWithId]);
        }
      }
    });
    return pairs;
  }, [agents]);

  if (!webGLAvailable) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#e8e4de]">
        <div className="text-center text-gray-500 space-y-2">
          <div className="text-4xl">🏢</div>
          <p className="font-semibold text-gray-700">DLavie OS Office</p>
          <p className="text-sm">3D view requires WebGL — open this on a real device or browser</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#d6d0c8]" data-testid="3d-scene-container">
      <WebGLErrorBoundary>
      <Canvas
        camera={{ position: [0, 14, 14], fov: 42 }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{
          antialias: true,
          toneMapping: THREE.LinearToneMapping,
          toneMappingExposure: 1.1,
        }}
        shadows={false}
      >
        {/* Ambient light — warm office light */}
        <ambientLight color="#fff8f0" intensity={1.4} />

        {/* Main sunlight from window side (right) */}
        <directionalLight
          color="#fff5e0"
          intensity={1.8}
          position={[14, 10, 2]}
        />

        {/* Ceiling fill light — cool fluorescent */}
        <directionalLight
          color="#e8f0ff"
          intensity={0.7}
          position={[0, 8, 0]}
        />

        <Suspense fallback={null}>
          {/* Office environment */}
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

          {/* Meeting area (corner) */}
          <MeetingTable position={[8, 0, 1]} />

          {/* Corner plants */}
          <OfficePlant position={[-10.5, 0, -6.5]} scale={1.1} />
          <OfficePlant position={[10.5, 0, -6.5]} scale={0.9} />
          <OfficePlant position={[-10.5, 0, 6.5]} scale={1.0} />

          {/* Office bookshelf (right back corner) */}
          <group position={[9, 0, -7]}>
            <mesh position={[0, 0.9, 0]} castShadow>
              <boxGeometry args={[2.4, 1.8, 0.4]} />
              <meshLambertMaterial color="#b08860" />
            </mesh>
            {/* Shelf rows */}
            {[0.2, 0.8, 1.4].map((y, i) => (
              <mesh key={i} position={[0, y, 0.18]} castShadow>
                <boxGeometry args={[2.3, 0.04, 0.02]} />
                <meshLambertMaterial color="#9a7850" />
              </mesh>
            ))}
            {/* Books */}
            {[
              [-0.8, 0.5, "#c44", 0.12, 0.55, 0.02],
              [-0.6, 0.5, "#448", 0.1, 0.5, 0.02],
              [-0.45, 0.5, "#484", 0.08, 0.48, 0.02],
              [-0.3, 0.5, "#874", 0.12, 0.52, 0.02],
              [-0.1, 0.5, "#448", 0.09, 0.46, 0.02],
              [0.2, 0.5, "#a44", 0.11, 0.5, 0.02],
              [0.4, 0.5, "#4a8", 0.09, 0.48, 0.02],
              [0.6, 0.5, "#88a", 0.13, 0.52, 0.02],
              [-0.8, 1.1, "#a86", 0.1, 0.5, 0.02],
              [-0.6, 1.1, "#468", 0.12, 0.48, 0.02],
            ].map(([x, y, color, w, h, _], i) => (
              <mesh key={`book-${i}`} position={[x as number, y as number, 0.17]} castShadow>
                <boxGeometry args={[w as number, h as number, 0.3]} />
                <meshLambertMaterial color={color as string} />
              </mesh>
            ))}
          </group>

          {/* Agent avatars */}
          {agents?.map((agent) => (
            <AgentAvatar
              key={agent.id}
              agent={agent}
              isSelected={selectedAgentId === agent.id}
              onClick={() => onSelectAgent(agent.id)}
            />
          ))}

          {/* Chatting connection lines */}
          {agents &&
            chattingPairs.map(([id1, id2]) => {
              const a1 = agents.find((a) => a.id === id1);
              const a2 = agents.find((a) => a.id === id2);
              if (!a1 || !a2) return null;
              return (
                <ConnectionLine
                  key={`conn-${id1}-${id2}`}
                  start={[a1.positionX, 1.2, a1.positionZ]}
                  end={[a2.positionX, 1.2, a2.positionZ]}
                  color="#2563eb"
                />
              );
            })}
        </Suspense>

        <OrbitControls
          makeDefault
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={8}
          maxDistance={30}
          target={[0, 0, 0]}
        />
      </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
