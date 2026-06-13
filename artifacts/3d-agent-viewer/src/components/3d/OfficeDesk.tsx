import { useMemo } from "react";
import * as THREE from "three";

interface OfficeDeskProps {
  position: [number, number, number];
  rotation?: number;
  hasAgent?: boolean;
  agentColor?: string;
  agentStatus?: string;
}

export function OfficeDesk({ position, rotation = 0, hasAgent, agentColor, agentStatus }: OfficeDeskProps) {
  const deskColor = "#c8b89a";
  const legColor = "#7a6752";
  const monitorColor = "#2c2c2e";
  const screenColor = agentStatus === "working" ? "#4a90d9" : "#1a1a2e";
  const keyboardColor = "#d0cdc8";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Desk surface */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.05, 0.85]} />
        <meshLambertMaterial color={deskColor} />
      </mesh>

      {/* Desk legs */}
      {[[-0.7, 0], [0.7, 0], [-0.7, -0.75], [0.7, -0.75]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.37, z as number]} castShadow>
          <boxGeometry args={[0.06, 0.74, 0.06]} />
          <meshLambertMaterial color={legColor} />
        </mesh>
      ))}

      {/* Monitor base */}
      <mesh position={[0, 0.8, -0.2]} castShadow>
        <boxGeometry args={[0.2, 0.03, 0.2]} />
        <meshLambertMaterial color={monitorColor} />
      </mesh>
      {/* Monitor neck */}
      <mesh position={[0, 0.96, -0.22]} castShadow>
        <boxGeometry args={[0.04, 0.3, 0.04]} />
        <meshLambertMaterial color={monitorColor} />
      </mesh>
      {/* Monitor screen bezel */}
      <mesh position={[0, 1.26, -0.26]} castShadow>
        <boxGeometry args={[0.72, 0.44, 0.04]} />
        <meshLambertMaterial color={monitorColor} />
      </mesh>
      {/* Monitor screen glow */}
      <mesh position={[0, 1.26, -0.24]}>
        <boxGeometry args={[0.66, 0.38, 0.01]} />
        <meshLambertMaterial color={screenColor} emissive={new THREE.Color(screenColor)} emissiveIntensity={agentStatus === "working" ? 0.6 : 0.2} />
      </mesh>

      {/* Keyboard */}
      <mesh position={[0, 0.79, 0.1]} castShadow>
        <boxGeometry args={[0.5, 0.02, 0.18]} />
        <meshLambertMaterial color={keyboardColor} />
      </mesh>

      {/* Mouse */}
      <mesh position={[0.35, 0.785, 0.1]} castShadow>
        <boxGeometry args={[0.07, 0.015, 0.11]} />
        <meshLambertMaterial color={keyboardColor} />
      </mesh>

      {/* Coffee mug */}
      <mesh position={[-0.55, 0.82, 0.15]} castShadow>
        <cylinderGeometry args={[0.05, 0.04, 0.1, 8]} />
        <meshLambertMaterial color="#e8d5b7" />
      </mesh>

      {/* Papers */}
      <mesh position={[0.55, 0.78, 0.25]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.22, 0.005, 0.17]} />
        <meshLambertMaterial color="#f5f0e8" />
      </mesh>
    </group>
  );
}
