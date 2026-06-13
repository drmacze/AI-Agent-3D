import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Line } from "@react-three/drei";

interface ConnectionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
}

export function ConnectionLine({ start, end, color }: ConnectionLineProps) {
  const lineRef = useRef<any>(null);
  
  // Create a curved line using quadratic bezier
  const points = useMemo(() => {
    const p1 = new THREE.Vector3(...start);
    const p2 = new THREE.Vector3(...end);
    const mid = p1.clone().lerp(p2, 0.5);
    mid.y += p1.distanceTo(p2) * 0.2; // Curve height proportional to distance
    
    const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
    return curve.getPoints(20);
  }, [start, end]);

  useFrame((state) => {
    if (lineRef.current) {
      // Animate dash offset for flowing effect
      if (lineRef.current.material) {
        lineRef.current.material.dashOffset -= 0.05;
      }
    }
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={color}
      lineWidth={2}
      dashed={true}
      dashSize={0.5}
      dashScale={0.5}
      dashOffset={0}
      transparent
      opacity={0.6}
    />
  );
}
