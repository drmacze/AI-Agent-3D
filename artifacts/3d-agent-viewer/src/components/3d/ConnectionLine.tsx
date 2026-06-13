import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color?: string;
}

export function ConnectionLine({ start, end, color = "#2563eb" }: ConnectionLineProps) {
  const lineRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.MeshLambertMaterial;
      mat.opacity = 0.35 + Math.sin(clock.elapsedTime * 2.5) * 0.15;
    }
  });

  const mid: [number, number, number] = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
    (start[2] + end[2]) / 2,
  ];

  const dx = end[0] - start[0];
  const dz = end[2] - start[2];
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz);

  if (length < 0.1) return null;

  return (
    <mesh ref={lineRef} position={mid} rotation={[0, angle, 0]}>
      <boxGeometry args={[0.035, 0.035, length]} />
      <meshLambertMaterial color={color} transparent opacity={0.4} />
    </mesh>
  );
}
