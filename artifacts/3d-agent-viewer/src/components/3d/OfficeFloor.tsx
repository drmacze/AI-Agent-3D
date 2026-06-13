import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameTime } from "@/context/GameTimeContext";

// ── Wood-grain shader ────────────────────────────────────────────────────────
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

  void main() {
    vec2 uv = vUv * vec2(9.0, 6.0);

    // Plank lines
    float plankX = floor(uv.x);
    float plankY = floor(uv.y * 0.5) * 2.0;
    float offsetX = hash(vec2(plankY, 0.0)) * 0.6;
    float localU = fract(uv.x + offsetX);

    // Wood grain within plank
    float grain1 = sin((uv.y + sin(localU * 4.0) * 0.4) * 18.0) * 0.5 + 0.5;
    float grain2 = sin((uv.y + sin(localU * 6.5 + 1.2) * 0.3) * 26.0) * 0.5 + 0.5;
    float grain  = grain1 * 0.65 + grain2 * 0.35;

    // Plank colour variation
    float plankHue = hash(vec2(plankX, plankY)) * 0.12;
    vec3 base  = vec3(0.76 + plankHue, 0.60 + plankHue * 0.5, 0.40 + plankHue * 0.3);
    vec3 dark  = vec3(0.64 + plankHue, 0.50 + plankHue * 0.4, 0.32 + plankHue * 0.2);
    vec3 color = mix(dark, base, grain * 0.4 + 0.6);

    // Plank gap lines
    float gapU = step(0.97, fract(uv.x + offsetX));
    float gapV = step(0.96, fract(uv.y * 0.5));
    color -= (gapU + gapV) * 0.06;

    // Subtle polish highlight
    float polish = smoothstep(0.3, 0.8, grain) * 0.07;
    color += polish;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function OfficeFloor() {
  const windowMatRef = useRef<THREE.MeshLambertMaterial[]>([]);
  const ceilLightRef = useRef<THREE.MeshLambertMaterial[]>([]);
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
    // Animate window brightness with game time
    const lc = gameTime.lightConfig;
    for (const mat of windowMatRef.current) {
      mat.emissive.set(lc.windowGlow);
      mat.emissiveIntensity = lc.windowGlowIntensity;
    }
    // Ceiling light intensity
    const nightDim = gameTime.hour >= 22 || gameTime.hour < 6 ? 0.4 : 0.95;
    for (const mat of ceilLightRef.current) {
      mat.emissiveIntensity = nightDim;
    }
  });

  const addWindowMat = (mat: THREE.MeshLambertMaterial | null) => {
    if (mat && !windowMatRef.current.includes(mat)) windowMatRef.current.push(mat);
  };
  const addCeilMat = (mat: THREE.MeshLambertMaterial | null) => {
    if (mat && !ceilLightRef.current.includes(mat)) ceilLightRef.current.push(mat);
  };

  return (
    <group>
      {/* ── Floor (wood grain shader) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[26, 18, 1, 1]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4, 0]}>
        <planeGeometry args={[26, 18]} />
        <meshLambertMaterial color="#f2f0ec" />
      </mesh>

      {/* ── Walls ── */}
      {/* Back */}
      <mesh position={[0, 2, -9]}>
        <planeGeometry args={[26, 4]} />
        <meshLambertMaterial color="#eceae5" />
      </mesh>
      {/* Front (open) */}
      <mesh position={[0, 2, 9]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[26, 4]} />
        <meshLambertMaterial color="#f0eee9" />
      </mesh>
      {/* Left */}
      <mesh position={[-13, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[18, 4]} />
        <meshLambertMaterial color="#eeeae4" />
      </mesh>
      {/* Right (window wall) */}
      <mesh position={[13, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[18, 4]} />
        <meshLambertMaterial color="#f5f2ee" />
      </mesh>

      {/* ── Windows (right wall, 3 panes) ── */}
      {[-4, 0, 4].map((z, i) => (
        <group key={i} position={[12.95, 2.2, z]}>
          {/* Glass pane */}
          <mesh rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[2.6, 2.2]} />
            <meshLambertMaterial
              ref={addWindowMat}
              color="#c8e4f5"
              emissive={gameTime.lightConfig.windowGlow}
              emissiveIntensity={gameTime.lightConfig.windowGlowIntensity}
              transparent
              opacity={0.88}
            />
          </mesh>
          {/* Frame — top, bottom, left, right */}
          {[
            { pos: [0,  1.15, 0] as [number,number,number], size: [2.7, 0.07, 0.09] as [number,number,number] },
            { pos: [0, -1.15, 0] as [number,number,number], size: [2.7, 0.07, 0.09] as [number,number,number] },
            { pos: [-1.35, 0, 0] as [number,number,number], size: [0.07, 2.3, 0.09] as [number,number,number] },
            { pos: [1.35,  0, 0] as [number,number,number], size: [0.07, 2.3, 0.09] as [number,number,number] },
            { pos: [0, 0, 0]     as [number,number,number], size: [0.05, 2.3, 0.07] as [number,number,number] },
          ].map((f, j) => (
            <mesh key={j} position={f.pos} rotation={[0, -Math.PI / 2, 0]}>
              <boxGeometry args={f.size} />
              <meshLambertMaterial color="#f8f6f2" />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Ceiling fluorescent strips ── */}
      {[[-5, 3.96, -3], [0, 3.96, -3], [5, 3.96, -3],
        [-5, 3.96,  3], [0, 3.96,  3], [5, 3.96,  3]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z] as [number,number,number]}>
          <boxGeometry args={[0.14, 0.04, 2.8]} />
          <meshLambertMaterial
            ref={addCeilMat}
            color="#fffff8"
            emissive="#fffff0"
            emissiveIntensity={gameTime.hour >= 22 || gameTime.hour < 6 ? 0.4 : 0.95}
          />
        </mesh>
      ))}

      {/* Light housing trim */}
      {[[-5, 3.97, -3], [0, 3.97, -3], [5, 3.97, -3],
        [-5, 3.97,  3], [0, 3.97,  3], [5, 3.97,  3]].map(([x, y, z], i) => (
        <mesh key={`h${i}`} position={[x, y, z] as [number,number,number]}>
          <boxGeometry args={[0.22, 0.03, 3.1]} />
          <meshLambertMaterial color="#d8d6d2" />
        </mesh>
      ))}

      {/* ── Coffee machine (back-left corner) ── */}
      <group position={[-10.5, 0, -7.5]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.55, 1.1, 0.45]} />
          <meshLambertMaterial color="#2a2a2a" />
        </mesh>
        {/* Display panel */}
        <mesh position={[0, 0.8, 0.228]}>
          <boxGeometry args={[0.3, 0.22, 0.01]} />
          <meshLambertMaterial color="#1a3a5a" emissive="#0a80e0" emissiveIntensity={0.6} />
        </mesh>
        {/* Spout */}
        <mesh position={[0, 0.5, 0.26]}>
          <boxGeometry args={[0.06, 0.18, 0.06]} />
          <meshLambertMaterial color="#3a3a3a" />
        </mesh>
        {/* Cup platform */}
        <mesh position={[0, 0.26, 0.22]}>
          <boxGeometry args={[0.28, 0.02, 0.2]} />
          <meshLambertMaterial color="#444444" />
        </mesh>
        {/* Coffee cup */}
        <mesh position={[0, 0.38, 0.22]}>
          <cylinderGeometry args={[0.055, 0.045, 0.12, 8]} />
          <meshLambertMaterial color="#f5f0ea" />
        </mesh>
        <mesh position={[0, 0.445, 0.22]}>
          <cylinderGeometry args={[0.055, 0.055, 0.01, 8]} />
          <meshLambertMaterial color="#7a4a20" />
        </mesh>
        {/* Counter */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[1.2, 0.08, 0.8]} />
          <meshLambertMaterial color="#b08060" />
        </mesh>
      </group>

      {/* ── Whiteboard (back wall) ── */}
      <group position={[-4, 2.2, -8.94]}>
        <mesh>
          <boxGeometry args={[4.5, 2.2, 0.08]} />
          <meshLambertMaterial color="#f0efe8" />
        </mesh>
        {/* Board frame */}
        <mesh position={[0, 0, 0.042]}>
          <boxGeometry args={[4.7, 2.4, 0.04]} />
          <meshLambertMaterial color="#b8a888" />
        </mesh>
        {/* Marker lines (pseudo-content) */}
        {[
          { pos: [-1.4, 0.6, 0.05],  size: [1.8, 0.04, 0.01], color: "#3060c0" },
          { pos: [-1.4, 0.3, 0.05],  size: [1.2, 0.04, 0.01], color: "#3060c0" },
          { pos: [-1.4, 0.0, 0.05],  size: [1.5, 0.04, 0.01], color: "#3060c0" },
          { pos: [-1.4,-0.3, 0.05],  size: [0.9, 0.04, 0.01], color: "#3060c0" },
          { pos: [ 0.8, 0.6, 0.05],  size: [0.9, 0.9, 0.01],  color: "#e8f0ff" },
          { pos: [ 0.8, 0.6, 0.052], size: [0.85, 0.85, 0.01], color: "#dce8ff" },
        ].map((l, i) => (
          <mesh key={i} position={l.pos as [number,number,number]}>
            <boxGeometry args={l.size as [number,number,number]} />
            <meshLambertMaterial color={l.color} />
          </mesh>
        ))}
        {/* Marker tray */}
        <mesh position={[0, -1.15, 0.05]}>
          <boxGeometry args={[4.3, 0.08, 0.12]} />
          <meshLambertMaterial color="#c8b890" />
        </mesh>
        {/* Markers */}
        {[["#e03030",-1.5],["#3060c0",-1.2],["#308030",-0.9],["#c07000",-0.6]].map(([color, x], i) => (
          <mesh key={`m${i}`} position={[x as number, -1.12, 0.1]}>
            <cylinderGeometry args={[0.02, 0.02, 0.25, 6]} />
            <meshLambertMaterial color={color as string} />
          </mesh>
        ))}
      </group>

      {/* ── Bookshelf (right back) ── */}
      <group position={[9.5, 0, -8.2]}>
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[2.8, 2.0, 0.45]} />
          <meshLambertMaterial color="#a87848" />
        </mesh>
        {[0.18, 0.76, 1.34].map((y, row) => (
          <group key={row}>
            <mesh position={[0, y, 0.2]}>
              <boxGeometry args={[2.75, 0.035, 0.02]} />
              <meshLambertMaterial color="#906638" />
            </mesh>
            {Array.from({ length: 7 }, (_, c) => {
              const hue = (row * 7 + c) * 47;
              const h = 0.28 + Math.sin(hue) * 0.1;
              const w = 0.2 + Math.sin(hue * 3) * 0.06;
              const colors = ["#c04040","#4060c0","#408040","#c08020","#8040c0","#c06020","#206080"];
              return (
                <mesh key={c} position={[-1.1 + c * 0.36, y + h / 2 + 0.02, 0.17]}>
                  <boxGeometry args={[w, h, 0.32]} />
                  <meshLambertMaterial color={colors[(row * 7 + c) % colors.length]} />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>

      {/* ── Corner plants ── */}
      {[
        { pos: [-11.5, 0, -7.5] as [number,number,number], s: 1.1 },
        { pos: [ 11.5, 0, -7.5] as [number,number,number], s: 0.9 },
        { pos: [-11.5, 0,  7.5] as [number,number,number], s: 1.0 },
      ].map(({ pos, s }, i) => (
        <group key={i} position={pos} scale={[s, s, s]}>
          {/* Pot */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.2, 0.16, 0.44, 8]} />
            <meshLambertMaterial color="#a0704a" />
          </mesh>
          {/* Soil */}
          <mesh position={[0, 0.445, 0]}>
            <cylinderGeometry args={[0.198, 0.198, 0.02, 8]} />
            <meshLambertMaterial color="#3a2a1a" />
          </mesh>
          {/* Trunk */}
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.04, 0.055, 0.52, 6]} />
            <meshLambertMaterial color="#5a3818" />
          </mesh>
          {/* Leaves */}
          {[
            [0, 1.1, 0, 0.42, 0.36, 0.42],
            [-0.22, 0.95, 0.12, 0.25, 0.32, 0.25],
            [ 0.22, 0.95,-0.12, 0.25, 0.32, 0.25],
            [ 0.14, 1.02, 0.2,  0.22, 0.28, 0.22],
            [-0.14, 1.02,-0.2,  0.22, 0.28, 0.22],
          ].map(([lx, ly, lz, rx, ry, rz], j) => (
            <mesh key={j} position={[lx, ly, lz] as [number,number,number]}>
              <sphereGeometry args={[1, 6, 5]} />
              <meshLambertMaterial color={j === 0 ? "#2d7a3a" : "#3a8a46"} />
              <group scale={[rx, ry, rz] as [number,number,number]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ── Baseboards ── */}
      {[
        { pos: [0, 0.04, -8.96] as [number,number,number],  size: [26, 0.08, 0.06] as [number,number,number], rot: 0 },
        { pos: [-12.96, 0.04, 0] as [number,number,number], size: [18, 0.08, 0.06] as [number,number,number], rot: Math.PI / 2 },
      ].map((b, i) => (
        <mesh key={i} position={b.pos} rotation={[0, b.rot, 0]}>
          <boxGeometry args={b.size} />
          <meshLambertMaterial color="#d4cfc8" />
        </mesh>
      ))}

      {/* ── Meeting table (centre-ish) ── */}
      <group position={[7, 0, 1]}>
        {/* Table top */}
        <mesh position={[0, 0.74, 0]}>
          <boxGeometry args={[2.8, 0.08, 1.4]} />
          <meshLambertMaterial color="#c8a870" />
        </mesh>
        {/* Table edge trim */}
        <mesh position={[0, 0.78, 0]}>
          <boxGeometry args={[2.9, 0.04, 1.5]} />
          <meshLambertMaterial color="#a88050" />
        </mesh>
        {/* Legs */}
        {[[-1.25, -0.55], [1.25, -0.55], [-1.25, 0.55], [1.25, 0.55]].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.35, lz] as [number,number,number]}>
            <boxGeometry args={[0.07, 0.7, 0.07]} />
            <meshLambertMaterial color="#907040" />
          </mesh>
        ))}
        {/* Meeting chairs */}
        {[
          { pos: [-0.7,  0, -0.95] as [number,number,number], rot: 0 },
          { pos: [ 0.7,  0, -0.95] as [number,number,number], rot: 0 },
          { pos: [-0.7,  0,  0.95] as [number,number,number], rot: Math.PI },
          { pos: [ 0.7,  0,  0.95] as [number,number,number], rot: Math.PI },
        ].map((c, i) => (
          <group key={i} position={c.pos} rotation={[0, c.rot, 0]}>
            <mesh position={[0, 0.44, 0]}>
              <boxGeometry args={[0.42, 0.04, 0.42]} />
              <meshLambertMaterial color="#4a6080" />
            </mesh>
            <mesh position={[0, 0.74, -0.21]}>
              <boxGeometry args={[0.42, 0.56, 0.06]} />
              <meshLambertMaterial color="#4a6080" />
            </mesh>
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.44, 5]} />
              <meshLambertMaterial color="#2a3a4a" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
