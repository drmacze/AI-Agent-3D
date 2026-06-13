interface OfficeChairProps {
  position: [number, number, number];
  rotation?: number;
  isOccupied?: boolean;
}

export function OfficeChair({ position, rotation = 0, isOccupied = false }: OfficeChairProps) {
  const seatColor = "#3a3a4a";
  const frameColor = "#888890";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat cushion */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.52, 0.1, 0.5]} />
        <meshLambertMaterial color={seatColor} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.82, -0.22]} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.07]} />
        <meshLambertMaterial color={seatColor} />
      </mesh>
      {/* Center pole */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.46, 8]} />
        <meshLambertMaterial color={frameColor} />
      </mesh>
      {/* Base disk */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 12]} />
        <meshLambertMaterial color={frameColor} />
      </mesh>
      {/* Armrests */}
      {[-1, 1].map((side, i) => (
        <group key={i}>
          <mesh position={[side * 0.28, 0.65, -0.05]} castShadow>
            <boxGeometry args={[0.04, 0.25, 0.04]} />
            <meshLambertMaterial color={frameColor} />
          </mesh>
          <mesh position={[side * 0.28, 0.79, 0.06]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.28]} />
            <meshLambertMaterial color={seatColor} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
