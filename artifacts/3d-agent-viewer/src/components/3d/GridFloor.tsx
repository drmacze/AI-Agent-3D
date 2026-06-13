import { Grid } from "@react-three/drei";

export function GridFloor() {
  return (
    <group position={[0, -0.01, 0]}>
      <Grid
        args={[50, 50]}
        cellSize={1}
        cellThickness={1}
        cellColor="#1a2536"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor="#2a3f5a"
        fadeDistance={30}
        fadeStrength={1.5}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#05080f" roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  );
}
