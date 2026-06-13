import { useMemo } from "react";
import * as THREE from "three";

export function OfficeFloor() {
  const tileTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#e8e4de";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "#d4cfc8";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, size - 8, size - 8);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(12, 8);
    return tex;
  }, []);

  return (
    <group>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[24, 16]} />
        <meshLambertMaterial map={tileTexture} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4, 0]}>
        <planeGeometry args={[24, 16]} />
        <meshLambertMaterial color="#f5f3f0" />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 2, -8]} receiveShadow>
        <planeGeometry args={[24, 4]} />
        <meshLambertMaterial color="#ede9e2" />
      </mesh>

      {/* Left wall */}
      <mesh position={[-12, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 4]} />
        <meshLambertMaterial color="#f0ece6" />
      </mesh>

      {/* Right wall (window wall) - lighter */}
      <mesh position={[12, 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[16, 4]} />
        <meshLambertMaterial color="#f8f5f0" />
      </mesh>

      {/* Window frame on right wall */}
      {[-2, 2].map((z, i) => (
        <group key={i} position={[11.95, 2, z]}>
          {/* Window pane (bright emissive to simulate sunlight coming in) */}
          <mesh rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[3.2, 2.4]} />
            <meshLambertMaterial color="#c8e4f5" emissive="#a0c8e8" emissiveIntensity={0.3} />
          </mesh>
          {/* Window frame */}
          {[[-1.65, 0], [1.65, 0], [0, -1.25], [0, 1.25]].map(([fx, fy], j) => (
            <mesh key={j} position={[0.05, fy, fx]} rotation={[0, -Math.PI / 2, 0]}>
              <boxGeometry args={[j < 2 ? 0.08 : 3.3, j < 2 ? 2.4 : 0.08, 0.08]} />
              <meshLambertMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Ceiling lights (long fluorescent strips) */}
      {[[-4, 3.95, -2], [4, 3.95, -2], [-4, 3.95, 2], [4, 3.95, 2]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[0.15, 0.05, 2.5]} />
          <meshLambertMaterial color="#fffff0" emissive="#fffff0" emissiveIntensity={0.9} />
        </mesh>
      ))}

      {/* Baseboard on walls */}
      <mesh position={[0, 0.04, -7.97]}>
        <boxGeometry args={[24, 0.08, 0.06]} />
        <meshLambertMaterial color="#d8d4cd" />
      </mesh>
      <mesh position={[-11.97, 0.04, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[16, 0.08, 0.06]} />
        <meshLambertMaterial color="#d8d4cd" />
      </mesh>
    </group>
  );
}
