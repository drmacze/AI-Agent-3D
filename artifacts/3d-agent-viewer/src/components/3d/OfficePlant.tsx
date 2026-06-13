interface OfficePlantProps {
  position: [number, number, number];
  scale?: number;
}

export function OfficePlant({ position, scale = 1 }: OfficePlantProps) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Pot — ceramic */}
      <mesh position={[0, 0.19, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.13, 0.32, 16]} />
        <meshStandardMaterial color="#b5651d" roughness={0.6} metalness={0.0} />
      </mesh>
      {/* Pot lip */}
      <mesh position={[0, 0.355, 0]} castShadow>
        <cylinderGeometry args={[0.195, 0.18, 0.03, 16]} />
        <meshStandardMaterial color="#a0581a" roughness={0.55} metalness={0.0} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.368, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.02, 16]} />
        <meshStandardMaterial color="#3d2a1e" roughness={0.95} metalness={0.0} />
      </mesh>
      {/* Pebbles on soil */}
      {[0.06, -0.05, 0.08, -0.09, 0.02].map((x, i) => (
        <mesh key={i} position={[x, 0.378, (i % 2 === 0 ? 0.05 : -0.07)]} castShadow>
          <sphereGeometry args={[0.018, 6, 4]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#6b5b4e" : "#7d6b5e"} roughness={0.9} metalness={0.0} />
        </mesh>
      ))}

      {/* Main stem */}
      <mesh position={[0, 0.56, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.028, 0.42, 8]} />
        <meshStandardMaterial color="#3b6e28" roughness={0.75} metalness={0.0} />
      </mesh>
      {/* Secondary stems */}
      <mesh position={[0.12, 0.52, 0.08]} rotation={[0.3, 0.4, 0.5]} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 0.28, 6]} />
        <meshStandardMaterial color="#3b6e28" roughness={0.75} metalness={0.0} />
      </mesh>
      <mesh position={[-0.1, 0.5, -0.09]} rotation={[-0.2, -0.3, -0.4]} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 0.26, 6]} />
        <meshStandardMaterial color="#3b6e28" roughness={0.75} metalness={0.0} />
      </mesh>

      {/* Leaves cluster — higher-poly spheres */}
      {([
        [0,    0.84, 0,    0.29, "#4a8c38"],
        [0.19, 0.74, 0.13, 0.21, "#3d7a2e"],
        [-0.17,0.76, 0.09, 0.21, "#417d30"],
        [0.09, 0.76,-0.19, 0.20, "#3a7629"],
        [-0.11,0.69,-0.15, 0.18, "#3d7a2e"],
        [0.14, 0.70,-0.08, 0.17, "#4a8c38"],
        [-0.07,0.88, 0.12, 0.16, "#4e9040"],
      ] as [number,number,number,number,string][]).map(([x,y,z,r,color], i) => (
        <mesh key={i} position={[x,y,z]} castShadow>
          <sphereGeometry args={[r, 14, 10]} />
          <meshStandardMaterial color={color} roughness={0.82} metalness={0.0} />
        </mesh>
      ))}

      {/* Large decorative leaf (flat plane) */}
      <mesh position={[0.25, 0.62, 0.05]} rotation={[0.1, 0.3, -0.6]} castShadow>
        <boxGeometry args={[0.28, 0.005, 0.14]} />
        <meshStandardMaterial color="#4a8c38" roughness={0.8} metalness={0.0} side={2} />
      </mesh>
      <mesh position={[-0.22, 0.60, -0.08]} rotation={[-0.1, -0.5, 0.55]} castShadow>
        <boxGeometry args={[0.26, 0.005, 0.13]} />
        <meshStandardMaterial color="#3d7a2e" roughness={0.8} metalness={0.0} side={2} />
      </mesh>
    </group>
  );
}
