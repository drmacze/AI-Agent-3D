import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { useListAgents, getListAgentsQueryKey } from "@workspace/api-client-react";
import { AgentAvatar } from "./AgentAvatar";
import { GridFloor } from "./GridFloor";
import { ConnectionLine } from "./ConnectionLine";
import { Suspense, useMemo } from "react";
import * as THREE from "three";

interface AgentSceneProps {
  onSelectAgent: (id: number) => void;
  selectedAgentId: number | null;
}

export function AgentScene({ onSelectAgent, selectedAgentId }: AgentSceneProps) {
  const { data: agents } = useListAgents({
    query: { refetchInterval: 3000, queryKey: getListAgentsQueryKey() }
  });

  const chattingPairs = useMemo(() => {
    if (!agents) return [];
    const pairs: Array<[number, number]> = [];
    const seen = new Set<string>();
    
    agents.forEach(agent => {
      if (agent.status === 'chatting' && agent.interactingWithId) {
        const pairId = [agent.id, agent.interactingWithId].sort().join('-');
        if (!seen.has(pairId)) {
          seen.add(pairId);
          pairs.push([agent.id, agent.interactingWithId]);
        }
      }
    });
    
    return pairs;
  }, [agents]);

  return (
    <div className="w-full h-full bg-background" data-testid="3d-scene-container">
      <Canvas
        camera={{ position: [0, 15, 20], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={['#0a0f18']} />
        <fog attach="fog" args={['#0a0f18', 10, 50]} />
        
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
        <pointLight position={[-10, 10, -10]} color="#00f0ff" intensity={2} distance={20} />
        
        <Suspense fallback={null}>
          <GridFloor />
          
          {agents?.map(agent => (
            <AgentAvatar
              key={agent.id}
              agent={agent}
              isSelected={selectedAgentId === agent.id}
              onClick={() => onSelectAgent(agent.id)}
            />
          ))}

          {agents && chattingPairs.map(([id1, id2]) => {
            const a1 = agents.find(a => a.id === id1);
            const a2 = agents.find(a => a.id === id2);
            if (a1 && a2) {
              return (
                <ConnectionLine
                  key={`conn-${id1}-${id2}`}
                  start={[a1.positionX, 1, a1.positionZ]}
                  end={[a2.positionX, 1, a2.positionZ]}
                  color={a1.color}
                />
              );
            }
            return null;
          })}
        </Suspense>

        <OrbitControls 
          makeDefault
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={10}
          maxDistance={40}
        />
        
        <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000000" />
      </Canvas>
    </div>
  );
}
