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
  const groupRef    = useRef<THREE.Group>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef  = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headRef     = useRef<THREE.Group>(null);
  const leftEyeLid  = useRef<THREE.Mesh>(null);
  const rightEyeLid = useRef<THREE.Mesh>(null);
  const crownRef    = useRef<THREE.Mesh>(null);
  const bodyRef     = useRef<THREE.Mesh>(null);

  const walkPhase  = useRef(0);
  const idlePhase  = useRef(0);
  const blinkTimer = useRef(2.5);
  const blinkOpen  = useRef(true);
  const currentPos = useRef(new THREE.Vector3(...position));
  const targetPos  = useMemo(() => new THREE.Vector3(...(targetPosition ?? position)), [targetPosition, position]);

  const color     = settings.playerColor;
  const skin      = (settings as { playerSkinTone?: string }).playerSkinTone  ?? "#f4c39a";
  const hair      = (settings as { playerHairColor?: string }).playerHairColor ?? "#1a0f06";
  const hairStyle = (settings as { playerHairStyle?: string }).playerHairStyle ?? "short";
  const crownColor = "#f59e0b";

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    currentPos.current.lerp(targetPos, Math.min(delta * 3.5, 1));
    groupRef.current.position.copy(currentPos.current);
    const moving = currentPos.current.distanceTo(targetPos) > 0.08 || isMoving;

    if (moving) {
      const dir = targetPos.clone().sub(currentPos.current);
      if (dir.lengthSq() > 0.001) {
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y, Math.atan2(dir.x, dir.z), delta * 9
        );
      }
    }

    blinkTimer.current -= delta;
    if (blinkTimer.current <= 0) {
      blinkOpen.current = !blinkOpen.current;
      blinkTimer.current = blinkOpen.current ? (2.5 + Math.random() * 3) : 0.1;
    }
    const bs = blinkOpen.current ? 1 : 0.04;
    if (leftEyeLid.current)  leftEyeLid.current.scale.y  = THREE.MathUtils.lerp(leftEyeLid.current.scale.y,  bs, delta * 22);
    if (rightEyeLid.current) rightEyeLid.current.scale.y = THREE.MathUtils.lerp(rightEyeLid.current.scale.y, bs, delta * 22);
    if (crownRef.current) crownRef.current.rotation.y = t * 0.5;

    if (moving) {
      walkPhase.current += delta * 9;
      const swing = Math.sin(walkPhase.current) * 0.45;
      const bob   = Math.abs(Math.sin(walkPhase.current)) * 0.05;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  = -swing * 0.55; leftArmRef.current.rotation.z  =  0.08; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x =  swing * 0.55; rightArmRef.current.rotation.z = -0.08; }
      groupRef.current.position.y = bob;
    } else {
      idlePhase.current += delta * 0.65;
      const breathe = Math.sin(t * 0.95) * 0.013;
      const sway    = Math.sin(idlePhase.current * 0.4) * 0.018;
      if (bodyRef.current) { bodyRef.current.scale.y = 1 + breathe; bodyRef.current.rotation.z = sway; }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.3) * 0.1;
        headRef.current.rotation.x = Math.sin(t * 0.7) * 0.04;
      }
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  = 0; leftArmRef.current.rotation.z  =  0.1 + sway * 0.4; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = 0; rightArmRef.current.rotation.z = -0.1 - sway * 0.4; }
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;
    }
  });

  const name = settings.playerName || "You";

  return (
    <group ref={groupRef} position={[position[0], 0, position[2]]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <circleGeometry args={[0.26, 16]} />
        <meshLambertMaterial color="#604020" transparent opacity={0.2} />
      </mesh>

      {([-0.09, 0.09] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.065, 0.1]}>
          <boxGeometry args={[0.12, 0.065, 0.24]} /><meshLambertMaterial color="#1a1212" />
        </mesh>
      ))}

      <group ref={leftLegRef} position={[-0.1, 0.1, 0]}>
        <mesh position={[0, 0.26, 0]}><boxGeometry args={[0.13, 0.52, 0.14]} /><meshLambertMaterial color="#1e293b" /></mesh>
      </group>
      <group ref={rightLegRef} position={[0.1, 0.1, 0]}>
        <mesh position={[0, 0.26, 0]}><boxGeometry args={[0.13, 0.52, 0.14]} /><meshLambertMaterial color="#1e293b" /></mesh>
      </group>

      <mesh position={[0, 0.64, 0]}><boxGeometry args={[0.36, 0.045, 0.21]} /><meshLambertMaterial color="#0f172a" /></mesh>
      <mesh position={[0, 0.645, 0.107]}><boxGeometry args={[0.06, 0.035, 0.01]} /><meshLambertMaterial color={crownColor} /></mesh>

      <mesh ref={bodyRef} position={[0, 0.93, 0]}><boxGeometry args={[0.36, 0.52, 0.21]} /><meshLambertMaterial color={color} /></mesh>
      <mesh position={[-0.06, 1.1, 0.108]}><boxGeometry args={[0.055, 0.2, 0.01]} /><meshLambertMaterial color="#0f172a" /></mesh>
      <mesh position={[ 0.06, 1.1, 0.108]}><boxGeometry args={[0.055, 0.2, 0.01]} /><meshLambertMaterial color="#0f172a" /></mesh>
      <mesh position={[0, 0.93, 0.108]}><boxGeometry args={[0.08, 0.32, 0.01]} /><meshLambertMaterial color="#f0f4f8" /></mesh>

      {([-0.22, 0.22] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 1.17, 0]}><sphereGeometry args={[0.07, 8, 6]} /><meshLambertMaterial color={color} /></mesh>
      ))}

      <group ref={leftArmRef} position={[-0.22, 1.17, 0]}>
        <mesh position={[0, -0.21, 0]}><boxGeometry args={[0.11, 0.42, 0.12]} /><meshLambertMaterial color={color} /></mesh>
        <mesh position={[0, -0.44, 0]}><boxGeometry args={[0.115, 0.055, 0.125]} /><meshLambertMaterial color="#e2e8f0" /></mesh>
        <mesh position={[0, -0.55, 0.01]}><boxGeometry args={[0.095, 0.11, 0.095]} /><meshLambertMaterial color={skin} /></mesh>
      </group>
      <group ref={rightArmRef} position={[0.22, 1.17, 0]}>
        <mesh position={[0, -0.21, 0]}><boxGeometry args={[0.11, 0.42, 0.12]} /><meshLambertMaterial color={color} /></mesh>
        <mesh position={[0, -0.44, 0]}><boxGeometry args={[0.115, 0.055, 0.125]} /><meshLambertMaterial color="#e2e8f0" /></mesh>
        <mesh position={[0, -0.55, 0.01]}><boxGeometry args={[0.095, 0.11, 0.095]} /><meshLambertMaterial color={skin} /></mesh>
      </group>

      <mesh position={[0, 1.26, 0]}>
        <cylinderGeometry args={[0.063, 0.07, 0.1, 8]} /><meshLambertMaterial color={skin} />
      </mesh>

      <group ref={headRef} position={[0, 1.45, 0]}>
        <mesh><boxGeometry args={[0.28, 0.3, 0.26]} /><meshLambertMaterial color={skin} /></mesh>

        {hairStyle === "short" && <>
          <mesh position={[0, 0.17, -0.01]}><boxGeometry args={[0.285, 0.1, 0.27]} /><meshLambertMaterial color={hair} /></mesh>
          <mesh position={[-0.14, 0.09, 0]}><boxGeometry args={[0.02, 0.22, 0.26]} /><meshLambertMaterial color={hair} /></mesh>
          <mesh position={[ 0.14, 0.09, 0]}><boxGeometry args={[0.02, 0.22, 0.26]} /><meshLambertMaterial color={hair} /></mesh>
        </>}
        {hairStyle === "medium" && <>
          <mesh position={[0, 0.17, -0.01]}><boxGeometry args={[0.285, 0.1, 0.27]} /><meshLambertMaterial color={hair} /></mesh>
          <mesh position={[-0.14, 0.0, 0]}><boxGeometry args={[0.025, 0.42, 0.26]} /><meshLambertMaterial color={hair} /></mesh>
          <mesh position={[ 0.14, 0.0, 0]}><boxGeometry args={[0.025, 0.42, 0.26]} /><meshLambertMaterial color={hair} /></mesh>
          <mesh position={[0, 0.0, -0.135]}><boxGeometry args={[0.27, 0.35, 0.02]} /><meshLambertMaterial color={hair} /></mesh>
        </>}
        {hairStyle === "long" && <>
          <mesh position={[0, 0.17, -0.01]}><boxGeometry args={[0.285, 0.1, 0.27]} /><meshLambertMaterial color={hair} /></mesh>
          <mesh position={[-0.14, -0.12, 0]}><boxGeometry args={[0.025, 0.65, 0.26]} /><meshLambertMaterial color={hair} /></mesh>
          <mesh position={[ 0.14, -0.12, 0]}><boxGeometry args={[0.025, 0.65, 0.26]} /><meshLambertMaterial color={hair} /></mesh>
          <mesh position={[0, -0.12, -0.135]}><boxGeometry args={[0.27, 0.55, 0.02]} /><meshLambertMaterial color={hair} /></mesh>
        </>}
        {hairStyle === "bun" && <>
          <mesh position={[0, 0.17, -0.01]}><boxGeometry args={[0.285, 0.1, 0.27]} /><meshLambertMaterial color={hair} /></mesh>
          <mesh position={[-0.14, 0.09, 0]}><boxGeometry args={[0.02, 0.22, 0.26]} /><meshLambertMaterial color={hair} /></mesh>
          <mesh position={[ 0.14, 0.09, 0]}><boxGeometry args={[0.02, 0.22, 0.26]} /><meshLambertMaterial color={hair} /></mesh>
          <mesh position={[0, 0.3, -0.08]}><sphereGeometry args={[0.075, 8, 6]} /><meshLambertMaterial color={hair} /></mesh>
        </>}

        <mesh position={[-0.075, 0.09, 0.133]}><boxGeometry args={[0.07, 0.018, 0.01]} /><meshLambertMaterial color={hair} /></mesh>
        <mesh position={[ 0.075, 0.09, 0.133]}><boxGeometry args={[0.07, 0.018, 0.01]} /><meshLambertMaterial color={hair} /></mesh>

        <mesh position={[-0.075, 0.04, 0.132]}><boxGeometry args={[0.065, 0.04, 0.01]} /><meshLambertMaterial color="#f0ede8" /></mesh>
        <mesh position={[ 0.075, 0.04, 0.132]}><boxGeometry args={[0.065, 0.04, 0.01]} /><meshLambertMaterial color="#f0ede8" /></mesh>

        <mesh position={[-0.075, 0.04, 0.136]}><boxGeometry args={[0.036, 0.036, 0.01]} /><meshLambertMaterial color={color} /></mesh>
        <mesh position={[ 0.075, 0.04, 0.136]}><boxGeometry args={[0.036, 0.036, 0.01]} /><meshLambertMaterial color={color} /></mesh>

        <mesh position={[-0.075, 0.04, 0.139]}><boxGeometry args={[0.018, 0.018, 0.005]} /><meshLambertMaterial color="#050505" /></mesh>
        <mesh position={[ 0.075, 0.04, 0.139]}><boxGeometry args={[0.018, 0.018, 0.005]} /><meshLambertMaterial color="#050505" /></mesh>

        <mesh position={[-0.067, 0.048, 0.141]}><boxGeometry args={[0.006, 0.006, 0.002]} /><meshLambertMaterial color="#ffffff" /></mesh>
        <mesh position={[ 0.083, 0.048, 0.141]}><boxGeometry args={[0.006, 0.006, 0.002]} /><meshLambertMaterial color="#ffffff" /></mesh>

        <mesh ref={leftEyeLid}  position={[-0.075, 0.04, 0.141]}><boxGeometry args={[0.067, 0.042, 0.004]} /><meshLambertMaterial color={skin} /></mesh>
        <mesh ref={rightEyeLid} position={[ 0.075, 0.04, 0.141]}><boxGeometry args={[0.067, 0.042, 0.004]} /><meshLambertMaterial color={skin} /></mesh>

        <mesh position={[0, -0.02, 0.137]}><boxGeometry args={[0.025, 0.028, 0.022]} /><meshLambertMaterial color={skin} /></mesh>
        <mesh position={[0, -0.085, 0.134]}><boxGeometry args={[0.065, 0.016, 0.008]} /><meshLambertMaterial color="#c07060" /></mesh>

        <mesh position={[-0.142, 0.02, 0]}><boxGeometry args={[0.02, 0.055, 0.05]} /><meshLambertMaterial color={skin} /></mesh>
        <mesh position={[ 0.142, 0.02, 0]}><boxGeometry args={[0.02, 0.055, 0.05]} /><meshLambertMaterial color={skin} /></mesh>

        <mesh ref={crownRef} position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.13, 0.15, 0.07, 5]} />
          <meshLambertMaterial color={crownColor} emissive={crownColor} emissiveIntensity={0.55} />
        </mesh>
        {([-0.1, 0, 0.1] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0.32 + (i === 1 ? 0.04 : 0), 0]}>
            <coneGeometry args={[0.025, 0.075, 4]} />
            <meshLambertMaterial color={crownColor} emissive={crownColor} emissiveIntensity={0.55} />
          </mesh>
        ))}
        <mesh position={[0, 0.37, 0]}>
          <octahedronGeometry args={[0.022]} />
          <meshLambertMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.9} />
        </mesh>

        <Html position={[0, 0.62, 0]} center zIndexRange={[200, 0]} className="pointer-events-none select-none">
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
