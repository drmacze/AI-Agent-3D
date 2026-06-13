import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { NpcAgent } from "@/context/FloorContext";
import { useGameStore } from "@/store/gameStore";
import { audioManager } from "@/lib/audioManager";

const SKIN_TONES  = ["#f4c39a","#d4956a","#c07850","#8b5e3c","#a0784a","#e8b89a","#f0d0a8","#c89870"];
const HAIR_COLORS = ["#1a0f06","#3a2010","#0f0f0f","#6b4a08","#3a1a08","#b07030","#f0c060","#1a1a3a"];
const PANTS_COLORS= ["#1e293b","#2d1f3a","#1a3a2a","#302d40","#3a2010","#1e3a4a"];
const SHOE_COLORS = ["#1a1212","#120e0e","#1e1408","#0e0e14","#1a120a"];

function hash(n: number) { return ((Math.sin(n * 127.1) * 43758.5) % 1 + 1) % 1; }

type LiveStatus = NpcAgent["status"] | "phone" | "stretch";

function getActivityLabel(agent: NpcAgent, status: LiveStatus): string {
  if (status === "coffee")     return "Coffee";
  if (status === "presenting") return "Presenting";
  if (status === "chatting")   return "Chatting";
  if (status === "phone")      return "On Call";
  if (status === "stretch")    return "Stretching";
  if (status === "idle")       return "Idle";
  const t = agent.currentTask.toLowerCase();
  if (t.includes("design") || t.includes("ui"))              return "Designing";
  if (t.includes("code") || t.includes("build") || t.includes("develop")) return "Coding";
  if (t.includes("train") || t.includes("model") || t.includes("ml"))     return "Training";
  if (t.includes("data") || t.includes("analyz"))            return "Analyzing";
  if (t.includes("deploy") || t.includes("infra") || t.includes("kube"))  return "Deploying";
  if (t.includes("review") || t.includes("audit"))           return "Reviewing";
  if (t.includes("meet") || t.includes("align") || t.includes("coord"))   return "Meeting";
  if (t.includes("report") || t.includes("strat") || t.includes("budget"))return "Planning";
  if (t.includes("research") || t.includes("paper"))         return "Researching";
  if (t.includes("test") || t.includes("pen"))               return "Testing";
  return "Working";
}

interface Props {
  agent: NpcAgent;
  isSelected?: boolean;
  onClick?: () => void;
}

const WANDER_SPOTS: [number, number][] = [
  [-10.5,-8],[-4,-8],[9.5,-8],[-11,7],[11,-6],
  [7,1],[0,0],[4,-5],[-3,5],[6,-3],
  [-7,1],[2,5],[-8,-2],[8,4],[0,-6],
  [5,5],[-6,6],[10,0],[0,7],
];

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
  const coffeeRef   = useRef<THREE.Group>(null);
  const tabletRef   = useRef<THREE.Group>(null);

  const seed = useMemo(() => {
    let s = 0;
    for (let i = 0; i < agent.id.length; i++) s += agent.id.charCodeAt(i);
    return s;
  }, [agent.id]);

  const skinColor  = useMemo(() => SKIN_TONES [seed % SKIN_TONES.length],  [seed]);
  const hairColor  = useMemo(() => HAIR_COLORS[(seed + 1) % HAIR_COLORS.length],  [seed]);
  const pantsColor = useMemo(() => PANTS_COLORS[seed % PANTS_COLORS.length], [seed]);
  const shoeColor  = useMemo(() => SHOE_COLORS [seed % SHOE_COLORS.length],  [seed]);
  const accentColor = agent.color;

  const walkPhase   = useRef(Math.random() * Math.PI * 2);
  const idlePhase   = useRef(Math.random() * Math.PI * 2);
  const typingPhase = useRef(Math.random() * Math.PI * 2);
  const blinkTimer  = useRef(Math.random() * 4 + 2);
  const blinkOpen   = useRef(true);
  const bumpRef     = useRef(0);
  const bumpWasActive   = useRef(false);
  const npcChatTimer    = useRef(2 + Math.random() * 4);
  const seatProgress    = useRef(0);
  // Home = exact chair position for this NPC
  const homeX = agent.positionX;
  const homeZ = agent.positionZ <= 0 ? -1.8 : 3.2;
  const targetPos   = useRef(new THREE.Vector3(homeX, 0, homeZ));
  const currentPos  = useRef(new THREE.Vector3(homeX, 0, homeZ));

  const bubble = useGameStore(state => state.npcBubbles[agent.id] ?? null);

  const liveStatus  = useRef<LiveStatus>("working");
  const statusTimer = useRef(35 + Math.random() * 20);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + seed * 0.37;

    // Status evolution — 72% time at desk working
    statusTimer.current -= delta;
    if (statusTimer.current <= 0) {
      const roll = Math.random();
      const wasStatus = liveStatus.current;
      if (roll < 0.72) {
        liveStatus.current = "working";
      } else if (roll < 0.79) {
        liveStatus.current = "coffee";
      } else if (roll < 0.86) {
        liveStatus.current = "chatting";
      } else if (roll < 0.91) {
        liveStatus.current = "phone";
      } else if (roll < 0.95) {
        liveStatus.current = "stretch";
      } else if (roll < 0.98) {
        liveStatus.current = "idle";
      } else {
        liveStatus.current = "presenting";
      }
      if (liveStatus.current === "working") {
        statusTimer.current = 35 + Math.random() * 25; // 35-60s at desk
      } else {
        statusTimer.current = 5 + Math.random() * 8;   // 5-13s for breaks
      }
      const newStatus = liveStatus.current;
      if (newStatus === "working") {
        targetPos.current.set(homeX, 0, homeZ);
      } else if (newStatus !== wasStatus) {
        const spot = WANDER_SPOTS[Math.floor(Math.random() * WANDER_SPOTS.length)];
        targetPos.current.set(spot[0], 0, spot[1]);
      }
    }

    // Bump reaction
    const reaction = useGameStore.getState().npcReactions[agent.id];
    if (reaction?.kind === 'bump') {
      bumpRef.current = Math.min(1, bumpRef.current + delta * 8);
      if (!bumpWasActive.current) {
        bumpWasActive.current = true;
        audioManager.playBump();
      }
    } else {
      bumpRef.current = Math.max(0, bumpRef.current - delta * 4);
      if (bumpRef.current < 0.05) bumpWasActive.current = false;
    }

    // NPC chatter
    if (liveStatus.current === "chatting" || liveStatus.current === "presenting") {
      npcChatTimer.current -= delta;
      if (npcChatTimer.current <= 0) {
        audioManager.playNpcChat(agent.id, seed);
        npcChatTimer.current = 2.5 + Math.random() * 4.5;
      }
    }

    currentPos.current.lerp(targetPos.current, Math.min(delta * 1.3, 0.055));
    groupRef.current.position.copy(currentPos.current);

    if (bumpRef.current > 0.01) {
      groupRef.current.position.y += Math.abs(Math.sin(state.clock.elapsedTime * 18)) * bumpRef.current * 0.22;
      if (rightArmRef.current) { rightArmRef.current.rotation.x = -0.9 * bumpRef.current; rightArmRef.current.rotation.z = -0.5 * bumpRef.current; }
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  = -0.9 * bumpRef.current; leftArmRef.current.rotation.z  =  0.5 * bumpRef.current; }
    }

    const moving = currentPos.current.distanceTo(targetPos.current) > 0.15;

    // Sitting progress
    const isSitting = liveStatus.current === "working" && !moving;
    seatProgress.current = THREE.MathUtils.lerp(seatProgress.current, isSitting ? 1 : 0, delta * (isSitting ? 2 : 3));
    const s = seatProgress.current;

    // Y position: raised when sitting, bob when walking, 0 when standing
    if (!moving) {
      groupRef.current.position.y = s * 0.30;
    }

    if (moving) {
      const dir = targetPos.current.clone().sub(currentPos.current);
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

    if (coffeeRef.current) coffeeRef.current.visible = liveStatus.current === "coffee";
    if (tabletRef.current) tabletRef.current.visible = liveStatus.current === "presenting";

    const status = liveStatus.current;

    if (moving) {
      walkPhase.current += delta * 8;
      const swing = Math.sin(walkPhase.current) * 0.4;
      const bob   = Math.abs(Math.sin(walkPhase.current)) * 0.04;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  =  swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  = -swing * 0.55; leftArmRef.current.rotation.z  =  0.08; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x =  swing * 0.55; rightArmRef.current.rotation.z = -0.08; }
      groupRef.current.position.y = bob;

    } else if (status === "working") {
      // Bend/straighten legs based on sitting progress
      const legBend = s * -1.35;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x,  legBend, delta * 5);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, legBend, delta * 5);

      // Face toward desk (-Z) when seated
      if (s > 0.4) {
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, Math.PI, delta * 3);
      }

      typingPhase.current += delta * 9;
      const tapL = Math.sin(typingPhase.current * 1.3) * 0.09;
      const tapR = Math.sin(typingPhase.current * 1.7 + 1.1) * 0.09;
      const reach = -(0.40 + s * 0.12);
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  = THREE.MathUtils.lerp(leftArmRef.current.rotation.x,  reach + tapL, delta * 8); leftArmRef.current.rotation.z  = 0.28; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, reach + tapR, delta * 8); rightArmRef.current.rotation.z = -0.28; }
      if (bodyRef.current)     { bodyRef.current.rotation.x = 0.06 + s * 0.07; bodyRef.current.rotation.z = 0; }
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0.10 + Math.sin(t * 0.6) * 0.04, delta * 4);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, Math.sin(t * 0.25 + seed * 0.3) * 0.06, delta * 3);
      }

    } else if (status === "chatting") {
      const gesture = Math.sin(t * 1.5 + seed * 0.5) * 0.28;
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  =  gesture - 0.1; leftArmRef.current.rotation.z  =  0.24; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = -gesture * 0.7; rightArmRef.current.rotation.z = -0.24; }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.8 + seed * 0.3) * 0.20;
        headRef.current.rotation.x = Math.sin(t * 2.0 + seed) * 0.07;
      }
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (bodyRef.current)     bodyRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;

    } else if (status === "coffee") {
      if (rightArmRef.current) { rightArmRef.current.rotation.x = -0.9 + Math.sin(t * 0.8 + seed) * 0.12; rightArmRef.current.rotation.z = -0.3; }
      if (leftArmRef.current)  { leftArmRef.current.rotation.x = 0; leftArmRef.current.rotation.z = 0.12; }
      if (headRef.current) {
        headRef.current.rotation.x = -0.15 + Math.sin(t * 0.5) * 0.06;
        headRef.current.rotation.y = Math.sin(t * 0.3 + seed) * 0.10;
      }
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (bodyRef.current)     bodyRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;

    } else if (status === "presenting") {
      const wave = Math.sin(t * 1.2 + seed * 0.4) * 0.18;
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  = -0.4 + wave; leftArmRef.current.rotation.z  =  0.35; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = -0.55; rightArmRef.current.rotation.z = -0.18; }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 0.5 + seed * 0.2) * 0.22;
        headRef.current.rotation.x = 0.06;
      }
      if (bodyRef.current)     bodyRef.current.rotation.x = 0;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;

    } else if (status === "phone") {
      if (rightArmRef.current) { rightArmRef.current.rotation.x = -0.80 + Math.sin(t * 0.28 + seed) * 0.04; rightArmRef.current.rotation.z = -0.44; }
      if (leftArmRef.current)  { leftArmRef.current.rotation.x = 0.04; leftArmRef.current.rotation.z = 0.18; }
      if (headRef.current) {
        headRef.current.rotation.z =  0.18 + Math.sin(t * 0.22) * 0.025;
        headRef.current.rotation.x =  0.06;
        headRef.current.rotation.y = -0.12 + Math.sin(t * 0.38 + seed) * 0.06;
      }
      if (bodyRef.current) { bodyRef.current.rotation.x = 0; bodyRef.current.rotation.z = Math.sin(t * 0.18 + seed) * 0.015; }
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;

    } else if (status === "stretch") {
      const s = Math.sin(t * 0.42 + seed * 0.3);
      if (leftArmRef.current)  { leftArmRef.current.rotation.x  = -1.08 + s * 0.13; leftArmRef.current.rotation.z  = -0.28 + s * 0.06; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = -1.08 + s * 0.10; rightArmRef.current.rotation.z  =  0.28 - s * 0.06; }
      if (bodyRef.current) { bodyRef.current.rotation.x = -0.07 + s * 0.03; bodyRef.current.rotation.z = 0; }
      if (headRef.current) {
        headRef.current.rotation.x = -0.12 + Math.sin(t * 0.3) * 0.04;
        headRef.current.rotation.y = Math.sin(t * 0.28 + seed) * 0.16;
      }
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
        headRef.current.rotation.y = Math.sin(t * 0.25 + seed * 0.4) * 0.14;
        headRef.current.rotation.x = Math.sin(t * 0.6 + seed) * 0.04;
      }
      if (leftArmRef.current)  { leftArmRef.current.rotation.x = 0; leftArmRef.current.rotation.z = 0.10 + shift * 0.5; }
      if (rightArmRef.current) { rightArmRef.current.rotation.x = 0; rightArmRef.current.rotation.z = -0.10 - shift * 0.5; }
      if (leftLegRef.current)  leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;
    }
  });

  const activityLabel = getActivityLabel(agent, liveStatus.current);

  return (
    <group ref={groupRef} position={[agent.positionX, 0, agent.positionZ]}
      onClick={e => { e.stopPropagation(); onClick?.(); }}>

      {/* Blob shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]} scale={[1, 0.72, 1]}>
        <circleGeometry args={[0.23, 14]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {/* ── Shoes (PBR) ── */}
      <mesh position={[-0.09, 0.065, 0.10]} castShadow>
        <boxGeometry args={[0.12, 0.065, 0.24]} />
        <meshPhysicalMaterial roughness={0.68} metalness={0.05} color={shoeColor} />
      </mesh>
      <mesh position={[ 0.09, 0.065, 0.10]} castShadow>
        <boxGeometry args={[0.12, 0.065, 0.24]} />
        <meshPhysicalMaterial roughness={0.68} metalness={0.05} color={shoeColor} />
      </mesh>

      {/* ── Legs (PBR) ── */}
      <group ref={leftLegRef} position={[-0.10, 0.10, 0]}>
        <mesh position={[0, 0.26, 0]} castShadow>
          <boxGeometry args={[0.13, 0.52, 0.14]} />
          <meshPhysicalMaterial roughness={0.88} metalness={0.0} color={pantsColor} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.10, 0.10, 0]}>
        <mesh position={[0, 0.26, 0]} castShadow>
          <boxGeometry args={[0.13, 0.52, 0.14]} />
          <meshPhysicalMaterial roughness={0.88} metalness={0.0} color={pantsColor} />
        </mesh>
      </group>

      {/* ── Belt + buckle (PBR) ── */}
      <mesh position={[0, 0.640, 0]} castShadow>
        <boxGeometry args={[0.36, 0.045, 0.215]} />
        <meshPhysicalMaterial roughness={0.55} metalness={0.2} color="#0c1220" />
      </mesh>
      {/* Gold buckle */}
      <mesh position={[0, 0.645, 0.108]}>
        <boxGeometry args={[0.055, 0.032, 0.012]} />
        <meshPhysicalMaterial roughness={0.15} metalness={0.9} color="#d4a030" />
      </mesh>

      {/* ── Torso / Shirt (PBR) ── */}
      <mesh ref={bodyRef} position={[0, 0.930, 0]} castShadow>
        <boxGeometry args={[0.36, 0.52, 0.215]} />
        <meshPhysicalMaterial roughness={0.82} metalness={0.0} color={accentColor} />
      </mesh>

      {/* White collar */}
      <mesh position={[0, 1.205, 0.098]} castShadow>
        <boxGeometry args={[0.14, 0.10, 0.04]} />
        <meshPhysicalMaterial roughness={0.90} metalness={0.0} color="#f5f0ea" />
      </mesh>

      {/* Shirt buttons */}
      {[1.05, 0.93, 0.81].map((y, i) => (
        <mesh key={i} position={[0, y, 0.109]}>
          <boxGeometry args={[0.018, 0.018, 0.010]} />
          <meshPhysicalMaterial roughness={0.4} metalness={0.3} color="#e8e4de" />
        </mesh>
      ))}

      {/* ── Shoulders ── */}
      <mesh position={[-0.225, 1.170, 0]} castShadow>
        <sphereGeometry args={[0.065, 7, 5]} />
        <meshPhysicalMaterial roughness={0.82} metalness={0.0} color={accentColor} />
      </mesh>
      <mesh position={[ 0.225, 1.170, 0]} castShadow>
        <sphereGeometry args={[0.065, 7, 5]} />
        <meshPhysicalMaterial roughness={0.82} metalness={0.0} color={accentColor} />
      </mesh>

      {/* ── Left Arm ── */}
      <group ref={leftArmRef} position={[-0.225, 1.170, 0]}>
        {/* Sleeve */}
        <mesh position={[0, -0.21, 0]} castShadow>
          <boxGeometry args={[0.11, 0.42, 0.12]} />
          <meshPhysicalMaterial roughness={0.82} metalness={0.0} color={accentColor} />
        </mesh>
        {/* Shirt cuff */}
        <mesh position={[0, -0.44, 0]} castShadow>
          <boxGeometry args={[0.115, 0.055, 0.125]} />
          <meshPhysicalMaterial roughness={0.88} metalness={0.0} color="#f0ece6" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.55, 0.010]} castShadow>
          <boxGeometry args={[0.095, 0.11, 0.095]} />
          <meshPhysicalMaterial roughness={0.72} metalness={0.0} color={skinColor} />
        </mesh>
      </group>

      {/* ── Right Arm ── */}
      <group ref={rightArmRef} position={[0.225, 1.170, 0]}>
        <mesh position={[0, -0.21, 0]} castShadow>
          <boxGeometry args={[0.11, 0.42, 0.12]} />
          <meshPhysicalMaterial roughness={0.82} metalness={0.0} color={accentColor} />
        </mesh>
        <mesh position={[0, -0.44, 0]} castShadow>
          <boxGeometry args={[0.115, 0.055, 0.125]} />
          <meshPhysicalMaterial roughness={0.88} metalness={0.0} color="#f0ece6" />
        </mesh>
        <mesh position={[0, -0.55, 0.010]} castShadow>
          <boxGeometry args={[0.095, 0.11, 0.095]} />
          <meshPhysicalMaterial roughness={0.72} metalness={0.0} color={skinColor} />
        </mesh>
        {/* Coffee cup (visible when drinking) */}
        <group ref={coffeeRef} position={[0, -0.62, 0.05]} visible={false}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.032, 0.07, 8]} />
            <meshPhysicalMaterial roughness={0.3} color="#ffffff" transparent opacity={0.90} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.015, 8]} />
            <meshPhysicalMaterial roughness={0.8} color="#5a2a0a" />
          </mesh>
        </group>
        {/* Tablet (visible when presenting) */}
        <group ref={tabletRef} position={[0, -0.48, 0.06]} visible={false}>
          <mesh rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.12, 0.16, 0.010]} />
            <meshPhysicalMaterial roughness={0.15} metalness={0.7} color="#1a1a2e" />
          </mesh>
          <mesh position={[0, -0.005, 0.008]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.10, 0.14, 0.001]} />
            <meshPhysicalMaterial roughness={0.1} color={accentColor} emissive={accentColor} emissiveIntensity={0.35} />
          </mesh>
        </group>
      </group>

      {/* ── Neck ── */}
      <mesh position={[0, 1.262, 0]} castShadow>
        <cylinderGeometry args={[0.063, 0.070, 0.10, 8]} />
        <meshPhysicalMaterial roughness={0.72} metalness={0.0} color={skinColor} />
      </mesh>

      {/* ── Head ── */}
      <group ref={headRef} position={[0, 1.452, 0]}>
        {/* Face */}
        <mesh castShadow>
          <boxGeometry args={[0.270, 0.300, 0.250]} />
          <meshPhysicalMaterial roughness={0.72} metalness={0.0} color={skinColor} />
        </mesh>

        {/* Hair top */}
        <mesh position={[0, 0.168, -0.010]} castShadow>
          <boxGeometry args={[0.275, 0.100, 0.260]} />
          <meshPhysicalMaterial roughness={0.92} metalness={0.0} color={hairColor} />
        </mesh>
        {/* Hair sides */}
        <mesh position={[-0.137, 0.085, 0]}>
          <boxGeometry args={[0.020, 0.220, 0.255]} />
          <meshPhysicalMaterial roughness={0.92} metalness={0.0} color={hairColor} />
        </mesh>
        <mesh position={[ 0.137, 0.085, 0]}>
          <boxGeometry args={[0.020, 0.220, 0.255]} />
          <meshPhysicalMaterial roughness={0.92} metalness={0.0} color={hairColor} />
        </mesh>
        {/* Hair back */}
        <mesh position={[0, 0.060, -0.130]}>
          <boxGeometry args={[0.265, 0.210, 0.020]} />
          <meshPhysicalMaterial roughness={0.92} metalness={0.0} color={hairColor} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.137, 0.020, 0]} castShadow>
          <boxGeometry args={[0.020, 0.055, 0.050]} />
          <meshPhysicalMaterial roughness={0.72} metalness={0.0} color={skinColor} />
        </mesh>
        <mesh position={[ 0.137, 0.020, 0]} castShadow>
          <boxGeometry args={[0.020, 0.055, 0.050]} />
          <meshPhysicalMaterial roughness={0.72} metalness={0.0} color={skinColor} />
        </mesh>

        {/* Eyebrows */}
        <mesh position={[-0.076, 0.092, 0.129]}>
          <boxGeometry args={[0.070, 0.018, 0.010]} />
          <meshPhysicalMaterial roughness={0.90} metalness={0.0} color={hairColor} />
        </mesh>
        <mesh position={[ 0.076, 0.092, 0.129]}>
          <boxGeometry args={[0.070, 0.018, 0.010]} />
          <meshPhysicalMaterial roughness={0.90} metalness={0.0} color={hairColor} />
        </mesh>

        {/* Eye whites */}
        <mesh position={[-0.076, 0.040, 0.127]}>
          <boxGeometry args={[0.065, 0.042, 0.010]} />
          <meshPhysicalMaterial roughness={0.45} metalness={0.0} color="#f0ede8" />
        </mesh>
        <mesh position={[ 0.076, 0.040, 0.127]}>
          <boxGeometry args={[0.065, 0.042, 0.010]} />
          <meshPhysicalMaterial roughness={0.45} metalness={0.0} color="#f0ede8" />
        </mesh>
        {/* Iris */}
        <mesh position={[-0.076, 0.040, 0.131]}>
          <boxGeometry args={[0.037, 0.037, 0.010]} />
          <meshPhysicalMaterial roughness={0.15} metalness={0.0} color="#1e3a5a" />
        </mesh>
        <mesh position={[ 0.076, 0.040, 0.131]}>
          <boxGeometry args={[0.037, 0.037, 0.010]} />
          <meshPhysicalMaterial roughness={0.15} metalness={0.0} color="#1e3a5a" />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.076, 0.040, 0.134]}>
          <boxGeometry args={[0.018, 0.018, 0.005]} />
          <meshPhysicalMaterial roughness={0.05} metalness={0.0} color="#060606" />
        </mesh>
        <mesh position={[ 0.076, 0.040, 0.134]}>
          <boxGeometry args={[0.018, 0.018, 0.005]} />
          <meshPhysicalMaterial roughness={0.05} metalness={0.0} color="#060606" />
        </mesh>
        {/* Eye shine highlights */}
        <mesh position={[-0.068, 0.048, 0.136]}>
          <boxGeometry args={[0.007, 0.007, 0.002]} />
          <meshPhysicalMaterial roughness={0.0} metalness={0.0} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[ 0.084, 0.048, 0.136]}>
          <boxGeometry args={[0.007, 0.007, 0.002]} />
          <meshPhysicalMaterial roughness={0.0} metalness={0.0} color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
        </mesh>

        {/* Eyelids (blinking) */}
        <mesh ref={leftEyeLid}  position={[-0.076, 0.040, 0.137]}>
          <boxGeometry args={[0.067, 0.044, 0.004]} />
          <meshPhysicalMaterial roughness={0.72} metalness={0.0} color={skinColor} />
        </mesh>
        <mesh ref={rightEyeLid} position={[ 0.076, 0.040, 0.137]}>
          <boxGeometry args={[0.067, 0.044, 0.004]} />
          <meshPhysicalMaterial roughness={0.72} metalness={0.0} color={skinColor} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.022, 0.133]}>
          <boxGeometry args={[0.026, 0.030, 0.024]} />
          <meshPhysicalMaterial roughness={0.72} metalness={0.0} color={skinColor} />
        </mesh>

        {/* Mouth */}
        <mesh position={[0, -0.088, 0.130]}>
          <boxGeometry args={[0.067, 0.017, 0.009]} />
          <meshPhysicalMaterial roughness={0.6} metalness={0.0} color={agent.status === "chatting" ? "#a03020" : "#8a5048"} />
        </mesh>

        {/* Chat bubble (AI response) */}
        {bubble && (
          <Html position={[0, 0.72, 0]} center zIndexRange={[200, 0]} className="pointer-events-none select-none">
            <div style={{
              background: 'rgba(10,10,25,0.90)', color: '#f0f0ff',
              border: `1.5px solid ${accentColor}80`, borderRadius: 12,
              padding: '5px 12px', fontSize: 11, fontWeight: 600,
              maxWidth: 180, textAlign: 'center', lineHeight: 1.35,
              backdropFilter: 'blur(8px)',
              boxShadow: `0 4px 18px rgba(0,0,0,0.55), 0 0 8px ${accentColor}30`,
              whiteSpace: 'normal',
            }}>
              {bubble.text}
            </div>
          </Html>
        )}

        {/* Activity label */}
        <Html position={[0, 0.46, 0]} center zIndexRange={[100, 0]} className="pointer-events-none select-none">
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-md whitespace-nowrap"
              style={{ background: "rgba(255,255,255,0.93)", border: `1.5px solid ${accentColor}50`, color: accentColor, backdropFilter: "blur(4px)" }}
            >
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: accentColor, display: "inline-block", flexShrink: 0 }} />
              <span>{agent.name}</span>
              <span style={{ opacity: 0.55, fontSize: 9, fontWeight: 400 }}>{activityLabel}</span>
            </div>
          </div>
        </Html>
      </group>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
          <ringGeometry args={[0.30, 0.38, 24]} />
          <meshPhysicalMaterial roughness={0.0} metalness={0.0} color={accentColor} transparent opacity={0.75} />
        </mesh>
      )}
    </group>
  );
}
