import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameTime } from "@/context/GameTimeContext";

// ── PBR Material Presets ──────────────────────────────────────────────────────
const MAT = {
  woodLight: { roughness: 0.55, metalness: 0.0 },
  woodDark:  { roughness: 0.65, metalness: 0.0 },
  metal:     { roughness: 0.25, metalness: 0.85 },
  metalSoft: { roughness: 0.45, metalness: 0.6 },
  glass:     { roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.18 },
  fabric:    { roughness: 0.92, metalness: 0.0 },
  plastic:   { roughness: 0.55, metalness: 0.05 },
  ceramic:   { roughness: 0.35, metalness: 0.0 },
  plantGreen:{ roughness: 0.88, metalness: 0.0 },
  concrete:  { roughness: 0.82, metalness: 0.02 },
};

// ── Enhanced Wood-grain GLSL Shader ──────────────────────────────────────────
const FLOOR_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FLOOR_FRAG = /* glsl */`
  varying vec2 vUv;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2 uv = vUv * vec2(10.0, 7.0);

    // Plank structure
    float plankWidth = 0.9;
    float plankId = floor(uv.x / plankWidth);
    float plankOffset = hash(vec2(plankId, 0.0)) * 0.55;
    float localX = fract((uv.x / plankWidth) + plankOffset);

    // Multi-octave wood grain
    float grain1 = smoothNoise(vec2(localX * 3.0, uv.y * 0.28));
    float grain2 = smoothNoise(vec2(localX * 7.0, uv.y * 0.55 + 1.7));
    float grain3 = sin((uv.y + sin(localX * 5.0) * 0.35) * 20.0) * 0.5 + 0.5;
    float grain = grain1 * 0.45 + grain2 * 0.30 + grain3 * 0.25;

    // Per-plank color variation
    float plankVariation = hash(vec2(plankId * 7.3, 13.7)) * 0.13;
    vec3 darkWood  = vec3(0.54 + plankVariation, 0.38 + plankVariation * 0.5, 0.22 + plankVariation * 0.3);
    vec3 lightWood = vec3(0.78 + plankVariation, 0.60 + plankVariation * 0.5, 0.38 + plankVariation * 0.3);
    vec3 woodColor = mix(darkWood, lightWood, grain);

    // Plank gaps
    float gapX = smoothstep(0.95, 1.0, localX) + smoothstep(0.95, 1.0, 1.0 - localX);
    float gapY = step(0.96, fract(uv.y * 0.3));
    woodColor -= (gapX + gapY) * vec3(0.07, 0.05, 0.03);

    // Polish sheen
    float polish = smoothstep(0.35, 0.85, grain) * 0.09;
    woodColor += polish;

    gl_FragColor = vec4(woodColor, 1.0);
  }
`;

// ── Kimi-style Bookshelf ──────────────────────────────────────────────────────
function Bookshelf({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[2.6, 2.0, 0.45]} />
        <meshPhysicalMaterial {...MAT.woodDark} color="#8b6340" />
      </mesh>
      {/* Shelves and books */}
      {[0.22, 0.78, 1.34].map((y, row) => (
        <group key={row}>
          <mesh position={[0, y, 0.18]} castShadow>
            <boxGeometry args={[2.55, 0.03, 0.02]} />
            <meshPhysicalMaterial {...MAT.woodDark} color="#7a5530" />
          </mesh>
          {Array.from({ length: 7 }, (_, c) => {
            const hue = (row * 7 + c) * 53;
            const h = 0.26 + Math.sin(hue) * 0.09;
            const w = 0.19 + Math.sin(hue * 3) * 0.05;
            const bookColors = ["#c03535","#3555b8","#35803a","#b87820","#8035b8","#b85018","#185870"];
            return (
              <mesh key={c} position={[-1.0 + c * 0.34, y + h / 2 + 0.02, 0.15]} castShadow>
                <boxGeometry args={[w, h, 0.30]} />
                <meshPhysicalMaterial {...MAT.woodLight} color={bookColors[(row * 7 + c) % bookColors.length]} roughness={0.8} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

// ── Kimi-style Coffee Station ─────────────────────────────────────────────────
function CoffeeStation({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Counter */}
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.4, 0.84, 0.85]} />
        <meshPhysicalMaterial {...MAT.woodLight} color="#c8a870" />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, 0.855, 0]} castShadow>
        <boxGeometry args={[1.5, 0.03, 0.95]} />
        <meshPhysicalMaterial roughness={0.25} metalness={0.6} color="#a0a0a0" />
      </mesh>
      {/* Machine body */}
      <mesh position={[0, 1.16, 0.12]} castShadow>
        <boxGeometry args={[0.52, 0.6, 0.42]} />
        <meshPhysicalMaterial roughness={0.2} metalness={0.15} color="#1c1c1c" />
      </mesh>
      {/* Display */}
      <mesh position={[0, 1.34, 0.335]}>
        <boxGeometry args={[0.26, 0.18, 0.01]} />
        <meshPhysicalMaterial roughness={0.1} color="#0a2040" emissive="#0a80e0" emissiveIntensity={0.65} />
      </mesh>
      {/* Spout */}
      <mesh position={[0, 0.97, 0.34]}>
        <boxGeometry args={[0.05, 0.16, 0.06]} />
        <meshPhysicalMaterial {...MAT.metal} color="#444444" />
      </mesh>
      {/* Cup platform */}
      <mesh position={[0, 0.88, 0.3]}>
        <boxGeometry args={[0.26, 0.02, 0.2]} />
        <meshPhysicalMaterial {...MAT.metal} color="#3a3a3a" />
      </mesh>
      {/* Coffee cup */}
      <mesh position={[0, 0.99, 0.3]} castShadow>
        <cylinderGeometry args={[0.05, 0.04, 0.11, 10]} />
        <meshPhysicalMaterial {...MAT.ceramic} color="#f0ece6" />
      </mesh>
      <mesh position={[0, 1.05, 0.3]}>
        <cylinderGeometry args={[0.05, 0.05, 0.01, 10]} />
        <meshPhysicalMaterial roughness={0.8} color="#5a2a0a" />
      </mesh>
      {/* Mugs on counter */}
      {[-0.45, 0.45].map((x, i) => (
        <group key={i} position={[x, 0.89, 0.2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.038, 0.09, 8]} />
            <meshPhysicalMaterial {...MAT.ceramic} color={i === 0 ? "#e8d5b0" : "#f0e8e0"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Kimi-style Plant ──────────────────────────────────────────────────────────
function Plant({ position, scale = 1.0 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Pot */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.44, 10]} />
        <meshPhysicalMaterial roughness={0.75} metalness={0.0} color="#9a6840" />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.195, 0.195, 0.02, 10]} />
        <meshPhysicalMaterial roughness={1.0} color="#2e1e0e" />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.038, 0.6, 6]} />
        <meshPhysicalMaterial roughness={0.9} color="#4a3020" />
      </mesh>
      {/* Leaves */}
      {[
        [0,    1.18, 0,    0.38, 0.30, 0.38],
        [-0.2, 0.98, 0.12, 0.24, 0.30, 0.24],
        [ 0.22,1.02,-0.10, 0.22, 0.28, 0.22],
        [ 0.12,1.06, 0.20, 0.20, 0.26, 0.20],
        [-0.15,1.00,-0.16, 0.18, 0.24, 0.18],
        [ 0,   0.88, 0.22, 0.17, 0.22, 0.17],
        [ 0.18,0.90,-0.18, 0.16, 0.21, 0.16],
      ].map(([lx, ly, lz, rx, ry, rz], i) => (
        <mesh key={i} position={[lx, ly, lz] as [number,number,number]} scale={[rx, ry, rz]} rotation={[0.3, i * 1.1, 0.2]} castShadow>
          <sphereGeometry args={[1, 8, 6]} />
          <meshPhysicalMaterial {...MAT.plantGreen} color={i === 0 ? '#2a5a1c' : i % 2 === 0 ? '#38681e' : '#1e4812'} />
        </mesh>
      ))}
    </group>
  );
}

// ── Decorative Rug ────────────────────────────────────────────────────────────
function Rug({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.5, 3.2]} />
        <meshPhysicalMaterial roughness={0.97} color="#8b7050" transparent opacity={0.88} />
      </mesh>
      {/* Rug border */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[4.7, 3.4]} />
        <meshPhysicalMaterial roughness={0.97} color="#6a5038" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// ── Wall Picture Frames ───────────────────────────────────────────────────────
function PictureFrame({ position, rotation = [0,0,0] as [number,number,number], color = '#2563eb' }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.85, 0.62, 0.04]} />
        <meshPhysicalMaterial roughness={0.3} metalness={0.45} color="#1e1e1e" />
      </mesh>
      {/* Art canvas */}
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry args={[0.73, 0.50]} />
        <meshPhysicalMaterial roughness={0.85} color={color} emissive={color} emissiveIntensity={0.12} />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[0.73, 0.50]} />
        <meshPhysicalMaterial {...MAT.glass} opacity={0.12} color="#c8e4ff" />
      </mesh>
    </group>
  );
}

// ── Water Cooler ──────────────────────────────────────────────────────────────
function WaterCooler({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.27, 1.1, 12]} />
        <meshPhysicalMaterial roughness={0.2} metalness={0.1} color="#e0e0e0" transparent opacity={0.88} />
      </mesh>
      {/* Water jug top */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 0.22, 12]} />
        <meshPhysicalMaterial roughness={0.05} metalness={0.0} color="#a0c8e8" transparent opacity={0.65} />
      </mesh>
      {/* Dispenser panel */}
      <mesh position={[0, 0.32, 0.17]}>
        <boxGeometry args={[0.18, 0.1, 0.06]} />
        <meshPhysicalMaterial roughness={0.35} color="#2a2a2a" />
      </mesh>
      {/* Taps */}
      {[[-0.05, '#60a0d8'], [0.05, '#d86060']].map(([x, col], i) => (
        <mesh key={i} position={[x as number, 0.3, 0.2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.04, 6]} />
          <meshPhysicalMaterial roughness={0.3} metalness={0.7} color={col as string} />
        </mesh>
      ))}
    </group>
  );
}

// ── Enhanced Whiteboard ───────────────────────────────────────────────────────
function EnhancedWhiteboard({ position, accent }: { position: [number, number, number]; accent?: string }) {
  const col = accent ?? '#3060c0';
  return (
    <group position={position}>
      {/* Board surface */}
      <mesh castShadow>
        <boxGeometry args={[4.5, 2.2, 0.07]} />
        <meshPhysicalMaterial roughness={0.95} color="#f8f5f0" />
      </mesh>
      {/* Silver frame */}
      <mesh position={[0, 0, 0.038]} castShadow>
        <boxGeometry args={[4.65, 2.35, 0.03]} />
        <meshPhysicalMaterial roughness={0.2} metalness={0.7} color="#b0b0b0" />
      </mesh>
      {/* Marker lines */}
      {[
        [-1.4,  0.6, 1.8, 0.04, col],
        [-1.4,  0.3, 1.3, 0.04, col],
        [-1.4,  0.0, 1.6, 0.04, col],
        [-1.4, -0.3, 0.9, 0.04, col],
        [ 0.7,  0.3, 0.8, 0.7,  '#e0e8f0'],
      ].map(([x, y, w, h, c], i) => (
        <mesh key={i} position={[x as number, y as number, 0.055]}>
          <boxGeometry args={[w as number, h as number, 0.005]} />
          <meshPhysicalMaterial roughness={0.8} color={c as string} />
        </mesh>
      ))}
      {/* Marker tray */}
      <mesh position={[0, -1.16, 0.06]} castShadow>
        <boxGeometry args={[4.3, 0.08, 0.15]} />
        <meshPhysicalMaterial roughness={0.4} metalness={0.3} color="#a0a0a0" />
      </mesh>
      {/* Markers */}
      {[["#e03030",-1.5],["#3060c0",-1.2],["#308030",-0.9],["#c07000",-0.6]].map(([color, x], i) => (
        <mesh key={`m${i}`} position={[x as number, -1.12, 0.12]}>
          <cylinderGeometry args={[0.018, 0.018, 0.22, 6]} />
          <meshPhysicalMaterial roughness={0.5} color={color as string} />
        </mesh>
      ))}
    </group>
  );
}

// ── Main OfficeFloor Component ────────────────────────────────────────────────
export function OfficeFloor() {
  const windowMatRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const ceilLightRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const gameTime = useGameTime();

  const floorMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLOOR_VERT,
        fragmentShader: FLOOR_FRAG,
        uniforms: { uTime: { value: 0 } },
      }),
    []
  );

  useFrame((_, delta) => {
    if (floorMaterial.uniforms.uTime) {
      floorMaterial.uniforms.uTime.value += delta;
    }
    const lc = gameTime.lightConfig;
    for (const mat of windowMatRef.current) {
      mat.emissive.set(lc.windowGlow);
      mat.emissiveIntensity = lc.windowGlowIntensity;
    }
    const nightDim = gameTime.hour >= 22 || gameTime.hour < 6 ? 0.5 : 1.0;
    for (const mat of ceilLightRef.current) {
      mat.emissiveIntensity = nightDim;
    }
  });

  const addWindowMat = (mat: THREE.MeshPhysicalMaterial | null) => {
    if (mat && !windowMatRef.current.includes(mat)) windowMatRef.current.push(mat);
  };
  const addCeilMat = (mat: THREE.MeshPhysicalMaterial | null) => {
    if (mat && !ceilLightRef.current.includes(mat)) ceilLightRef.current.push(mat);
  };

  return (
    <group>
      {/* ── Wood-grain Floor ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[28, 20, 1, 1]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.0, 0]}>
        <planeGeometry args={[28, 20]} />
        <meshPhysicalMaterial roughness={0.9} color="#f0eee9" />
      </mesh>

      {/* ── Back wall ── */}
      <mesh position={[0, 2, -9.5]}>
        <planeGeometry args={[28, 4]} />
        <meshPhysicalMaterial roughness={0.85} color="#e8e5e0" />
      </mesh>
      {/* ── Front wall ── */}
      <mesh position={[0, 2, 9.5]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[28, 4]} />
        <meshPhysicalMaterial roughness={0.85} color="#eceae6" />
      </mesh>
      {/* ── Left wall ── */}
      <mesh position={[-13.5, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[20, 4]} />
        <meshPhysicalMaterial roughness={0.85} color="#eae7e2" />
      </mesh>
      {/* ── Right wall (windows) ── */}
      <mesh position={[13.5, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[20, 4]} />
        <meshPhysicalMaterial roughness={0.85} color="#f0ede8" />
      </mesh>

      {/* ── Windows (right wall, 3 panes) ── */}
      {[-4, 0, 4].map((z, i) => (
        <group key={i} position={[13.45, 2.2, z]}>
          {/* Glass pane */}
          <mesh rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[2.7, 2.3]} />
            <meshPhysicalMaterial
              ref={addWindowMat}
              roughness={0.05}
              metalness={0.0}
              color="#c0dff5"
              emissive={gameTime.lightConfig.windowGlow}
              emissiveIntensity={gameTime.lightConfig.windowGlowIntensity}
              transparent
              opacity={0.82}
            />
          </mesh>
          {/* Window frame — top, bottom, sides, center divider */}
          {[
            { pos: [0,  1.2, 0] as [number,number,number], size: [2.8, 0.07, 0.1] as [number,number,number] },
            { pos: [0, -1.2, 0] as [number,number,number], size: [2.8, 0.07, 0.1] as [number,number,number] },
            { pos: [-1.4, 0, 0] as [number,number,number], size: [0.07, 2.4, 0.1] as [number,number,number] },
            { pos: [ 1.4, 0, 0] as [number,number,number], size: [0.07, 2.4, 0.1] as [number,number,number] },
            { pos: [0, 0, 0]    as [number,number,number], size: [0.05, 2.4, 0.07] as [number,number,number] },
          ].map((f, j) => (
            <mesh key={j} position={f.pos} rotation={[0, -Math.PI / 2, 0]}>
              <boxGeometry args={f.size} />
              <meshPhysicalMaterial roughness={0.3} metalness={0.1} color="#f0ece8" />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Ceiling LED light panels ── */}
      {[[-5.5, 3.96, -3.5], [0, 3.96, -3.5], [5.5, 3.96, -3.5],
        [-5.5, 3.96,  3.5], [0, 3.96,  3.5], [5.5, 3.96,  3.5]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z] as [number,number,number]}>
          {/* Light housing */}
          <mesh>
            <boxGeometry args={[0.22, 0.035, 3.0]} />
            <meshPhysicalMaterial roughness={0.35} metalness={0.55} color="#c8c6c2" />
          </mesh>
          {/* Emissive panel */}
          <mesh position={[0, -0.015, 0]}>
            <boxGeometry args={[0.14, 0.01, 2.8]} />
            <meshPhysicalMaterial
              ref={addCeilMat}
              roughness={0.9}
              color="#fffff4"
              emissive="#fffef0"
              emissiveIntensity={gameTime.hour >= 22 || gameTime.hour < 6 ? 0.5 : 1.0}
            />
          </mesh>
        </group>
      ))}

      {/* ── Baseboards ── */}
      {[
        { pos: [0, 0.05, -9.45] as [number,number,number],  size: [28, 0.10, 0.07] as [number,number,number], rot: 0 },
        { pos: [-13.45, 0.05, 0] as [number,number,number], size: [20, 0.10, 0.07] as [number,number,number], rot: Math.PI / 2 },
      ].map((b, i) => (
        <mesh key={i} position={b.pos} rotation={[0, b.rot, 0]}>
          <boxGeometry args={b.size} />
          <meshPhysicalMaterial roughness={0.6} metalness={0.1} color="#d0cbc4" />
        </mesh>
      ))}

      {/* ── Meeting table (right-centre) ── */}
      <group position={[7, 0, 1]}>
        <mesh position={[0, 0.74, 0]} castShadow>
          <boxGeometry args={[3.0, 0.08, 1.5]} />
          <meshPhysicalMaterial {...MAT.woodLight} color="#c8a870" />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <boxGeometry args={[3.1, 0.04, 1.6]} />
          <meshPhysicalMaterial roughness={0.35} metalness={0.1} color="#a88050" />
        </mesh>
        {/* Legs */}
        {[[-1.35,-0.6],[ 1.35,-0.6],[-1.35,0.6],[ 1.35,0.6]].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.37, lz] as [number,number,number]} castShadow>
            <boxGeometry args={[0.065, 0.74, 0.065]} />
            <meshPhysicalMaterial {...MAT.metal} color="#7a7a7a" />
          </mesh>
        ))}
        {/* Meeting chairs */}
        {[
          { pos: [-0.7, 0, -1.0] as [number,number,number], rot: 0 },
          { pos: [ 0.7, 0, -1.0] as [number,number,number], rot: 0 },
          { pos: [-0.7, 0,  1.0] as [number,number,number], rot: Math.PI },
          { pos: [ 0.7, 0,  1.0] as [number,number,number], rot: Math.PI },
        ].map((c, i) => (
          <group key={i} position={c.pos} rotation={[0, c.rot, 0]}>
            <mesh position={[0, 0.44, 0]} castShadow>
              <boxGeometry args={[0.44, 0.05, 0.44]} />
              <meshPhysicalMaterial {...MAT.fabric} color="#3a5070" />
            </mesh>
            <mesh position={[0, 0.74, -0.22]} castShadow>
              <boxGeometry args={[0.44, 0.58, 0.07]} />
              <meshPhysicalMaterial {...MAT.fabric} color="#3a5070" />
            </mesh>
            <mesh position={[0, 0.22, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.44, 6]} />
              <meshPhysicalMaterial {...MAT.metal} color="#6a6a6a" />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── Coffee station (back-left) ── */}
      <CoffeeStation position={[-10.5, 0, -7.2]} />

      {/* ── Bookshelf (back-right) ── */}
      <Bookshelf position={[9.5, 0, -8.0]} />

      {/* ── Enhanced Whiteboard (back wall) ── */}
      <EnhancedWhiteboard position={[-4, 2.2, -9.45]} />

      {/* ── Corner plants ── */}
      <Plant position={[-11.5, 0, -7.5]} scale={1.1} />
      <Plant position={[ 11.5, 0, -7.5]} scale={0.9} />
      <Plant position={[-11.5, 0,  7.5]} scale={1.0} />
      <Plant position={[ 10.5, 0,  7.0]} scale={0.85} />

      {/* ── Decorative rug (lounge area) ── */}
      <Rug position={[0, 0.005, -1]} />

      {/* ── Wall art / Picture frames ── */}
      <PictureFrame position={[-7.5, 2.3, -9.44]} color="#2563eb" />
      <PictureFrame position={[ 2.0, 2.3, -9.44]} color="#059669" />
      <PictureFrame position={[ 9.5, 2.3, -9.44]} color="#d97706" />

      {/* ── Water cooler (left wall) ── */}
      <WaterCooler position={[-10.5, 0, 6.5]} />

      {/* ── ElevatorExterior ── */}
      <group position={[-12.2, 0, 0]}>
        {/* Frame */}
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[0.14, 4.1, 3.2]} />
          <meshPhysicalMaterial roughness={0.15} metalness={0.95} color="#c0c0c0" />
        </mesh>
        {/* Door frame */}
        <mesh position={[0.07, 2, 0]} castShadow>
          <boxGeometry args={[0.07, 3.8, 2.8]} />
          <meshPhysicalMaterial roughness={0.2} metalness={0.9} color="#2a2a2a" />
        </mesh>
        {/* Left door */}
        <mesh position={[0.07, 1.8, -0.65]} castShadow>
          <boxGeometry args={[0.035, 3.4, 1.3]} />
          <meshPhysicalMaterial roughness={0.1} metalness={0.95} color="#e0e0e0" />
        </mesh>
        {/* Right door */}
        <mesh position={[0.07, 1.8, 0.65]} castShadow>
          <boxGeometry args={[0.035, 3.4, 1.3]} />
          <meshPhysicalMaterial roughness={0.1} metalness={0.95} color="#e0e0e0" />
        </mesh>
        {/* Center gap */}
        <mesh position={[0.09, 1.8, 0]}>
          <boxGeometry args={[0.015, 3.4, 0.018]} />
          <meshPhysicalMaterial roughness={0.1} metalness={0.95} color="#909090" />
        </mesh>
        {/* Floor indicator */}
        <mesh position={[0.09, 3.3, 0]}>
          <boxGeometry args={[0.015, 0.24, 0.34]} />
          <meshPhysicalMaterial roughness={0.1} color="#060606" emissive="#2563eb" emissiveIntensity={0.65} />
        </mesh>
        {/* Call button panel */}
        <mesh position={[0.09, 1.4, 1.05]}>
          <boxGeometry args={[0.015, 0.22, 0.14]} />
          <meshPhysicalMaterial roughness={0.3} metalness={0.5} color="#2a2a2a" />
        </mesh>
        {/* Up button */}
        <mesh position={[0.1, 1.46, 1.05]}>
          <cylinderGeometry args={[0.022, 0.022, 0.01, 8]} />
          <meshPhysicalMaterial roughness={0.2} color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.45} />
        </mesh>
        {/* Down button */}
        <mesh position={[0.1, 1.34, 1.05]}>
          <cylinderGeometry args={[0.022, 0.022, 0.01, 8]} />
          <meshPhysicalMaterial roughness={0.2} color="#4a4a4a" />
        </mesh>
      </group>
    </group>
  );
}
