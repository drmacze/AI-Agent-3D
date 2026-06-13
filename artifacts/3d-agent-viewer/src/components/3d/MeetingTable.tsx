export function MeetingTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table top */}
      <mesh position={[0, 0.76, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.1, 0.06, 16]} />
        <meshLambertMaterial color="#b09070" />
      </mesh>
      {/* Table leg */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.74, 8]} />
        <meshLambertMaterial color="#8a7060" />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.05, 8]} />
        <meshLambertMaterial color="#8a7060" />
      </mesh>

      {/* Chairs around meeting table */}
      {([0, 90, 180, 270] as number[]).map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        const cx = Math.sin(rad) * 1.5;
        const cz = Math.cos(rad) * 1.5;
        return (
          <group key={i} position={[cx, 0, cz]} rotation={[0, -rad, 0]}>
            <mesh position={[0, 0.46, 0]} castShadow>
              <boxGeometry args={[0.46, 0.08, 0.44]} />
              <meshLambertMaterial color="#4a5568" />
            </mesh>
            <mesh position={[0, 0.72, -0.19]} castShadow>
              <boxGeometry args={[0.44, 0.5, 0.06]} />
              <meshLambertMaterial color="#4a5568" />
            </mesh>
            <mesh position={[0, 0.24, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.03, 0.44, 6]} />
              <meshLambertMaterial color="#9aa0ac" />
            </mesh>
            <mesh position={[0, 0.04, 0]} castShadow>
              <cylinderGeometry args={[0.24, 0.24, 0.04, 10]} />
              <meshLambertMaterial color="#9aa0ac" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
