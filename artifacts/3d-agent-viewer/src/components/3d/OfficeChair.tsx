interface OfficeChairProps {
  position: [number, number, number];
  rotation?: number;
  isOccupied?: boolean;
}

export function OfficeChair({ position, rotation = 0, isOccupied = false }: OfficeChairProps) {
  const fabricColor = isOccupied ? "#2d3748" : "#374151";
  const frameColor  = "#9ca3af";
  const wheelColor  = "#4b5563";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat cushion */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.52, 0.09, 0.5]} />
        <meshStandardMaterial color={fabricColor} roughness={0.92} metalness={0.0} />
      </mesh>
      {/* Seat foam edge bevel (front) */}
      <mesh position={[0, 0.44, 0.24]} castShadow>
        <boxGeometry args={[0.50, 0.03, 0.06]} />
        <meshStandardMaterial color={fabricColor} roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Backrest */}
      <mesh position={[0, 0.83, -0.22]} castShadow>
        <boxGeometry args={[0.5, 0.58, 0.07]} />
        <meshStandardMaterial color={fabricColor} roughness={0.92} metalness={0.0} />
      </mesh>
      {/* Backrest lumbar support */}
      <mesh position={[0, 0.72, -0.19]} castShadow>
        <boxGeometry args={[0.46, 0.12, 0.04]} />
        <meshStandardMaterial color={fabricColor} roughness={0.88} metalness={0.0} />
      </mesh>
      {/* Headrest */}
      <mesh position={[0, 1.14, -0.22]} castShadow>
        <boxGeometry args={[0.32, 0.18, 0.065]} />
        <meshStandardMaterial color={fabricColor} roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Center gas cylinder */}
      <mesh position={[0, 0.27, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.032, 0.48, 10]} />
        <meshStandardMaterial color={frameColor} roughness={0.25} metalness={0.8} />
      </mesh>
      {/* Seat mechanism plate */}
      <mesh position={[0, 0.435, 0]} castShadow>
        <boxGeometry args={[0.32, 0.03, 0.32]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.75} />
      </mesh>

      {/* 5-star base */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh key={i} position={[Math.sin(rad) * 0.15, 0.055, Math.cos(rad) * 0.15]} rotation={[0, -rad, 0]} castShadow>
            <boxGeometry args={[0.28, 0.028, 0.045]} />
            <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.75} />
          </mesh>
        );
      })}

      {/* Wheels */}
      {[0, 72, 144, 216, 288].map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <mesh key={i} position={[Math.sin(rad) * 0.27, 0.035, Math.cos(rad) * 0.27]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.065, 10]} />
            <meshStandardMaterial color={wheelColor} roughness={0.5} metalness={0.4} />
          </mesh>
        );
      })}

      {/* Armrests */}
      {[-1, 1].map((side, i) => (
        <group key={i}>
          {/* Upright */}
          <mesh position={[side * 0.29, 0.63, -0.06]} castShadow>
            <boxGeometry args={[0.035, 0.28, 0.035]} />
            <meshStandardMaterial color={frameColor} roughness={0.25} metalness={0.8} />
          </mesh>
          {/* Pad */}
          <mesh position={[side * 0.29, 0.79, 0.06]} castShadow>
            <boxGeometry args={[0.065, 0.035, 0.28]} />
            <meshStandardMaterial color={fabricColor} roughness={0.85} metalness={0.0} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
