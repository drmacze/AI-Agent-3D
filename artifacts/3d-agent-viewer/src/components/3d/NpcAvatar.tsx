import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { NpcAgent } from "@/context/FloorContext";

const SKIN_TONES = ["#f4c39a","#d4956a","#c07850","#8b5e3c","#a0784a","#e8b89a","#f0d0a8","#c89870"];
const HAIR_COLORS = ["#1a0f06","#3a2010","#0f0f0f","#6b4a08","#3a1a08","#b07030","#f0c060","#1a1a3a"];
const PANTS_COLORS = ["#1e293b","#2d1f3a","#1a3a2a","#302d40","#3a2010","#1e3a4a"];
const SHOE_COLORS = ["#1a1212","#120e0e","#1e1408","#0e0e14","#1a120a"];

function hash(n: number) { return ((Math.sin(n * 127.1) * 43758.5) % 1 + 1) % 1; }

function getActivityEmoji(agent: NpcAgent): { emoji: string; label: string } {
  const t = agent.currentTask.toLowerCase();
  if (agent.status === "coffee")     return { emoji: "☕", label: "Coffee" };
  if (agent.status === "presenting") return { emoji: "📊", label: "Presenting" };
  if (agent.status === "chatting")   return { emoji: "💬", label: "Chatting" };
  if (t.includes("design") || t.includes("ui")) return { emoji: "🎨", label: "Designing" };
  if (t.includes("code") || t.includes("build") || t.includes("develop")) return { emoji: "⌨️", label: "Coding" };
  if (t.includes("train") || t.includes("model") || t.includes("ml")) return { emoji: "🧠", label: "Training" };
  if (t.includes("data") || t.includes("analyz")) return { emoji: "📊", label: "Analyzing" };
  if (t.includes("deploy") || t.includes("infra") || t.includes("kube")) return { emoji: "🚀", label: "Deploying" };
  if (t.includes("review") || t.includes("audit")) return { emoji: "🔍", label: "Reviewing" };
  if (t.includes("meet") || t.includes("align") || t.includes("coord")) return { emoji: "📋", label: "Meeting" };
  if (t.includes("report") || t.includes("strat") || t.includes("budget")) return { emoji: "📈", label: "Planning" };
  if (t.includes("research") || t.includes("paper")) return { emoji: "🔬", label: "Researching" };
  if (t.includes("test") || t.includes("pen")) return { emoji: "🧪", label: "Testing" };
  if (agent.status === "idle") return { emoji: "💤", label: "Idle" };
  return { emoji: "💼", label: "Working" };
}

interface Props {
  agent: NpcAgent;
  isSelected?: boolean;
  onClick?: () => void;
}

// Dynamic NPC status that cycles over time
function useDynamicStatus(initialStatus: NpcAgent["status"], seed: number) {
  const statusRef = useRef(initialStatus);
  const timerRef  = useRef(seed % 20 + 10);
  const statuses: NpcAgent["status"][] = ["working", "working", "working", "chatting", "idle", "coffee", "presenting"];
  return statusRef;
}

export function NpcAvatar({ agent, isSelected = false, onClick }: Props) {
  const groupRef    = useRef<THREE.Group>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef  = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headRef     = useRef<THREE.Group>(null);
  const bodyRef     = useRef<THREE.Mesh>(null);
  const leftEyeLid  = useRef<THREE.Mesh>(null);
  const rightEyeLid = useRef<THREE.Mesh>(null);
  // For coffee cup
  const coffeeRef   = useRef<THREE.Group>(null);
  // For phone/tablet (presenting)
  const tabletRef   = useRef<THREE.Group>(null);

  const seed = useMemo(() => {
    let s = 0;
    for (let i = 0; i < agent.id.length; i++) s += agent.id.charCodeAt(i);
    return s;
  }, [agent.id]);

  const skinColor  = useMemo(() => SKIN_TONES [seed % SKIN_TONES.length],  [seed]);
  const hairColor  = useMemo(() => HAIR_COLORS [seed % HAIR_COLORS.length],  [seed]);
  const pantsColor = useMemo(() => PANTS_COLORS[seed % PANTS_COLORS.length], [seed]);
  const shoeColor  = useMemo(() => SHOE_COLORS [seed % SHOE_COLORS.length],  [seed]);
  const accentColor = agent.color;

  const walkPhase  = useRef(Math.random() * Math.PI * 2);
  const idlePhase  = useRef(Math.random() * Math.PI * 2);
  const typingPhase = useRef(Math.random() * Math.PI * 2);
  const blinkTimer = useRef(Math.random() * 4 + 2);
  const blinkOpen  = useRef(true);
  const targetPos  = useMemo(() => new THREE.Vector3(agent.positionX, 0, agent.positionZ), [agent.positionX, agent.positionZ]);
  const currentPos = useRef(new THREE.Vector3(agent.positionX, 0, agent.positionZ));

  // Internal status that can evolve independently
  const liveStatus = useRef(agent.status);
  const statusTimer = useRef(seed % 15 + 8);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + seed * 0.37;

    // Evolve status over time for more organic behavior
    statusTimer.current -= delta;
    if (statusTimer.current <= 0) {
      const roll = Math.random();
      const wasStatus = liveStatus.current;
      if (roll < 0.45)      liveStatus.current = "working";
      else if (roll < 0.60) liveStatus.current = "chatting";
      else if (roll < 0.72) liveStatus.current = "idle";
      else if (roll < 0.82) liveStatus.current = "coffee";
      else if (roll < 0.90) liveStatus.current = "presenting";
      else                  liveStatus.current = "moving";
      statusTimer.current = 8 + Math.random() * 18;

      // Move to a new spot when transitioning
      if (liveStatus.current === "moving" || liveStatus.current !== wasStatus) {
        const SPOTS: [number, number][] = [
          [-10.5,-8],[-4,-8],[9.5,-8],[-11,7],[11,-6],
          [7,1],[0,0],[-5,-3],[-1,-3],[3,-3],[-5,3],[-1,3],[3,3],
          [4,-5],[-3,5],[6,-3],[-7,1],[2,5],[-8,-2],[8,4],
        ];
        const spot = SPOTS[Math.floor(Math.random() * SPOTS.length)];
        targetPos.set(spot[0], 0, spot[1]);
      }
    }

    currentPos.current.lerp(targetPos, Math.min(delta * 2.2, 1));
    groupRef.current.position.copy(currentPos.current);

    const moving = currentPos.current.distanceTo(targetPos) > 0.15;

    if (moving) {
      const dir = targetPos.clone().sub(currentPos.current);
      if (dir.lengthSq() > 0.001) {
        const angle = Math.atan2(dir.x, dir.z);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, delta * 7);
      }
    }

    // Blink
    blinkTimer.current -= delta;
    if (blinkTimer.current <= 0) {
      blinkOpen.current = !blinkOpen.current;
      blinkTimer.current = blinkOpen.current ? (2 + Math.random() * 4) : 0.12;
    }
    const bs = blinkOpen.current ? 1 : 0.05;
    if (leftEyeLid.current)  leftEyeLid.current.scale.y  = THREE.MathUtils.lerp(leftEyeLid.current.scale.y,  bs, delta * 20);
    if (rightEyeLid.current) rightEyeLid.current.scale.y = THREE.MathUtils.lerp(rightEyeLid.current.scale.y, bs, delta * 20);

    // Coffee prop visibility
    if (coffeeRef.current)  coffeeRef.current.visible  = liveStatus.current === "coffee";
    if (tabletRef.current)  tabletRef.current.visible  = liveStatus.current === "presenting";

    const status = liveStatus.current;

    if (moving || status === "moving") {
      walkPhase.current += delta * 8;
      const swing = Math.sin(walkPhase.current) * 0.4;
      const bob   = Math.abs(Math.sin(walkPhase.current)) * 0.04;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  = -swing * 0.55; leftArmRef.current.rotation.z  =  0.08; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x =  swing * 0.55; rightArmRef.current.rotation.z = -0.08; }
      groupRef.current.position.y = bob;

    } else if (status === "working") {
      typingPhase.current += delta * 9;
      const tapL = Math.sin(typingPhase.current * 1.3) * 0.09;
      const tapR = Math.sin(typingPhase.current * 1.7 + 1.1) * 0.09;
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  = -0.5 + tapL; leftArmRef.current.rotation.z  = 0.28; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = -0.5 + tapR; rightArmRef.current.rotation.z = -0.28; }
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (bodyRef.current)     bodyRef.current.rotation.x = 0.08;
      if (headRef.current) {
        headRef.current.rotation.x = 0.1 + Math.sin(t * 0.6) * 0.04;
        headRef.current.rotation.y = Math.sin(t * 0.25 + seed * 0.3) * 0.06;
      }
      groupRef.current.position.y = 0;

    } else if (status === "chatting") {
      const gesture = Math.sin(t * 1.5 + seed * 0.5) * 0.28;
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  =  gesture - 0.1; leftArmRef.current.rotation.z  =  0.24; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = -gesture * 0.7; rightArmRef.current.rotation.z = -0.24; }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.8 + seed * 0.3) * 0.2;
        headRef.current.rotation.x = Math.sin(t * 2.0 + seed) * 0.07;
      }
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (bodyRef.current)     bodyRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;

    } else if (status === "coffee") {
      // Drinking coffee — one arm raised, head tilting
      if (rightArmRef.current) { rightArmRef.current.rotation.x = -0.9 + Math.sin(t * 0.8 + seed) * 0.12; rightArmRef.current.rotation.z = -0.3; }
      if (leftArmRef.current)  { leftArmRef.current.rotation.x = 0; leftArmRef.current.rotation.z = 0.12; }
      if (headRef.current) {
        headRef.current.rotation.x = -0.15 + Math.sin(t * 0.5) * 0.06;
        headRef.current.rotation.y = Math.sin(t * 0.3 + seed) * 0.1;
      }
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (bodyRef.current)     bodyRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;

    } else if (status === "presenting") {
      // Holding tablet, gesturing with other arm
      const wave = Math.sin(t * 1.2 + seed * 0.4) * 0.18;
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  = -0.4 + wave; leftArmRef.current.rotation.z  =  0.35; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = -0.55; rightArmRef.current.rotation.z = -0.18; }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.5 + seed * 0.2) * 0.22;
        headRef.current.rotation.x = 0.06;
      }
      if (bodyRef.current) bodyRef.current.rotation.x = 0;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;

    } else {
      // Idle breathing
      idlePhase.current += delta * 0.6;
      const breathe = Math.sin(t * 0.9 + seed * 0.5) * 0.012;
      const shift   = Math.sin(idlePhase.current * 0.5) * 0.02;
      if (bodyRef.current) { bodyRef.current.scale.y = 1 + breathe; bodyRef.current.rotation.z = shift; bodyRef.current.rotation.x = 0; }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.25 + seed * 0.4) * 0.09;
        headRef.current.rotation.x = Math.sin(t * 0.6 + seed) * 0.04;
      }
      if (leftArmRef.current)  { leftArmRef.current.rotation.x = 0; leftArmRef.current.rotation.z = 0.1 + shift * 0.5; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = 0; rightArmRef.current.rotation.z = -0.1 - shift * 0.5; }
      if (leftLegRef.current)  leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;
    }
  });

  const activity = getActivityEmoji({ ...agent, status: liveStatus.current });

  return (
    <group ref={groupRef} position={[agent.positionX, 0, agent.positionZ]}
      onClick={e => { e.stopPropagation(); onClick?.(); }}>

      {/* Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 0]} scale={[1, 0.72, 1]}>
        <circleGeometry args={[0.23, 14]} />
        <meshLambertMaterial color="#806040" transparent opacity={0.26} />
      </mesh>

      {/* Shoes */}
      <mesh position={[-0.09, 0.065, 0.1]}><boxGeometry args={[0.12, 0.065, 0.24]} /><meshLambertMaterial color={shoeColor} /></mesh>
      <mesh position={[ 0.09, 0.065, 0.1]}><boxGeometry args={[0.12, 0.065, 0.24]} /><meshLambertMaterial color={shoeColor} /></mesh>

      {/* Legs */}
      <group ref={leftLegRef} position={[-0.1, 0.1, 0]}>
        <mesh position={[0, 0.26, 0]}><boxGeometry args={[0.13, 0.52, 0.14]} /><meshLambertMaterial color={pantsColor} /></mesh>
      </group>
      <group ref={rightLegRef} position={[0.1, 0.1, 0]}>
        <mesh position={[0, 0.26, 0]}><boxGeometry args={[0.13, 0.52, 0.14]} /><meshLambertMaterial color={pantsColor} /></mesh>
      </group>

      {/* Belt */}
      <mesh position={[0, 0.64, 0]}><boxGeometry args={[0.36, 0.045, 0.21]} /><meshLambertMaterial color="#0f172a" /></mesh>
      <mesh position={[0, 0.645, 0.107]}><boxGeometry args={[0.055, 0.032, 0.01]} /><meshLambertMaterial color="#d4a030" /></mesh>

      {/* Torso */}
      <mesh ref={bodyRef} position={[0, 0.93, 0]}><boxGeometry args={[0.36, 0.52, 0.21]} /><meshLambertMaterial color={accentColor} /></mesh>
      {/* Collar */}
      <mesh position={[0, 1.2, 0.1]}><boxGeometry args={[0.14, 0.1, 0.04]} /><meshLambertMaterial color="#f5f0ea" /></mesh>
      {/* Buttons */}
      {[1.05, 0.93, 0.81].map((y, i) => (
        <mesh key={i} position={[0, y, 0.107]}>
          <boxGeometry args={[0.018, 0.018, 0.01]} /><meshLambertMaterial color="#e8e4de" />
        </mesh>
      ))}

      {/* Shoulders */}
      <mesh position={[-0.22, 1.17, 0]}><sphereGeometry args={[0.065, 6, 5]} /><meshLambertMaterial color={accentColor} /></mesh>
      <mesh position={[ 0.22, 1.17, 0]}><sphereGeometry args={[0.065, 6, 5]} /><meshLambertMaterial color={accentColor} /></mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.22, 1.17, 0]}>
        <mesh position={[0, -0.21, 0]}><boxGeometry args={[0.11, 0.42, 0.12]} /><meshLambertMaterial color={accentColor} /></mesh>
        <mesh position={[0, -0.44, 0]}><boxGeometry args={[0.115, 0.055, 0.125]} /><meshLambertMaterial color="#f0ece6" /></mesh>
        <mesh position={[0, -0.55, 0.01]}><boxGeometry args={[0.095, 0.11, 0.095]} /><meshLambertMaterial color={skinColor} /></mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.22, 1.17, 0]}>
        <mesh position={[0, -0.21, 0]}><boxGeometry args={[0.11, 0.42, 0.12]} /><meshLambertMaterial color={accentColor} /></mesh>
        <mesh position={[0, -0.44, 0]}><boxGeometry args={[0.115, 0.055, 0.125]} /><meshLambertMaterial color="#f0ece6" /></mesh>
        <mesh position={[0, -0.55, 0.01]}><boxGeometry args={[0.095, 0.11, 0.095]} /><meshLambertMaterial color={skinColor} /></mesh>
        {/* Coffee cup (visible when drinking) */}
        <group ref={coffeeRef} position={[0, -0.62, 0.05]} visible={false}>
          <mesh><cylinderGeometry args={[0.04, 0.032, 0.07, 8]} /><meshLambertMaterial color="#ffffffcc" transparent opacity={0.9} /></mesh>
          <mesh position={[0, 0.025, 0]}><cylinderGeometry args={[0.038, 0.038, 0.015, 8]} /><meshLambertMaterial color="#5a2a0a" /></mesh>
        </group>
        {/* Tablet (visible when presenting) */}
        <group ref={tabletRef} position={[0, -0.48, 0.06]} visible={false}>
          <mesh rotation={[0.3, 0, 0]}><boxGeometry args={[0.12, 0.16, 0.01]} /><meshLambertMaterial color="#1a1a2e" /></mesh>
          <mesh position={[0, -0.005, 0.008]} rotation={[0.3, 0, 0]}><boxGeometry args={[0.1, 0.14, 0.001]} /><meshLambertMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.3} /></mesh>
        </group>
      </group>

      {/* Neck */}
      <mesh position={[0, 1.26, 0]}><cylinderGeometry args={[0.063, 0.07, 0.1, 8]} /><meshLambertMaterial color={skinColor} /></mesh>

      {/* Head */}
      <group ref={headRef} position={[0, 1.45, 0]}>
        <mesh><boxGeometry args={[0.27, 0.3, 0.25]} /><meshLambertMaterial color={skinColor} /></mesh>
        {/* Hair top */}
        <mesh position={[0, 0.17, -0.01]}><boxGeometry args={[0.275, 0.1, 0.26]} /><meshLambertMaterial color={hairColor} /></mesh>
        <mesh position={[-0.135, 0.09, 0]}><boxGeometry args={[0.02, 0.22, 0.25]} /><meshLambertMaterial color={hairColor} /></mesh>
        <mesh position={[ 0.135, 0.09, 0]}><boxGeometry args={[0.02, 0.22, 0.25]} /><meshLambertMaterial color={hairColor} /></mesh>
        <mesh position={[0, 0.06, -0.13]}><boxGeometry args={[0.26, 0.2, 0.02]} /><meshLambertMaterial color={hairColor} /></mesh>

        {/* Eyebrows */}
        <mesh position={[-0.075, 0.09, 0.128]}><boxGeometry args={[0.07, 0.018, 0.01]} /><meshLambertMaterial color={hairColor} /></mesh>
        <mesh position={[ 0.075, 0.09, 0.128]}><boxGeometry args={[0.07, 0.018, 0.01]} /><meshLambertMaterial color={hairColor} /></mesh>

        {/* Eye whites */}
        <mesh position={[-0.075, 0.04, 0.127]}><boxGeometry args={[0.065, 0.04, 0.01]} /><meshLambertMaterial color="#f0ede8" /></mesh>
        <mesh position={[ 0.075, 0.04, 0.127]}><boxGeometry args={[0.065, 0.04, 0.01]} /><meshLambertMaterial color="#f0ede8" /></mesh>
        {/* Iris */}
        <mesh position={[-0.075, 0.04, 0.131]}><boxGeometry args={[0.036, 0.036, 0.01]} /><meshLambertMaterial color="#1e3a5a" /></mesh>
        <mesh position={[ 0.075, 0.04, 0.131]}><boxGeometry args={[0.036, 0.036, 0.01]} /><meshLambertMaterial color="#1e3a5a" /></mesh>
        {/* Pupils */}
        <mesh position={[-0.075, 0.04, 0.134]}><boxGeometry args={[0.018, 0.018, 0.005]} /><meshLambertMaterial color="#0a0a0a" /></mesh>
        <mesh position={[ 0.075, 0.04, 0.134]}><boxGeometry args={[0.018, 0.018, 0.005]} /><meshLambertMaterial color="#0a0a0a" /></mesh>
        {/* Shine */}
        <mesh position={[-0.067, 0.048, 0.136]}><boxGeometry args={[0.006, 0.006, 0.002]} /><meshLambertMaterial color="#ffffff" /></mesh>
        <mesh position={[ 0.083, 0.048, 0.136]}><boxGeometry args={[0.006, 0.006, 0.002]} /><meshLambertMaterial color="#ffffff" /></mesh>

        {/* Eye lids */}
        <mesh ref={leftEyeLid}  position={[-0.075, 0.04, 0.136]}><boxGeometry args={[0.067, 0.042, 0.004]} /><meshLambertMaterial color={skinColor} /></mesh>
        <mesh ref={rightEyeLid} position={[ 0.075, 0.04, 0.136]}><boxGeometry args={[0.067, 0.042, 0.004]} /><meshLambertMaterial color={skinColor} /></mesh>

        {/* Nose */}
        <mesh position={[0, -0.02, 0.132]}><boxGeometry args={[0.025, 0.028, 0.022]} /><meshLambertMaterial color={skinColor} /></mesh>
        {/* Mouth */}
        <mesh position={[0, -0.085, 0.129]}><boxGeometry args={[0.065, 0.016, 0.008]} /><meshLambertMaterial color={agent.status === "chatting" ? "#a03020" : "#8a5048"} /></mesh>
        {/* Ears */}
        <mesh position={[-0.137, 0.02, 0]}><boxGeometry args={[0.02, 0.055, 0.05]} /><meshLambertMaterial color={skinColor} /></mesh>
        <mesh position={[ 0.137, 0.02, 0]}><boxGeometry args={[0.02, 0.055, 0.05]} /><meshLambertMaterial color={skinColor} /></mesh>

        {/* Activity bubble */}
        <Html position={[0, 0.46, 0]} center zIndexRange={[100, 0]} className="pointer-events-none select-none">
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-md whitespace-nowrap"
              style={{ background: "rgba(255,255,255,0.92)", border: `1.5px solid ${accentColor}50`, color: accentColor, backdropFilter: "blur(4px)" }}
            >
              <span style={{ fontSize: 11 }}>{activity.emoji}</span>
              <span>{agent.name}</span>
            </div>
          </div>
        </Html>
      </group>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
          <ringGeometry args={[0.3, 0.38, 24]} />
          <meshLambertMaterial color={accentColor} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}
