import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { Agent } from "@workspace/api-client-react";

// ─── Per-agent appearance ────────────────────────────────────────────────────
const SKIN_TONES   = ["#f4c39a","#d4956a","#c07850","#8b5e3c","#a0784a","#e8b89a"];
const SHIRT_COLORS = ["#1e4d8c","#2d6e3a","#7c2a5e","#4a3a90","#b04010","#1a6070"];
const PANTS_COLORS = ["#2d3a4a","#3a2d2d","#2a3a30","#302d40","#4a3020","#2d3a3a"];
const HAIR_COLORS  = ["#1a0f06","#3a2010","#0f0f0f","#6b4a08","#3a1a08","#1a1510"];
const TIE_COLORS   = ["#c03030","#3060c0","#308030","#c06000","#8030c0","#106060"];
const SHOE_COLORS  = ["#2a1e14","#1a1a1a","#3a2010","#181818","#241810","#1e2228"];

function skin(id: number)   { return SKIN_TONES[id   % SKIN_TONES.length]; }
function shirt(id: number)  { return SHIRT_COLORS[id % SHIRT_COLORS.length]; }
function pants(id: number)  { return PANTS_COLORS[id % PANTS_COLORS.length]; }
function hair(id: number)   { return HAIR_COLORS[id  % HAIR_COLORS.length]; }
function tie(id: number)    { return TIE_COLORS[id   % TIE_COLORS.length]; }
function shoes(id: number)  { return SHOE_COLORS[id  % SHOE_COLORS.length]; }

// ─── Activity bubble ─────────────────────────────────────────────────────────
function getActivityInfo(agent: Agent): { emoji: string; label: string; color: string } {
  const t = (agent.currentTask ?? "").toLowerCase();
  if (t.includes("coffee") || t.includes("break")) return { emoji: "☕", label: "Coffee Break", color: "#92400e" };
  if (t.includes("explor") || t.includes("wander")) return { emoji: "🚶", label: "Exploring", color: "#92400e" };
  if (t.includes("meeting") || t.includes("coordination")) return { emoji: "📋", label: "Meeting", color: "#1d4ed8" };
  if (t.includes("review") || t.includes("audit"))  return { emoji: "🔍", label: "Reviewing", color: "#7c3aed" };
  if (t.includes("deploy") || t.includes("ship"))   return { emoji: "🚀", label: "Deploying", color: "#065f46" };
  if (t.includes("research") || t.includes("analys")) return { emoji: "🧠", label: "Researching", color: "#1e3a8a" };
  switch (agent.status) {
    case "working":  return { emoji: "⌨️", label: agent.currentTask?.slice(0, 22) ?? "Working", color: "#1d4ed8" };
    case "chatting": return { emoji: "💬", label: "Chatting", color: "#7c3aed" };
    case "moving":   return { emoji: "🚶", label: "Moving", color: "#92400e" };
    default:         return { emoji: "💤", label: "Idle", color: "#6b7280" };
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

export function AgentAvatar({ agent, isSelected, onClick }: Props) {
  const groupRef    = useRef<THREE.Group>(null);
  const bodyRef     = useRef<THREE.Mesh>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef  = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headGroup   = useRef<THREE.Group>(null);
  const leftEyeLidRef  = useRef<THREE.Mesh>(null);
  const rightEyeLidRef = useRef<THREE.Mesh>(null);
  const selRingRef  = useRef<THREE.Mesh>(null);

  const skinColor  = useMemo(() => skin(agent.id),  [agent.id]);
  const shirtColor = useMemo(() => shirt(agent.id), [agent.id]);
  const pantsColor = useMemo(() => pants(agent.id), [agent.id]);
  const hairColor  = useMemo(() => hair(agent.id),  [agent.id]);
  const tieColor   = useMemo(() => tie(agent.id),   [agent.id]);
  const shoeColor  = useMemo(() => shoes(agent.id), [agent.id]);

  const targetPos  = useMemo(() => new THREE.Vector3(agent.positionX, 0, agent.positionZ), [agent.positionX, agent.positionZ]);
  const currentPos = useRef(new THREE.Vector3(agent.positionX, 0, agent.positionZ));
  const walkPhase  = useRef(Math.random() * Math.PI * 2);
  const typingPhase = useRef(Math.random() * Math.PI * 2);
  const blinkTimer  = useRef(Math.random() * 4);
  const blinkOpen   = useRef(true);
  const idlePhase   = useRef(Math.random() * Math.PI * 2);
  const stretchPhase = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    // ── Smooth position lerp ──
    currentPos.current.lerp(targetPos, Math.min(delta * 2.8, 1));
    groupRef.current.position.copy(currentPos.current);
    const dist = currentPos.current.distanceTo(targetPos);
    const isMoving = dist > 0.08;

    // ── Face toward target while moving ──
    if (isMoving) {
      const dir = targetPos.clone().sub(currentPos.current);
      if (dir.lengthSq() > 0.001) {
        const angle = Math.atan2(dir.x, dir.z);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, delta * 7);
      }
    }

    // ── Selection ring spin ──
    if (selRingRef.current && isSelected) {
      selRingRef.current.rotation.z += delta * 1.2;
    }

    // ── Blink ──
    blinkTimer.current -= delta;
    if (blinkTimer.current <= 0) {
      blinkOpen.current = !blinkOpen.current;
      blinkTimer.current = blinkOpen.current ? (3 + Math.random() * 3) : 0.12;
    }
    const blinkScale = blinkOpen.current ? 1 : 0.05;
    if (leftEyeLidRef.current)  leftEyeLidRef.current.scale.y  = THREE.MathUtils.lerp(leftEyeLidRef.current.scale.y,  blinkScale, delta * 20);
    if (rightEyeLidRef.current) rightEyeLidRef.current.scale.y = THREE.MathUtils.lerp(rightEyeLidRef.current.scale.y, blinkScale, delta * 20);

    // ── Status-based animation ──
    const status = agent.status;
    const taskLower = (agent.currentTask ?? "").toLowerCase();
    const isStretching = taskLower.includes("explor") || taskLower.includes("wander");

    if (status === "moving" || isMoving) {
      // Walking cycle
      walkPhase.current += delta * 8.5;
      const swing = Math.sin(walkPhase.current) * 0.38;
      const bodyBob = Math.abs(Math.sin(walkPhase.current)) * 0.045;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = -swing * 0.55;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.55;
      if (bodyRef.current) bodyRef.current.rotation.z = Math.sin(walkPhase.current) * 0.025;
      groupRef.current.position.y = bodyBob;
      if (headGroup.current) headGroup.current.rotation.y = Math.sin(walkPhase.current * 0.5) * 0.06;

    } else if (status === "working") {
      if (isStretching) {
        // Stretch break animation
        stretchPhase.current += delta * 1.5;
        const up = Math.min(Math.sin(stretchPhase.current) * 0.8 + 0.8, 1.6) * 0.7;
        if (leftArmRef.current)  leftArmRef.current.rotation.x  = -up;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -up;
        if (leftArmRef.current)  leftArmRef.current.rotation.z  = -0.3 * up;
        if (rightArmRef.current) rightArmRef.current.rotation.z = 0.3 * up;
        if (bodyRef.current) bodyRef.current.rotation.x = -0.06 * up;
      } else {
        // Typing
        typingPhase.current += delta * 10;
        const tapL = Math.sin(typingPhase.current * 1.3) * 0.09;
        const tapR = Math.sin(typingPhase.current * 1.7 + 1.1) * 0.09;
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = -0.52 + tapL;
          leftArmRef.current.rotation.z = 0.28;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.x = -0.52 + tapR;
          rightArmRef.current.rotation.z = -0.28;
        }
        if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (bodyRef.current) bodyRef.current.rotation.x = 0.12;
        if (headGroup.current) headGroup.current.rotation.x = Math.sin(t * 0.45) * 0.04 + 0.08;
        groupRef.current.position.y = 0;
      }

    } else if (status === "chatting") {
      // Gesturing while talking
      const gesture = Math.sin(t * 1.6) * 0.28;
      const nod     = Math.sin(t * 2.1) * 0.07;
      const lean    = Math.sin(t * 0.7) * 0.04;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = gesture - 0.12;
        leftArmRef.current.rotation.z = 0.22 + Math.sin(t * 0.9) * 0.1;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -gesture * 0.8 - 0.1;
        rightArmRef.current.rotation.z = -0.22 - Math.sin(t * 1.1) * 0.08;
      }
      if (headGroup.current) {
        headGroup.current.rotation.y = Math.sin(t * 0.85) * 0.18;
        headGroup.current.rotation.x = nod;
      }
      if (bodyRef.current) bodyRef.current.rotation.z = lean;
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;

    } else {
      // Idle — gentle breathing + weight shift
      idlePhase.current += delta * 0.8;
      const breathe   = Math.sin(t * 1.1) * 0.012;
      const weightShift = Math.sin(idlePhase.current * 0.4) * 0.025;
      const lookAround  = Math.sin(t * 0.28) * 0.08;
      if (bodyRef.current) {
        bodyRef.current.scale.y = 1 + breathe;
        bodyRef.current.rotation.z = weightShift;
      }
      if (headGroup.current) headGroup.current.rotation.y = lookAround;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0;
        leftArmRef.current.rotation.z = 0.1 + weightShift * 0.5;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.z = -0.1 - weightShift * 0.5;
      }
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      groupRef.current.position.y = 0;
    }
  });

  const activity = getActivityInfo(agent);

  return (
    <group
      ref={groupRef}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* ── Blob shadow ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]} scale={[1, 0.72, 1]}>
        <circleGeometry args={[0.24, 14]} />
        <meshLambertMaterial color="#a09888" transparent opacity={0.28} depthWrite={false} />
      </mesh>

      {/* ── SHOES ── */}
      <mesh position={[-0.09, 0.065, 0.1]}>
        <boxGeometry args={[0.12, 0.065, 0.24]} />
        <meshLambertMaterial color={shoeColor} />
      </mesh>
      <mesh position={[0.09, 0.065, 0.1]}>
        <boxGeometry args={[0.12, 0.065, 0.24]} />
        <meshLambertMaterial color={shoeColor} />
      </mesh>

      {/* ── LEGS ── */}
      <group ref={leftLegRef} position={[-0.1, 0.1, 0]}>
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[0.13, 0.52, 0.14]} />
          <meshLambertMaterial color={pantsColor} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.1, 0.1, 0]}>
        <mesh position={[0, 0.26, 0]}>
          <boxGeometry args={[0.13, 0.52, 0.14]} />
          <meshLambertMaterial color={pantsColor} />
        </mesh>
      </group>

      {/* ── BELT ── */}
      <mesh position={[0, 0.64, 0]}>
        <boxGeometry args={[0.36, 0.045, 0.21]} />
        <meshLambertMaterial color="#1a1208" />
      </mesh>
      {/* Belt buckle */}
      <mesh position={[0, 0.645, 0.107]}>
        <boxGeometry args={[0.06, 0.035, 0.01]} />
        <meshLambertMaterial color="#c8a840" />
      </mesh>

      {/* ── TORSO ── */}
      <mesh ref={bodyRef} position={[0, 0.93, 0]}>
        <boxGeometry args={[0.36, 0.52, 0.21]} />
        <meshLambertMaterial color={shirtColor} />
      </mesh>

      {/* Shirt collar */}
      <mesh position={[0, 1.2, 0.1]}>
        <boxGeometry args={[0.14, 0.1, 0.04]} />
        <meshLambertMaterial color="#f5f0ea" />
      </mesh>
      {/* Tie */}
      <mesh position={[0, 1.08, 0.107]}>
        <boxGeometry args={[0.04, 0.28, 0.01]} />
        <meshLambertMaterial color={tieColor} />
      </mesh>
      {/* Tie knot */}
      <mesh position={[0, 1.2, 0.108]}>
        <boxGeometry args={[0.05, 0.045, 0.015]} />
        <meshLambertMaterial color={tieColor} />
      </mesh>

      {/* Shirt buttons */}
      {[1.05, 0.93, 0.81].map((y, i) => (
        <mesh key={i} position={[0, y, 0.107]}>
          <boxGeometry args={[0.018, 0.018, 0.01]} />
          <meshLambertMaterial color="#e8e4de" />
        </mesh>
      ))}

      {/* ── SHOULDER CAPS ── */}
      <mesh position={[-0.22, 1.17, 0]}>
        <sphereGeometry args={[0.065, 6, 5]} />
        <meshLambertMaterial color={shirtColor} />
      </mesh>
      <mesh position={[0.22, 1.17, 0]}>
        <sphereGeometry args={[0.065, 6, 5]} />
        <meshLambertMaterial color={shirtColor} />
      </mesh>

      {/* ── LEFT ARM (pivot at shoulder) ── */}
      <group ref={leftArmRef} position={[-0.22, 1.17, 0]}>
        <mesh position={[0, -0.21, 0]}>
          <boxGeometry args={[0.11, 0.42, 0.12]} />
          <meshLambertMaterial color={shirtColor} />
        </mesh>
        {/* Shirt cuff */}
        <mesh position={[0, -0.44, 0]}>
          <boxGeometry args={[0.115, 0.055, 0.125]} />
          <meshLambertMaterial color="#f0ece6" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.55, 0.01]}>
          <boxGeometry args={[0.095, 0.11, 0.095]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>
      </group>

      {/* ── RIGHT ARM (pivot at shoulder) ── */}
      <group ref={rightArmRef} position={[0.22, 1.17, 0]}>
        <mesh position={[0, -0.21, 0]}>
          <boxGeometry args={[0.11, 0.42, 0.12]} />
          <meshLambertMaterial color={shirtColor} />
        </mesh>
        {/* Shirt cuff */}
        <mesh position={[0, -0.44, 0]}>
          <boxGeometry args={[0.115, 0.055, 0.125]} />
          <meshLambertMaterial color="#f0ece6" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.55, 0.01]}>
          <boxGeometry args={[0.095, 0.11, 0.095]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.26, 0]}>
        <cylinderGeometry args={[0.063, 0.07, 0.1, 8]} />
        <meshLambertMaterial color={skinColor} />
      </mesh>

      {/* ── HEAD GROUP (pivot for nodding/turning) ── */}
      <group ref={headGroup} position={[0, 1.45, 0]}>
        {/* Head */}
        <mesh>
          <boxGeometry args={[0.27, 0.3, 0.25]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>

        {/* ── HAIR ── */}
        <mesh position={[0, 0.17, -0.01]}>
          <boxGeometry args={[0.275, 0.1, 0.26]} />
          <meshLambertMaterial color={hairColor} />
        </mesh>
        <mesh position={[-0.135, 0.09, 0]}>
          <boxGeometry args={[0.02, 0.22, 0.25]} />
          <meshLambertMaterial color={hairColor} />
        </mesh>
        <mesh position={[0.135, 0.09, 0]}>
          <boxGeometry args={[0.02, 0.22, 0.25]} />
          <meshLambertMaterial color={hairColor} />
        </mesh>
        {/* Back hair */}
        <mesh position={[0, 0.06, -0.13]}>
          <boxGeometry args={[0.26, 0.2, 0.02]} />
          <meshLambertMaterial color={hairColor} />
        </mesh>

        {/* ── FACE ── */}
        {/* Eyebrows */}
        <mesh position={[-0.075, 0.09, 0.128]}>
          <boxGeometry args={[0.07, 0.018, 0.01]} />
          <meshLambertMaterial color={hairColor} />
        </mesh>
        <mesh position={[0.075, 0.09, 0.128]}>
          <boxGeometry args={[0.07, 0.018, 0.01]} />
          <meshLambertMaterial color={hairColor} />
        </mesh>

        {/* Eye whites */}
        <mesh position={[-0.075, 0.04, 0.127]}>
          <boxGeometry args={[0.065, 0.04, 0.01]} />
          <meshLambertMaterial color="#f0ede8" />
        </mesh>
        <mesh position={[0.075, 0.04, 0.127]}>
          <boxGeometry args={[0.065, 0.04, 0.01]} />
          <meshLambertMaterial color="#f0ede8" />
        </mesh>

        {/* Iris */}
        <mesh position={[-0.075, 0.04, 0.131]}>
          <boxGeometry args={[0.036, 0.036, 0.01]} />
          <meshLambertMaterial color="#1e3a5a" />
        </mesh>
        <mesh position={[0.075, 0.04, 0.131]}>
          <boxGeometry args={[0.036, 0.036, 0.01]} />
          <meshLambertMaterial color="#1e3a5a" />
        </mesh>

        {/* Pupils */}
        <mesh position={[-0.075, 0.04, 0.134]}>
          <boxGeometry args={[0.018, 0.018, 0.005]} />
          <meshLambertMaterial color="#0a0a0a" />
        </mesh>
        <mesh position={[0.075, 0.04, 0.134]}>
          <boxGeometry args={[0.018, 0.018, 0.005]} />
          <meshLambertMaterial color="#0a0a0a" />
        </mesh>

        {/* Eye lids (animated blink — scale y to 0 when blinking) */}
        <mesh ref={leftEyeLidRef}  position={[-0.075, 0.04, 0.136]}>
          <boxGeometry args={[0.067, 0.042, 0.004]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>
        <mesh ref={rightEyeLidRef} position={[0.075, 0.04, 0.136]}>
          <boxGeometry args={[0.067, 0.042, 0.004]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.02, 0.132]}>
          <boxGeometry args={[0.025, 0.028, 0.022]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>

        {/* Mouth */}
        <mesh position={[0, -0.085, 0.129]}>
          <boxGeometry args={[0.065, 0.016, 0.008]} />
          <meshLambertMaterial color={agent.status === "chatting" ? "#a03020" : "#8a5048"} />
        </mesh>

        {/* Ear left */}
        <mesh position={[-0.137, 0.02, 0]}>
          <boxGeometry args={[0.02, 0.055, 0.05]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>
        {/* Ear right */}
        <mesh position={[0.137, 0.02, 0]}>
          <boxGeometry args={[0.02, 0.055, 0.05]} />
          <meshLambertMaterial color={skinColor} />
        </mesh>

        {/* Activity bubble — floats above head */}
        <Html position={[0, 0.46, 0]} center zIndexRange={[100, 0]} className="pointer-events-none select-none">
          <div className="flex flex-col items-center gap-0.5" style={{ transform: "translateZ(0)" }}>
            {/* Activity emoji chip */}
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-md whitespace-nowrap"
              style={{
                background: "rgba(255,255,255,0.92)",
                border: `1.5px solid ${activity.color}30`,
                color: activity.color,
                backdropFilter: "blur(4px)",
              }}
            >
              <span style={{ fontSize: 11 }}>{activity.emoji}</span>
              <span>{agent.name}</span>
            </div>
          </div>
        </Html>
      </group>

      {/* ── Selection ring ── */}
      {isSelected && (
        <mesh ref={selRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
          <ringGeometry args={[0.3, 0.38, 24]} />
          <meshLambertMaterial color="#2563eb" transparent opacity={0.75} />
        </mesh>
      )}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0]}>
          <ringGeometry args={[0.42, 0.46, 24]} />
          <meshLambertMaterial color="#3b82f6" transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  );
}
