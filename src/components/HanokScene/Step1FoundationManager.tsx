import React, { useState } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useBuildStore } from '../../store';

const SNAP_SIZE = 1.0; // 1m Grid Snap interval
const FOUNDATION_HEIGHT = 0.5;
const FOUNDATION_SIZE = 0.9;

export const Step1FoundationManager: React.FC = () => {
  const currentStep = useBuildStore((state) => state.currentStep);
  const placedParts = useBuildStore((state) => state.placedParts);
  const addPart = useBuildStore((state) => state.addPart);
  const removePart = useBuildStore((state) => state.removePart);

  // Snapped hover position
  const [hoverPos, setHoverPos] = useState<[number, number, number] | null>(null);

  // Foundation stones are only interactive in STEP 1
  const isStep1 = currentStep === 1;

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isStep1) return;
    e.stopPropagation();

    // Snap intersection point to nearest SNAP_SIZE
    const snappedX = Math.round(e.point.x / SNAP_SIZE) * SNAP_SIZE;
    const snappedZ = Math.round(e.point.z / SNAP_SIZE) * SNAP_SIZE;

    setHoverPos([snappedX, FOUNDATION_HEIGHT / 2, snappedZ]);
  };

  const handlePointerOut = () => {
    setHoverPos(null);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isStep1 || !hoverPos) return;
    e.stopPropagation();

    const [x, , z] = hoverPos;

    // Check if a foundation already exists at this coordinate
    const existing = placedParts.find(
      (p) =>
        p.category === 'foundation' &&
        Math.abs(p.position[0] - x) < 0.2 &&
        Math.abs(p.position[2] - z) < 0.2
    );

    if (existing) {
      // Cannot place on an already occupied spot
      return;
    }

    // Add new foundation stone (주춧돌)
    addPart({
      id: `foundation_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      partId: 'foundation_stone',
      name: `주춧돌 (${x}, ${z})`,
      category: 'foundation',
      position: [x, FOUNDATION_HEIGHT / 2, z],
      rotation: [0, 0, 0],
      scale: [FOUNDATION_SIZE, FOUNDATION_HEIGHT, FOUNDATION_SIZE],
    });
  };

  const foundationParts = placedParts.filter((p) => p.category === 'foundation');

  // Check if current hover position is already occupied
  const isHoverOccupied = hoverPos
    ? foundationParts.some(
        (p) =>
          Math.abs(p.position[0] - hoverPos[0]) < 0.2 &&
          Math.abs(p.position[2] - hoverPos[2]) < 0.2
      )
    : false;

  const ghostColor = isHoverOccupied ? '#ff3355' : '#5C8F87';
  const ghostEmissive = isHoverOccupied ? '#ff1133' : '#5C8F87';

  return (
    <group>
      {/* 1. Invisible Raycast Floor for accurate Grid snapping */}
      {isStep1 && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <planeGeometry args={[40, 40]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}

      {/* 2. Snap Highlight Indicator (Ghost Preview) */}
      {isStep1 && hoverPos && (
        <group position={hoverPos}>
          {/* Base Ghost Box */}
          <mesh>
            <boxGeometry args={[FOUNDATION_SIZE, FOUNDATION_HEIGHT, FOUNDATION_SIZE]} />
            <meshStandardMaterial
              color={ghostColor}
              emissive={ghostEmissive}
              emissiveIntensity={0.55}
              transparent
              opacity={isHoverOccupied ? 0.65 : 0.5}
              roughness={0.2}
            />
          </mesh>

          {/* Glowing wireframe edge highlight */}
          <mesh>
            <boxGeometry args={[FOUNDATION_SIZE * 1.02, FOUNDATION_HEIGHT * 1.02, FOUNDATION_SIZE * 1.02]} />
            <meshBasicMaterial
              color={isHoverOccupied ? '#ff9999' : '#EFE7D6'}
              wireframe
              transparent
              opacity={0.8}
            />
          </mesh>

          {/* Ground crosshair indicator */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -FOUNDATION_HEIGHT / 2 + 0.01, 0]}>
            <ringGeometry args={[0.5, 0.58, 32]} />
            <meshBasicMaterial color={ghostColor} side={2} />
          </mesh>

          {/* Floating Confirm / Status Badge above Ghost */}
          <Html center position={[0, FOUNDATION_HEIGHT / 2 + 0.4, 0]}>
            <div
              style={{
                backgroundColor: isHoverOccupied
                  ? 'rgba(180, 20, 40, 0.92)'
                  : 'rgba(46, 120, 100, 0.92)',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              {isHoverOccupied ? '이미 배치된 주춧돌 (Occupied)' : '주춧돌 배치 (Click to Confirm)'}
            </div>
          </Html>
        </group>
      )}

      {/* 3. Rendered Placed Foundation Stones */}
      {foundationParts.map((part) => (
        <group
          key={part.id}
          position={part.position}
          onClick={(e) => {
            if (isStep1) {
              e.stopPropagation();
              // Right click or click with shift to inspect/remove
              if (e.button === 2 || e.shiftKey) {
                removePart(part.id);
                return;
              }
              useBuildStore.getState().selectObject(part.id);
              useBuildStore.getState().selectPart('foundation_stone');
            }
          }}
        >
          {/* Main Granite Plinth (주춧돌) Mesh */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={part.scale || [FOUNDATION_SIZE, FOUNDATION_HEIGHT, FOUNDATION_SIZE]} />
            <meshStandardMaterial
              color="#3a4042" // Dark granite stone hue matching ink palette
              roughness={0.7}
              metalness={0.15}
            />
          </mesh>

          {/* Subtle Top Chamfer / Mortise Socket Accent */}
          <mesh position={[0, FOUNDATION_HEIGHT / 2 + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.22, 24]} />
            <meshStandardMaterial color="#202526" roughness={0.9} />
          </mesh>

          {/* Stone Edge Highlight (Only visible in STEP 01) */}
          {isStep1 && (
            <mesh>
              <boxGeometry
                args={[
                  (part.scale ? part.scale[0] : FOUNDATION_SIZE) * 1.005,
                  (part.scale ? part.scale[1] : FOUNDATION_HEIGHT) * 1.005,
                  (part.scale ? part.scale[2] : FOUNDATION_SIZE) * 1.005,
                ]}
              />
              <meshBasicMaterial color="rgba(239, 231, 214, 0.12)" wireframe />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};
