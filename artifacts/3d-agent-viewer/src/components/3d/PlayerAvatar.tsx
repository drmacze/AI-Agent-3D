import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useSettings } from "@/context/SettingsContext";

interface Props {
  position: [number, number, number];
  isMoving?: boolean;
  targetPosition?: [number, number, number];
}

export function PlayerAvatar({ position, isMoving = false, targetPosition }: Props) {
  const { settings } = useSettings();
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEyeLidRef = useRef<THREE.Mesh>(null);
  const rightEyeLidRef = useRef<THREE.Mesh>(null);
  const crownRef = useRef<THREE.Mesh>(null);

  const walkPhase = useRef(0);
  const blinkTimer = useRef(2.5);
  const blinkOpen = useRef(true);
  const currentPos = useRef(new THREE.Vector3(...position));
  const targetPos = useMemo(() => new THREE.Vector3(...(targetPosition ?? position)), [targetPosition, position]);

  const color = settings.playerColor;
  // Golden crown color
  const crownColor = "#f59e0b";

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // Smooth position interpolation
    currentPos.current.lerp(targetPos, Math.min(delta * 3.5, 1));
    groupRef.current.position.copy(currentPos.current);

    const moving = currentPos.current.distanceTo(targetPos) > 0.08 || isMoving;

    // Face direction of travel
    if (moving) {
      const dir = targetPos.clone().sub(currentPos.current);
      if (dir.lengthSq() > 0.001) {
        const angle = Math.atan2(dir.x, dir.z);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, delta * 9);
      }
    }

    // Crown pulsing glow
    if (crownRef.current) {
      const mat = crownRef.current.material as THREE.MeshLambertMaterial;
      mat.emissiveIntensity = 0.4 + Math.sin(t * 2.5) * 0.2;
    }

    // Blink
    blinkTimer.current -= delta;
    if (blinkTimer.current <= 0) {
      blinkOpen.current = !blinkOpen.current;
      blinkTimer.current = blinkOpen.current ? (2.5 + Math.random() * 3.5) : 0.1;
    }
    const bs = blinkOpen.current ? 1 : 0.05;
    if (leftEyeLidRef.current) leftEyeLidRef.current.scale.y = THREE.MathUtils.lerp(leftEyeLidRef.current.scale.y, bs, delta * 22);
    if (rightEyeLidRef.current) rightEyeLidRef.current.scale.y = THREE.MathUtils.lerp(rightEyeLidRef.current.scale.y, bs, delta * 22);

    if (moving) {
      walkPhase.current += delta * 9;
      const swing = Math.sin(walkPhase.current) * 0.42;
      const bob = Math.abs(Math.sin(walkPhase.current)) * 0.05;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) { leftArmRef.current.rotation.x = -swing * 0.6; leftArmRef.current.rotation.z = 0.12; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = swing * 0.6; rightArmRef.current.rotation.z = -0.12; }
      groupRef.current.position.y = currentPos.current.y + bob;
    } else {
      // Hero idle — subtle energy pulse
      const breathe = Math.sin(t * 1.2) * 0.013;
      const energy = Math.sin(t * 2.8) * 0.015;
      if (leftArmRef.current) { leftArmRef.current.rotation.x = energy * 0.5; leftArmRef.current.rotation.z = 0.14 + energy; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = -energy * 0.5; rightArmRef.current.rotation.z = -0.14 - energy; }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.35) * 0.1;
        headRef.current.rotation.x = breathe * 2;
      }
    }
  });

  const name = settings.playerName || "You";

  return (
    <group ref={groupRef} position={position}>
      {/* Player glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.28, 0.44, 32]} />
        <meshLambertMaterial color={color} transparent opacity={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[0.44, 0.52, 32]} />
        <meshLambertMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} scale={[1, 0.7, 1]}>
        <circleGeometry args={[0.26, 16]} />
        <meshLambertMaterial color="#806040" transparent opacity={0.3} />
      </mesh>

      {/* SHOES */}
      <mesh position={[-0.09, 0.065, 0.1]}>
        <boxGeometry args={[0.12, 0.065, 0.24]} />
        <meshLambertMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.09, 0.065, 0.1]}>
        <boxGeometry args={[0.12, 0.065, 0.24]} />
        <meshLambertMaterial color="#1a1a2e" />
      </mesh>

      {/* LEGS */}
      <group ref={leftLegRef} position={[-0.1, 0.1, 0]}>
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[0.13, 0.52, 0.14]} />
          <meshLambertMaterial color="#1e293b" />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.1, 0.1, 0]}>
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[0.13, 0.52, 0.14]} />
          <meshLambertMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* BELT */}
      <mesh position={[0, 0.64, 0]}>
        <boxGeometry args={[0.36, 0.045, 0.21]} />
        <meshLambertMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 0.645, 0.107]}>
        <boxGeometry args={[0.06, 0.035, 0.01]} />
        <meshLambertMaterial color={crownColor} />
      </mesh>

      {/* TORSO — player color jacket */}
      <mesh position={[0, 0.93, 0]}>
        <boxGeometry args={[0.36, 0.52, 0.21]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Jacket lapels */}
      <mesh position={[-0.06, 1.1, 0.108]}>
        <boxGeometry args={[0.055, 0.2, 0.01]} />
        <meshLambertMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.06, 1.1, 0.108]}>
        <boxGeometry args={[0.055, 0.2, 0.01]} />
        <meshLambertMaterial color="#0f172a" />
      </mesh>

      {/* Shoulder caps */}
      <mesh position={[-0.22, 1.17, 0]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0.22, 1.17, 0]}>
        <sphereGeometry args={[0.07, 8, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>

      {/* LEFT ARM */}
      <group ref={leftArmRef} position={[-0.22, 1.17, 0]}>
        <mesh position={[0, -0.21, 0]}>
          <boxGeometry args={[0.11, 0.42, 0.12]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.44, 0]}>
          <boxGeometry args={[0.115, 0.055, 0.125]} />
          <meshLambertMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[0, -0.55, 0.01]}>
          <boxGeometry args={[0.095, 0.11, 0.095]} />
          <meshLambertMaterial color="#f4c39a" />
        </mesh>
      </group>

      {/* RIGHT ARM */}
      <group ref={rightArmRef} position={[0.22, 1.17, 0]}>
        <mesh position={[0, -0.21, 0]}>
          <boxGeometry args={[0.11, 0.42, 0.12]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[0, -0.44, 0]}>
          <boxGeometry args={[0.115, 0.055, 0.125]} />
          <meshLambertMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[0, -0.55, 0.01]}>
          <boxGeometry args={[0.095, 0.11, 0.095]} />
          <meshLambertMaterial color="#f4c39a" />
        </mesh>
      </group>

      {/* NECK */}
      <mesh position={[0, 1.26, 0]}>
        <cylinderGeometry args={[0.063, 0.07, 0.1, 8]} />
        <meshLambertMaterial color="#f4c39a" />
      </mesh>

      {/* HEAD GROUP */}
      <group ref={headRef} position={[0, 1.45, 0]}>
        <mesh>
          <boxGeometry args={[0.28, 0.3, 0.26]} />
          <meshLambertMaterial color="#f4c39a" />
        </mesh>

        {/* Hair — darker */}
        <mesh position={[0, 0.17, -0.01]}>
          <boxGeometry args={[0.285, 0.1, 0.27]} />
          <meshLambertMaterial color="#1a0f06" />
        </mesh>
        <mesh position={[-0.14, 0.09, 0]}>
          <boxGeometry args={[0.02, 0.22, 0.26]} />
          <meshLambertMaterial color="#1a0f06" />
        </mesh>
        <mesh position={[0.14, 0.09, 0]}>
          <boxGeometry args={[0.02, 0.22, 0.26]} />
          <meshLambertMaterial color="#1a0f06" />
        </mesh>

        {/* Eyebrows */}
        <mesh position={[-0.075, 0.09, 0.133]}>
          <boxGeometry args={[0.07, 0.018, 0.01]} />
          <meshLambertMaterial color="#1a0f06" />
        </mesh>
        <mesh position={[0.075, 0.09, 0.133]}>
          <boxGeometry args={[0.07, 0.018, 0.01]} />
          <meshLambertMaterial color="#1a0f06" />
        </mesh>

        {/* Eye whites */}
        <mesh position={[-0.075, 0.04, 0.132]}>
          <boxGeometry args={[0.065, 0.04, 0.01]} />
          <meshLambertMaterial color="#f0ede8" />
        </mesh>
        <mesh position={[0.075, 0.04, 0.132]}>
          <boxGeometry args={[0.065, 0.04, 0.01]} />
          <meshLambertMaterial color="#f0ede8" />
        </mesh>

        {/* Iris — player color tint */}
        <mesh position={[-0.075, 0.04, 0.136]}>
          <boxGeometry args={[0.036, 0.036, 0.01]} />
          <meshLambertMaterial color={color} />
        </mesh>
        <mesh position={[0.075, 0.04, 0.136]}>
          <boxGeometry args={[0.036, 0.036, 0.01]} />
          <meshLambertMaterial color={color} />
        </mesh>

        {/* Pupils */}
        <mesh position={[-0.075, 0.04, 0.139]}>
          <boxGeometry args={[0.018, 0.018, 0.005]} />
          <meshLambertMaterial color="#050505" />
        </mesh>
        <mesh position={[0.075, 0.04, 0.139]}>
          <boxGeometry args={[0.018, 0.018, 0.005]} />
          <meshLambertMaterial color="#050505" />
        </mesh>

        {/* Eye lids */}
        <mesh ref={leftEyeLidRef} position={[-0.075, 0.04, 0.141]}>
          <boxGeometry args={[0.067, 0.042, 0.004]} />
          <meshLambertMaterial color="#f4c39a" />
        </mesh>
        <mesh ref={rightEyeLidRef} position={[0.075, 0.04, 0.141]}>
          <boxGeometry args={[0.067, 0.042, 0.004]} />
          <meshLambertMaterial color="#f4c39a" />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.02, 0.137]}>
          <boxGeometry args={[0.025, 0.028, 0.022]} />
          <meshLambertMaterial color="#f4c39a" />
        </mesh>

        {/* Mouth (slight smile) */}
        <mesh position={[0, -0.085, 0.134]}>
          <boxGeometry args={[0.065, 0.016, 0.008]} />
          <meshLambertMaterial color="#c07060" />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.142, 0.02, 0]}>
          <boxGeometry args={[0.02, 0.055, 0.05]} />
          <meshLambertMaterial color="#f4c39a" />
        </mesh>
        <mesh position={[0.142, 0.02, 0]}>
          <boxGeometry args={[0.02, 0.055, 0.05]} />
          <meshLambertMaterial color="#f4c39a" />
        </mesh>

        {/* CROWN — player indicator */}
        <mesh ref={crownRef} position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.08, 5]} />
          <meshLambertMaterial color={crownColor} emissive={crownColor} emissiveIntensity={0.4} />
        </mesh>
        {/* Crown points */}
        {[-0.1, 0, 0.1].map((x, i) => (
          <mesh key={i} position={[x, 0.32 + (i === 1 ? 0.03 : 0), 0]}>
            <coneGeometry args={[0.025, 0.07, 4]} />
            <meshLambertMaterial color={crownColor} emissive={crownColor} emissiveIntensity={0.5} />
          </mesh>
        ))}

        {/* Name tag */}
        <Html position={[0, 0.55, 0]} center zIndexRange={[200, 0]} className="pointer-events-none select-none">
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap"
            style={{ background: color, color: "#fff", border: "2px solid rgba(255,255,255,0.5)", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
          >
            👑 {name}
          </div>
        </Html>
      </group>
    </group>
  );
}
