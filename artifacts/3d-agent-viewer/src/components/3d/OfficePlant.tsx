interface OfficePlantProps {
  position: [number, number, number];
  scale?: number;
}

export function OfficePlant({ position, scale = 1 }: OfficePlantProps) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Pot */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.3, 10]} />
        <meshLambertMaterial color="#b5651d" />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.04, 10]} />
        <meshLambertMaterial color="#4a3728" />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 0.4, 6]} />
        <meshLambertMaterial color="#3d6e2c" />
      </mesh>
      {/* Leaves cluster (multiple spheres) */}
      {[
        [0, 0.82, 0, 0.28],
        [0.18, 0.72, 0.12, 0.2],
        [-0.16, 0.75, 0.08, 0.2],
        [0.08, 0.75, -0.18, 0.19],
        [-0.1, 0.68, -0.14, 0.17],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 7, 6]} />
          <meshLambertMaterial color={i === 0 ? "#4a8c38" : "#3d7a2e"} />
        </mesh>
      ))}
    </group>
  );
}
