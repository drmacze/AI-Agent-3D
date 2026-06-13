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
  const isWorking = agentStatus === "working";
  const screenColor = isWorking ? "#4a90d9" : "#111827";
  const glowColor   = isWorking ? new THREE.Color(0x4a90d9) : new THREE.Color(0x1e40af);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Desk surface — light wood */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.62, 0.06, 0.87]} />
        <meshStandardMaterial color="#c8b89a" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* Desk surface edge trim */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[1.65, 0.03, 0.9]} />
        <meshStandardMaterial color="#b5a488" roughness={0.6} metalness={0.0} />
      </mesh>

      {/* Desk panel / modesty board */}
      <mesh position={[0, 0.37, -0.41]} castShadow>
        <boxGeometry args={[1.58, 0.72, 0.025]} />
        <meshStandardMaterial color="#bfae95" roughness={0.65} metalness={0.0} />
      </mesh>

      {/* Legs — thin metal */}
      {([[-0.72, -0.39], [0.72, -0.39], [-0.72, 0.39], [0.72, 0.39]] as [number,number][]).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.37, z]} castShadow>
          <boxGeometry args={[0.05, 0.74, 0.05]} />
          <meshStandardMaterial color="#6b7280" roughness={0.3} metalness={0.75} />
        </mesh>
      ))}

      {/* Cable tray under desk */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[1.2, 0.04, 0.12]} />
        <meshStandardMaterial color="#4b5563" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Monitor stand base */}
      <mesh position={[0, 0.785, -0.22]} castShadow>
        <boxGeometry args={[0.22, 0.025, 0.22]} />
        <meshStandardMaterial color="#1f2937" roughness={0.25} metalness={0.8} />
      </mesh>
      {/* Monitor neck */}
      <mesh position={[0, 0.96, -0.23]} castShadow>
        <boxGeometry args={[0.035, 0.32, 0.035]} />
        <meshStandardMaterial color="#1f2937" roughness={0.25} metalness={0.8} />
      </mesh>
      {/* Monitor bezel */}
      <mesh position={[0, 1.27, -0.27]} castShadow>
        <boxGeometry args={[0.74, 0.46, 0.032]} />
        <meshStandardMaterial color="#111827" roughness={0.2} metalness={0.7} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 1.27, -0.254]}>
        <boxGeometry args={[0.68, 0.40, 0.005]} />
        <meshStandardMaterial
          color={screenColor}
          emissive={glowColor}
          emissiveIntensity={isWorking ? 0.55 : 0.12}
          roughness={0.1}
          metalness={0.0}
        />
      </mesh>
      {/* Screen subtle reflection stripe */}
      <mesh position={[0, 1.35, -0.252]}>
        <boxGeometry args={[0.66, 0.06, 0.002]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.04} roughness={0} />
      </mesh>

      {/* Keyboard */}
      <mesh position={[0, 0.782, 0.1]} castShadow>
        <boxGeometry args={[0.52, 0.018, 0.19]} />
        <meshStandardMaterial color="#d1cdc8" roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Mouse */}
      <mesh position={[0.34, 0.787, 0.09]} castShadow>
        <boxGeometry args={[0.068, 0.014, 0.112]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Mousepad */}
      <mesh position={[0.34, 0.779, 0.09]} castShadow>
        <boxGeometry args={[0.2, 0.004, 0.25]} />
        <meshStandardMaterial color="#374151" roughness={0.9} metalness={0.0} />
      </mesh>

      {/* Coffee mug */}
      <mesh position={[-0.56, 0.82, 0.16]} castShadow>
        <cylinderGeometry args={[0.045, 0.038, 0.095, 14]} />
        <meshStandardMaterial color="#e5d5b0" roughness={0.4} metalness={0.0} />
      </mesh>
      <mesh position={[-0.56, 0.87, 0.16]}>
        <cylinderGeometry args={[0.04, 0.04, 0.01, 14]} />
        <meshStandardMaterial color="#5c3d2e" roughness={0.8} metalness={0.0} />
      </mesh>

      {/* Notebook/papers */}
      <mesh position={[0.53, 0.778, 0.26]} rotation={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.21, 0.006, 0.165]} />
        <meshStandardMaterial color="#f5f0e8" roughness={0.9} metalness={0.0} />
      </mesh>

      {/* Agent indicator light */}
      {hasAgent && (
        <mesh position={[0.72, 0.79, -0.37]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial
            color={agentColor ?? "#10b981"}
            emissive={new THREE.Color(agentColor ?? "#10b981")}
            emissiveIntensity={isWorking ? 1.2 : 0.4}
            roughness={0}
            metalness={0}
          />
        </mesh>
      )}
    </group>
  );
}
