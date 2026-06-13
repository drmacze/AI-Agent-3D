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

const SKIN_TONES = ["#f4c39a", "#d4956a", "#c07850", "#8b5e3c", "#a0784a", "#e8b89a"];
const SHIRT_COLORS = ["#2c5f8a", "#3a7d44", "#7c3a5e", "#6b4fa0", "#c0550a", "#2a6b7c"];
const HAIR_COLORS = ["#2c1a0e", "#4a3020", "#1a1a1a", "#8b6914", "#5a3010", "#3a2a1a"];

function getSkinTone(id: number) { return SKIN_TONES[id % SKIN_TONES.length]; }
function getShirtColor(id: number) { return SHIRT_COLORS[id % SHIRT_COLORS.length]; }
function getHairColor(id: number) { return HAIR_COLORS[id % HAIR_COLORS.length]; }

export function AgentAvatar({ agent, isSelected, onClick }: AgentAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  const skinColor = getSkinTone(agent.id);
  const shirtColor = getShirtColor(agent.id);
  const hairColor = getHairColor(agent.id);
  const pantsColor = "#3a3a4a";

  const targetPos = useMemo(
    () => new THREE.Vector3(agent.positionX, 0, agent.positionZ),
    [agent.positionX, agent.positionZ]
  );
  const currentPos = useRef(new THREE.Vector3(agent.positionX, 0, agent.positionZ));
  const walkPhase = useRef(Math.random() * Math.PI * 2);
  const typingPhase = useRef(Math.random() * Math.PI * 2);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;

    // Smooth movement
    currentPos.current.lerp(targetPos, Math.min(delta * 2.5, 1));
    groupRef.current.position.copy(currentPos.current);

    const dist = currentPos.current.distanceTo(targetPos);
    const isMoving = dist > 0.05;

    // Face toward target while moving
    if (isMoving) {
      const dir = targetPos.clone().sub(currentPos.current).normalize();
      if (dir.length() > 0.01) {
        const angle = Math.atan2(dir.x, dir.z);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, delta * 6);
      }
    }

    // Walking animation
    if (agent.status === "moving" || isMoving) {
      walkPhase.current += delta * 8;
      const swing = Math.sin(walkPhase.current) * 0.35;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.6;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.6;
      // Subtle body bob
      groupRef.current.position.y = Math.abs(Math.sin(walkPhase.current)) * 0.04;
    }
    // Typing animation
    else if (agent.status === "working") {
      typingPhase.current += delta * 9;
      const tap = Math.abs(Math.sin(typingPhase.current)) * 0.18;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.55 + Math.sin(typingPhase.current * 1.3) * 0.08;
        leftArmRef.current.rotation.z = 0.25;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.55 + Math.sin(typingPhase.current * 1.7 + 1.2) * 0.08;
        rightArmRef.current.rotation.z = -0.25;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      // Slight forward lean when typing
      if (bodyRef.current) bodyRef.current.rotation.x = 0.1;
      // Subtle head nod while reading screen
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(t * 0.5) * 0.04;
      }
    }
    // Chatting animation
    else if (agent.status === "chatting") {
      const nod = Math.sin(t * 1.8) * 0.06;
      if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.9) * 0.15;
      if (headRef.current) headRef.current.rotation.x = nod;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = Math.sin(t * 1.2) * 0.2 - 0.1;
        leftArmRef.current.rotation.z = 0.2;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = Math.sin(t * 1.4 + 0.5) * 0.2 - 0.1;
        rightArmRef.current.rotation.z = -0.2;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }
    // Idle — subtle breathing
    else {
      const breathe = Math.sin(t * 1.1) * 0.015;
      if (bodyRef.current) bodyRef.current.scale.y = 1 + breathe;
      if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.3) * 0.05;
      if (leftArmRef.current) { leftArmRef.current.rotation.x = 0; leftArmRef.current.rotation.z = 0.08; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = 0; rightArmRef.current.rotation.z = -0.08; }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* Shadow blob on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} scale={[1, 0.75, 1]}>
        <circleGeometry args={[0.22, 12]} />
        <meshLambertMaterial color="#b8b0a0" transparent opacity={0.35} />
      </mesh>

      {/* FEET */}
      <mesh position={[-0.085, 0.075, 0.09]} castShadow>
        <boxGeometry args={[0.1, 0.07, 0.2]} />
        <meshLambertMaterial color="#3a2e22" />
      </mesh>
      <mesh position={[0.085, 0.075, 0.09]} castShadow>
        <boxGeometry args={[0.1, 0.07, 0.2]} />
        <meshLambertMaterial color="#3a2e22" />
      </mesh>

      {/* LEFT LEG */}
      <mesh ref={leftLegRef} position={[-0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.12, 0.46, 0.13]} />
        <meshLambertMaterial color={pantsColor} />
      </mesh>

      {/* RIGHT LEG */}
      <mesh ref={rightLegRef} position={[0.1, 0.35, 0]} castShadow>
        <boxGeometry args={[0.12, 0.46, 0.13]} />
        <meshLambertMaterial color={pantsColor} />
      </mesh>

      {/* TORSO / BODY */}
      <mesh ref={bodyRef} position={[0, 0.82, 0]} castShadow>
        <boxGeometry args={[0.34, 0.42, 0.2]} />
        <meshLambertMaterial color={shirtColor} />
      </mesh>

      {/* Collar / shirt detail */}
      <mesh position={[0, 1.0, 0.08]} castShadow>
        <boxGeometry args={[0.12, 0.1, 0.04]} />
        <meshLambertMaterial color="#f5f0e8" />
      </mesh>

      {/* LEFT ARM */}
      <mesh ref={leftArmRef} position={[-0.22, 0.8, 0]} castShadow>
        <boxGeometry args={[0.1, 0.38, 0.11]} />
        <meshLambertMaterial color={shirtColor} />
      </mesh>
      {/* Left hand */}
      <mesh position={[-0.22, 0.58, 0.02]} castShadow>
        <boxGeometry args={[0.09, 0.1, 0.09]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>

      {/* RIGHT ARM */}
      <mesh ref={rightArmRef} position={[0.22, 0.8, 0]} castShadow>
        <boxGeometry args={[0.1, 0.38, 0.11]} />
        <meshLambertMaterial color={shirtColor} />
      </mesh>
      {/* Right hand */}
      <mesh position={[0.22, 0.58, 0.02]} castShadow>
        <boxGeometry args={[0.09, 0.1, 0.09]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>

      {/* NECK */}
      <mesh position={[0, 1.07, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 8]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>

      {/* HEAD */}
      <mesh ref={headRef} position={[0, 1.22, 0]} castShadow>
        <boxGeometry args={[0.24, 0.26, 0.22]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>

      {/* HAIR */}
      <mesh position={[0, 1.36, -0.01]} castShadow>
        <boxGeometry args={[0.25, 0.12, 0.24]} />
        <meshLambertMaterial color={hairColor} />
      </mesh>
      {/* Side hair */}
      <mesh position={[-0.12, 1.26, 0]} castShadow>
        <boxGeometry args={[0.02, 0.18, 0.22]} />
        <meshLambertMaterial color={hairColor} />
      </mesh>
      <mesh position={[0.12, 1.26, 0]} castShadow>
        <boxGeometry args={[0.02, 0.18, 0.22]} />
        <meshLambertMaterial color={hairColor} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.06, 1.22, 0.112]}>
        <boxGeometry args={[0.04, 0.03, 0.01]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.06, 1.22, 0.112]}>
        <boxGeometry args={[0.04, 0.03, 0.01]} />
        <meshLambertMaterial color="#1a1a1a" />
      </mesh>

      {/* Selection indicator ring on floor */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[0.28, 0.34, 20]} />
          <meshLambertMaterial color="#2563eb" transparent opacity={0.7} />
        </mesh>
      )}

      {/* Name label */}
      <Html position={[0, 1.65, 0]} center zIndexRange={[100, 0]} className="pointer-events-none">
        <div
          className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap shadow-sm border transition-all duration-200 ${
            isSelected
              ? "bg-blue-600 text-white border-blue-700"
              : "bg-white/90 text-gray-800 border-gray-200"
          }`}
        >
          {agent.name}
        </div>
      </Html>
    </group>
  );
}
