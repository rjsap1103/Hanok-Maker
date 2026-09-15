import React from 'react';

interface LatticeGrillProps {
  width: number;
  height: number;
  cols?: number;
  rows?: number;
  barThickness?: number;
  color?: string;
}

export const TraditionalLatticeGrill: React.FC<LatticeGrillProps> = ({
  width,
  height,
  cols = 8,
  rows = 14,
  barThickness = 0.016,
  color = '#2d1f16',
}) => {
  // Traditional Korean Sesal-chang (세살창) has slender vertical and horizontal wooden ribs
  const verticalBars = Array.from({ length: cols + 1 }).map((_, i) => {
    const x = -width / 2 + (width / cols) * i;
    return x;
  });

  const horizontalBars = Array.from({ length: rows + 1 }).map((_, i) => {
    const y = -height / 2 + (height / rows) * i;
    return y;
  });

  return (
    <group>
      {/* Outer Inner Frame border */}
      <mesh>
        <boxGeometry args={[width, barThickness * 1.5, barThickness * 1.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width + barThickness, barThickness * 1.5, barThickness * 1.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, -height / 2, 0]}>
        <boxGeometry args={[width + barThickness, barThickness * 1.5, barThickness * 1.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[-width / 2, 0, 0]}>
        <boxGeometry args={[barThickness * 1.5, height, barThickness * 1.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[width / 2, 0, 0]}>
        <boxGeometry args={[barThickness * 1.5, height, barThickness * 1.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>

      {/* Vertical Ribs (세로 살) */}
      {verticalBars.map((x, idx) => (
        <mesh key={`v_${idx}`} position={[x, 0, 0]}>
          <boxGeometry args={[barThickness, height, barThickness]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}

      {/* Horizontal Ribs (가로 살) */}
      {horizontalBars.map((y, idx) => (
        <mesh key={`h_${idx}`} position={[0, y, 0]}>
          <boxGeometry args={[width, barThickness, barThickness]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
};
