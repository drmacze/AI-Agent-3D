import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Agent } from "@workspace/api-client-react";

interface AgentAvatarProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

export function AgentAvatar({ agent, isSelected, onClick }: AgentAvatarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  const targetPosition = useMemo(() => new THREE.Vector3(agent.positionX, 1, agent.positionZ), [agent.positionX, agent.positionZ]);
  const currentPosition = useRef(new THREE.Vector3(agent.positionX, 1, agent.positionZ));

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Smooth movement
      currentPosition.current.lerp(targetPosition, delta * 3);
      meshRef.current.position.copy(currentPosition.current);

      // Hover animation
      const hoverOffset = Math.sin(state.clock.elapsedTime * 2 + agent.id) * 0.1;
      meshRef.current.position.y = 1 + hoverOffset;

      // Pulse animation if working or selected
      if (glowRef.current) {
        glowRef.current.position.copy(meshRef.current.position);
        if (agent.status === 'working' || isSelected) {
          const pulseScale = 1.2 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
          glowRef.current.scale.setScalar(pulseScale);
          (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(state.clock.elapsedTime * 5) * 0.2;
        } else {
          glowRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 5);
          (glowRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp((glowRef.current.material as THREE.MeshBasicMaterial).opacity, 0.1, delta * 5);
        }
      }
    }
  });

  const getGeometry = () => {
    switch(agent.role.toLowerCase()) {
      case 'researcher': return <octahedronGeometry args={[0.6, 0]} />;
      case 'coder': return <boxGeometry args={[1, 1, 1]} />;
      case 'planner': return <cylinderGeometry args={[0.5, 0.5, 1.2, 16]} />;
      case 'reviewer': return <sphereGeometry args={[0.6, 32, 32]} />;
      default: return <capsuleGeometry args={[0.4, 0.8, 4, 8]} />;
    }
  };

  return (
    <group onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Outer Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color={agent.color} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Main Body */}
      <mesh ref={meshRef} castShadow>
        {getGeometry()}
        <meshStandardMaterial 
          color={agent.color} 
          emissive={agent.color}
          emissiveIntensity={isSelected ? 0.8 : (agent.status === 'working' ? 0.5 : 0.2)}
          roughness={0.2}
          metalness={0.8}
        />
        
        {/* Name Label */}
        <Html position={[0, 1.5, 0]} center zIndexRange={[100, 0]} className="pointer-events-none">
          <div className={`px-2 py-1 rounded-md text-xs font-mono font-bold whitespace-nowrap transition-all duration-200 ${
            isSelected 
              ? 'bg-background/90 text-primary border border-primary/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]' 
              : 'bg-background/70 text-foreground border border-border backdrop-blur-sm'
          }`}>
            {agent.name}
            {agent.status === 'chatting' && <span className="ml-1 animate-pulse">💬</span>}
            {agent.status === 'working' && <span className="ml-1 text-orange-400">⚡</span>}
          </div>
        </Html>
      </mesh>
    </group>
  );
}
