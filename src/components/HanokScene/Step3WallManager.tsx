import React, { useState } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useBuildStore } from '../../store';
import { calculateWallAnchors, findNearestWallAnchor, type WallAnchorPoint } from './snapPoints';
import { TraditionalLatticeGrill } from './TraditionalLatticeGrill';

export const Step3WallManager: React.FC = () => {
  const currentStep = useBuildStore((state) => state.currentStep);
  const selectedPart = useBuildStore((state) => state.selectedPart);
  const placedParts = useBuildStore((state) => state.placedParts);
  const addPart = useBuildStore((state) => state.addPart);
  const removePart = useBuildStore((state) => state.removePart);

  const [hoverAnchorId, setHoverAnchorId] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [warningPos, setWarningPos] = useState<[number, number, number] | null>(null);

  const isStep3 = currentStep === 3;

  // Pillars to construct anchors between
  const pillars = placedParts.filter((p) => p.category === 'pillar');
  const wallAnchors = calculateWallAnchors(pillars);

  // Placed walls & openings
  const wallsAndOpenings = placedParts.filter(
    (p) => p.category === 'wall' || p.category === 'window' || p.category === 'door'
  );

  const isWallPart = selectedPart === 'wall_earth' || selectedPart === 'wall_wood';
  const isOpeningPart =
    selectedPart === 'window_lattice' ||
    selectedPart === 'door_sliding' ||
    selectedPart === 'door_traditional';

  const triggerWarning = (pos: [number, number, number], msg: string) => {
    setWarningPos(pos);
    setWarningMessage(msg);
    setTimeout(() => {
      setWarningPos(null);
      setWarningMessage(null);
    }, 2200);
  };

  // Continuous pointer move over floor to detect nearest anchor dynamically
  const handleFloorPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isStep3) return;
    e.stopPropagation();

    const nearest = findNearestWallAnchor([e.point.x, e.point.y, e.point.z], wallAnchors, 2.4);
    if (nearest) {
      setHoverAnchorId(nearest.id);
    } else {
      setHoverAnchorId(null);
    }
  };

  const handleFloorPointerOut = () => {
    setHoverAnchorId(null);
  };


  // Click on Wall Anchor Point (Between Pillars)
  const handleAnchorClick = (anchor: WallAnchorPoint, e: ThreeEvent<MouseEvent>) => {
    if (!isStep3) return;
    e.stopPropagation();

    // Check if an existing wall/opening is already on this anchor
    const existing = wallsAndOpenings.find(
      (w) =>
        Math.abs(w.position[0] - anchor.position[0]) < 0.3 &&
        Math.abs(w.position[2] - anchor.position[2]) < 0.3
    );

    // Shift + Click or Right Click to remove existing wall/opening at anchor
    if (existing && (e.shiftKey || e.button === 2)) {
      removePart(existing.id);
      return;
    }

    // If trying to place window/door when NO wall exists
    if (isOpeningPart && !existing) {
      triggerWarning(
        anchor.position,
        '창호(격자창/문)는 기존에 벽체(Wall)가 세워진 곳에만 교체 설치할 수 있습니다.'
      );
      return;
    }

    // If an opening or wall exists and user selects an opening, perform REPLACEMENT
    if (isOpeningPart && existing) {
      removePart(existing.id);

      const openingName =
        selectedPart === 'window_lattice'
          ? '세살 격자창 (Lattice Window)'
          : selectedPart === 'door_sliding'
            ? '미닫이 세살문 (Sliding Door)'
            : '전통 띠살 판문 (Traditional Door)';

      const category = selectedPart === 'window_lattice' ? 'window' : 'door';

      addPart({
        id: `${category}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        partId: selectedPart!,
        name: openingName,
        category,
        position: anchor.position,
        rotation: anchor.rotation,
        scale: [anchor.width, anchor.height, 0.16],
      });
      return;
    }

    // Placing a Wall (EARTH or WOOD)
    const wallPartId = isWallPart ? selectedPart! : 'wall_earth';
    const wallName =
      wallPartId === 'wall_wood' ? '판벽 (Wood Wall)' : '외엮기 흙벽 (Earth Wall)';

    if (existing) {
      // Replace existing wall/opening with new wall
      removePart(existing.id);
    }

    addPart({
      id: `wall_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      partId: wallPartId,
      name: wallName,
      category: 'wall',
      position: anchor.position,
      rotation: anchor.rotation,
      scale: [anchor.width, anchor.height, 0.16],
    });
  };

  // Warning when user clicks arbitrary ground without anchor
  const handleMisplacedClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isStep3) return;
    if (isWallPart || isOpeningPart) {
      e.stopPropagation();
      triggerWarning(
        [e.point.x, 1.5, e.point.z],
        '벽체는 반드시 두 기둥 사이의 허용된 Anchor Point에만 배치할 수 있습니다.'
      );
    }
  };

  return (
    <group>
      {/* Active Raycast Floor for continuous Wall Anchor Snapping & Click Confirmation */}
      {isStep3 && (
        <mesh
          position={[0, 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerMove={handleFloorPointerMove}
          onPointerOut={handleFloorPointerOut}
          onClick={(e) => {
            if (hoverAnchorId) {
              const targetAnchor = wallAnchors.find((a) => a.id === hoverAnchorId);
              if (targetAnchor) {
                handleAnchorClick(targetAnchor, e);
                return;
              }
            }
            handleMisplacedClick(e);
          }}
        >
          <planeGeometry args={[50, 50]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}

      {/* Warning popup */}
      {warningPos && warningMessage && (
        <group position={warningPos}>
          <mesh>
            <boxGeometry args={[1.6, 0.5, 0.5]} />
            <meshBasicMaterial color="#ff4455" wireframe />
          </mesh>
          <Html center position={[0, 0.8, 0]}>
            <div
              style={{
                backgroundColor: 'rgba(180, 20, 40, 0.94)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 6px 16px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.4)',
              }}
            >
              ⚠ {warningMessage}
            </div>
          </Html>
        </group>
      )}

      {/* Allowed Anchor Points between Columns */}
      {isStep3 &&
        wallAnchors.map((anchor) => {
          const isHovered = hoverAnchorId === anchor.id;
          const hasExisting = wallsAndOpenings.some(
            (w) =>
              Math.abs(w.position[0] - anchor.position[0]) < 0.3 &&
              Math.abs(w.position[2] - anchor.position[2]) < 0.3
          );

          // Placement Validity:
          // - Walls (earth, wood) can be placed on any anchor (valid)
          // - Openings (window, door) require existing wall to replace (invalid if !hasExisting)
          const isValidPlacement = isWallPart || (isOpeningPart && hasExisting);
          const ghostColor = isValidPlacement ? '#5C8F87' : '#ff3355';
          const ghostEmissive = isValidPlacement ? '#5C8F87' : '#ff1133';

          return (
            <group key={anchor.id} position={anchor.position} rotation={anchor.rotation}>
              {/* Anchor Click Trigger Box */}
              <mesh
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoverAnchorId(anchor.id);
                }}
                onPointerOut={() => setHoverAnchorId(null)}
                onClick={(e) => handleAnchorClick(anchor, e)}
              >
                <boxGeometry args={[anchor.width, anchor.height, 0.3]} />
                <meshBasicMaterial visible={false} />
              </mesh>

              {/* Anchor Visual Highlight Indicator & Ghost Preview */}
              <group>
                {/* 1. Translucent Ghost Preview of the Selected Component when hovered */}
                {isHovered && (
                  <group>
                    {/* Ghost Volume */}
                    <mesh>
                      <boxGeometry args={[anchor.width * 0.96, anchor.height * 0.96, 0.14]} />
                      <meshStandardMaterial
                        color={ghostColor}
                        emissive={ghostEmissive}
                        emissiveIntensity={0.65}
                        transparent
                        opacity={0.55}
                        roughness={0.25}
                      />
                    </mesh>
                    {/* Ghost Outer Wireframe Highlight */}
                    <mesh>
                      <boxGeometry args={[anchor.width * 0.98, anchor.height * 0.98, 0.16]} />
                      <meshBasicMaterial
                        color={isValidPlacement ? '#EFE7D6' : '#ff9999'}
                        wireframe
                        transparent
                        opacity={0.8}
                      />
                    </mesh>

                    {/* Window / Door Internal Lattice Grid Ghost Hint if opening is selected */}
                    {isOpeningPart && (
                      <group position={[0, 0, 0.08]}>
                        <mesh>
                          <boxGeometry args={[anchor.width * 0.8, anchor.height * 0.8, 0.01]} />
                          <meshBasicMaterial
                            color={ghostColor}
                            wireframe
                            transparent
                            opacity={0.6}
                          />
                        </mesh>
                      </group>
                    )}

                    {/* Status Badge Tag above Anchor */}
                    <Html center position={[0, anchor.height / 2 + 0.35, 0]}>
                      <div
                        style={{
                          backgroundColor: isValidPlacement
                            ? 'rgba(46, 120, 100, 0.92)'
                            : 'rgba(180, 20, 40, 0.92)',
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
                        {isValidPlacement
                          ? hasExisting
                            ? '교체 설치 가능 (Click to Replace)'
                            : '배치 가능 (Click to Place)'
                          : '설치 불가: 벽체 필요 (Wall Required)'}
                      </div>
                    </Html>
                  </group>
                )}

                {/* 2. Passive Anchor Boundary Indicator when not hovered */}
                {!isHovered && (
                  <>
                    <mesh>
                      <boxGeometry args={[anchor.width * 0.98, anchor.height * 0.98, 0.12]} />
                      <meshStandardMaterial
                        color={hasExisting ? '#C56A3D' : '#5C8F87'}
                        emissive={hasExisting ? '#C56A3D' : '#5C8F87'}
                        emissiveIntensity={0.25}
                        transparent
                        opacity={0.22}
                        wireframe
                      />
                    </mesh>
                    <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
                      <meshStandardMaterial
                        color={hasExisting ? '#C56A3D' : '#5C8F87'}
                        emissive={hasExisting ? '#C56A3D' : '#5C8F87'}
                        emissiveIntensity={0.5}
                      />
                    </mesh>
                  </>
                )}
              </group>
            </group>
          );
        })}

      {/* Rendered Walls & Openings */}
      {wallsAndOpenings.map((part) => {
        const isEarthWall = part.partId === 'wall_earth';
        const isWoodWall = part.partId === 'wall_wood';
        const isLatticeWindow = part.partId === 'window_lattice' || part.category === 'window';
        const isSlidingDoor = part.partId === 'door_sliding';
        const isTraditionalDoor = part.partId === 'door_traditional';

        const scale = part.scale || [2, 2.4, 0.16];
        const [w, h, d] = scale;

        // Realistic architectural material colors
        const woodDark = '#3d2516'; // Deep oiled walnut / pine frame
        const woodWarm = '#5e3e26'; // Warm honey pine sash
        const hanjiPaper = '#f5eedb'; // Warm natural Korean paper (not stark white)
        const ironBlack = '#151719'; // Antique wrought iron
        const earthColor = '#947553'; // Rammed clay straw earth

        return (
          <group
            key={part.id}
            position={part.position}
            rotation={part.rotation}
            onClick={(e) => {
              if (e.button === 2 || e.shiftKey) {
                e.stopPropagation();
                removePart(part.id);
                return;
              }
              e.stopPropagation();
              useBuildStore.getState().selectObject(part.id);
              useBuildStore.getState().selectPart(part.partId);
            }}
          >
            {/* ============================================================== */}
            {/* 1. EARTH WALL (외엮기 흙벽) */}
            {/* ============================================================== */}
            {isEarthWall && (
              <group>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[w, h, d]} />
                  <meshStandardMaterial
                    color={earthColor}
                    roughness={0.92}
                    metalness={0.02}
                  />
                </mesh>
                {/* Lintel and sill wooden trims */}
                <mesh position={[0, -h / 2 + 0.06, 0]}>
                  <boxGeometry args={[w, 0.12, d * 1.05]} />
                  <meshStandardMaterial color={woodDark} roughness={0.7} />
                </mesh>
                <mesh position={[0, h / 2 - 0.06, 0]}>
                  <boxGeometry args={[w, 0.12, d * 1.05]} />
                  <meshStandardMaterial color={woodDark} roughness={0.7} />
                </mesh>
              </group>
            )}

            {/* ============================================================== */}
            {/* 2. WOOD WALL (판벽) */}
            {/* ============================================================== */}
            {isWoodWall && (
              <group>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[w, h, d]} />
                  <meshStandardMaterial
                    color="#47311f"
                    roughness={0.75}
                    metalness={0.04}
                  />
                </mesh>
                {/* Horizontal battens (가로 띠장) */}
                <mesh position={[0, h * 0.25, 0]}>
                  <boxGeometry args={[w, 0.08, d * 1.08]} />
                  <meshStandardMaterial color={woodDark} roughness={0.65} />
                </mesh>
                <mesh position={[0, -h * 0.25, 0]}>
                  <boxGeometry args={[w, 0.08, d * 1.08]} />
                  <meshStandardMaterial color={woodDark} roughness={0.65} />
                </mesh>
              </group>
            )}

            {/* ============================================================== */}
            {/* 3. LATTICE WINDOW (세살 격자창) */}
            {/* ============================================================== */}
            {isLatticeWindow && (
              <group>
                {/* Surrounding Wall Sub-segments creating a real open hollow center */}
                {/* Bottom Wall sill */}
                <mesh position={[0, -h * 0.33, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w, h * 0.34, d]} />
                  <meshStandardMaterial color={earthColor} roughness={0.9} />
                </mesh>
                {/* Top Wall header */}
                <mesh position={[0, h * 0.42, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w, h * 0.16, d]} />
                  <meshStandardMaterial color={earthColor} roughness={0.9} />
                </mesh>
                {/* Left Wall pier */}
                <mesh position={[-w * 0.43, 0.03, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w * 0.14, h * 0.62, d]} />
                  <meshStandardMaterial color={earthColor} roughness={0.9} />
                </mesh>
                {/* Right Wall pier */}
                <mesh position={[w * 0.43, 0.03, 0]} castShadow receiveShadow>
                  <boxGeometry args={[w * 0.14, h * 0.62, d]} />
                  <meshStandardMaterial color={earthColor} roughness={0.9} />
                </mesh>

                {/* 4-sided Window Outer Hollow Frame */}
                {/* Top header bar */}
                <mesh position={[0, 0.05 + h * 0.27, 0]}>
                  <boxGeometry args={[w * 0.74, 0.08, d * 1.15]} />
                  <meshStandardMaterial color={woodDark} roughness={0.68} />
                </mesh>
                {/* Bottom sill bar */}
                <mesh position={[0, 0.05 - h * 0.27, 0]}>
                  <boxGeometry args={[w * 0.74, 0.08, d * 1.15]} />
                  <meshStandardMaterial color={woodDark} roughness={0.68} />
                </mesh>
                {/* Left jamb bar */}
                <mesh position={[-w * 0.35, 0.05, 0]}>
                  <boxGeometry args={[0.08, h * 0.54, d * 1.15]} />
                  <meshStandardMaterial color={woodDark} roughness={0.68} />
                </mesh>
                {/* Right jamb bar */}
                <mesh position={[w * 0.35, 0.05, 0]}>
                  <boxGeometry args={[0.08, h * 0.54, d * 1.15]} />
                  <meshStandardMaterial color={woodDark} roughness={0.68} />
                </mesh>

                {/* Translucent Hanji Paper Core inside opening */}
                <mesh position={[0, 0.05, 0]}>
                  <boxGeometry args={[w * 0.66, h * 0.48, 0.008]} />
                  <meshStandardMaterial
                    color={hanjiPaper}
                    roughness={0.95}
                    metalness={0.0}
                  />
                </mesh>

                {/* Front Korean Sesal Lattice Ribs (세살창 격자) */}
                <group position={[0, 0.05, 0.02]}>
                  <TraditionalLatticeGrill
                    width={w * 0.66}
                    height={h * 0.48}
                    cols={8}
                    rows={12}
                    barThickness={0.018}
                    color="#2b1a10"
                  />
                </group>

                {/* Back Korean Sesal Lattice Ribs */}
                <group position={[0, 0.05, -0.02]}>
                  <TraditionalLatticeGrill
                    width={w * 0.66}
                    height={h * 0.48}
                    cols={8}
                    rows={12}
                    barThickness={0.018}
                    color="#2b1a10"
                  />
                </group>
              </group>
            )}

            {/* ============================================================== */}
            {/* 4. SLIDING DOOR (미닫이 세살문) */}
            {/* ============================================================== */}
            {isSlidingDoor && (
              <group>
                {/* 4-sided Hollow Door Lintel & Jamb Frame (가운데가 시원하게 뚫린 문틀) */}
                {/* Top lintel (인방) */}
                <mesh position={[0, h * 0.46, 0]} castShadow>
                  <boxGeometry args={[w, h * 0.08, d * 1.2]} />
                  <meshStandardMaterial color={woodDark} roughness={0.7} />
                </mesh>
                {/* Bottom threshold (문지방) */}
                <mesh position={[0, -h * 0.46, 0]} castShadow>
                  <boxGeometry args={[w, h * 0.08, d * 1.2]} />
                  <meshStandardMaterial color={woodDark} roughness={0.7} />
                </mesh>
                {/* Left jamb (문설주 좌) */}
                <mesh position={[-w * 0.47, 0, 0]} castShadow>
                  <boxGeometry args={[w * 0.06, h, d * 1.2]} />
                  <meshStandardMaterial color={woodDark} roughness={0.7} />
                </mesh>
                {/* Right jamb (문설주 우) */}
                <mesh position={[w * 0.47, 0, 0]} castShadow>
                  <boxGeometry args={[w * 0.06, h, d * 1.2]} />
                  <meshStandardMaterial color={woodDark} roughness={0.7} />
                </mesh>

                {/* Left Sliding Leaf (문짝 1 - 바깥 레일 z = +0.035) */}
                <group position={[-w * 0.22, 0, 0.035]}>
                  {/* Door Sash Perimeter Stile & Rail */}
                  <mesh>
                    <boxGeometry args={[w * 0.46, h * 0.84, 0.032]} />
                    <meshStandardMaterial color={woodWarm} roughness={0.65} />
                  </mesh>
                  {/* Lower Kick Panel (궁판) - 전면으로 0.015 돌출 */}
                  <mesh position={[0, -h * 0.26, 0.012]}>
                    <boxGeometry args={[w * 0.40, h * 0.26, 0.02]} />
                    <meshStandardMaterial color={woodDark} roughness={0.75} />
                  </mesh>
                  {/* Upper Hanji Paper Screen - offset clearly to eliminate Z-fighting */}
                  <mesh position={[0, h * 0.14, 0.01]}>
                    <boxGeometry args={[w * 0.40, h * 0.50, 0.008]} />
                    <meshStandardMaterial
                      color={hanjiPaper}
                      roughness={0.96}
                      metalness={0.0}
                    />
                  </mesh>
                  {/* Sesal lattice ribs on Hanji screen */}
                  <group position={[0, h * 0.14, 0.024]}>
                    <TraditionalLatticeGrill
                      width={w * 0.38}
                      height={h * 0.48}
                      cols={5}
                      rows={14}
                      barThickness={0.014}
                      color="#23150d"
                    />
                  </group>
                  {/* Sliding Handle (전통 문고리) */}
                  <mesh position={[w * 0.16, 0, 0.032]}>
                    <boxGeometry args={[0.025, 0.14, 0.018]} />
                    <meshStandardMaterial color={ironBlack} metalness={0.85} roughness={0.25} />
                  </mesh>
                </group>

                {/* Right Sliding Leaf (문짝 2 - 안쪽 레일 z = -0.035) */}
                <group position={[w * 0.22, 0, -0.035]}>
                  {/* Door Sash Perimeter Stile & Rail */}
                  <mesh>
                    <boxGeometry args={[w * 0.46, h * 0.84, 0.032]} />
                    <meshStandardMaterial color={woodWarm} roughness={0.65} />
                  </mesh>
                  {/* Lower Kick Panel (궁판) */}
                  <mesh position={[0, -h * 0.26, -0.012]}>
                    <boxGeometry args={[w * 0.40, h * 0.26, 0.02]} />
                    <meshStandardMaterial color={woodDark} roughness={0.75} />
                  </mesh>
                  {/* Upper Hanji Paper Screen */}
                  <mesh position={[0, h * 0.14, -0.01]}>
                    <boxGeometry args={[w * 0.40, h * 0.50, 0.008]} />
                    <meshStandardMaterial
                      color={hanjiPaper}
                      roughness={0.96}
                      metalness={0.0}
                    />
                  </mesh>
                  {/* Sesal lattice ribs on Hanji screen */}
                  <group position={[0, h * 0.14, -0.024]}>
                    <TraditionalLatticeGrill
                      width={w * 0.38}
                      height={h * 0.48}
                      cols={5}
                      rows={14}
                      barThickness={0.014}
                      color="#23150d"
                    />
                  </group>
                  {/* Sliding Handle (전통 문고리) */}
                  <mesh position={[-w * 0.16, 0, -0.032]}>
                    <boxGeometry args={[0.025, 0.14, 0.018]} />
                    <meshStandardMaterial color={ironBlack} metalness={0.85} roughness={0.25} />
                  </mesh>
                </group>
              </group>
            )}

            {/* ============================================================== */}
            {/* 5. TRADITIONAL DOOR (전통 띠살 판문) */}
            {/* ============================================================== */}
            {isTraditionalDoor && (
              <group>
                {/* 4-sided Hollow Door Lintel & Jamb Frame (문틀) */}
                {/* Top lintel */}
                <mesh position={[0, h * 0.46, 0]} castShadow>
                  <boxGeometry args={[w, h * 0.08, d * 1.25]} />
                  <meshStandardMaterial color={woodDark} roughness={0.75} />
                </mesh>
                {/* Bottom threshold */}
                <mesh position={[0, -h * 0.46, 0]} castShadow>
                  <boxGeometry args={[w, h * 0.08, d * 1.25]} />
                  <meshStandardMaterial color={woodDark} roughness={0.75} />
                </mesh>
                {/* Left jamb */}
                <mesh position={[-w * 0.47, 0, 0]} castShadow>
                  <boxGeometry args={[w * 0.06, h, d * 1.25]} />
                  <meshStandardMaterial color={woodDark} roughness={0.75} />
                </mesh>
                {/* Right jamb */}
                <mesh position={[w * 0.47, 0, 0]} castShadow>
                  <boxGeometry args={[w * 0.06, h, d * 1.25]} />
                  <meshStandardMaterial color={woodDark} roughness={0.75} />
                </mesh>

                {/* Left Door Leaf (좌측 띠살 판문 - z = 0.015) */}
                <group position={[-w * 0.23, 0, 0.015]}>
                  <mesh>
                    <boxGeometry args={[w * 0.45, h * 0.86, 0.045]} />
                    <meshStandardMaterial color={woodWarm} roughness={0.65} />
                  </mesh>
                  {/* Gungpan bottom wooden board */}
                  <mesh position={[0, -h * 0.25, 0.028]}>
                    <boxGeometry args={[w * 0.38, h * 0.28, 0.018]} />
                    <meshStandardMaterial color={woodDark} roughness={0.8} />
                  </mesh>
                  {/* Upper Hanji Paper Screen */}
                  <mesh position={[0, h * 0.16, 0.026]}>
                    <boxGeometry args={[w * 0.38, h * 0.48, 0.008]} />
                    <meshStandardMaterial
                      color={hanjiPaper}
                      roughness={0.96}
                      metalness={0.0}
                    />
                  </mesh>
                  {/* Dtisal Lattice Ribs on screen */}
                  <group position={[0, h * 0.16, 0.038]}>
                    <TraditionalLatticeGrill
                      width={w * 0.36}
                      height={h * 0.46}
                      cols={4}
                      rows={10}
                      barThickness={0.016}
                      color="#23150d"
                    />
                  </group>
                  {/* Traditional Black Iron Hinges (무쇠 제비초리 장석) */}
                  <mesh position={[-w * 0.18, h * 0.28, 0.032]}>
                    <boxGeometry args={[0.07, 0.035, 0.022]} />
                    <meshStandardMaterial color={ironBlack} metalness={0.88} roughness={0.2} />
                  </mesh>
                  <mesh position={[-w * 0.18, -h * 0.28, 0.032]}>
                    <boxGeometry args={[0.07, 0.035, 0.022]} />
                    <meshStandardMaterial color={ironBlack} metalness={0.88} roughness={0.2} />
                  </mesh>
                  {/* Traditional Iron Pull Ring (배목과 문고리 쇠고리) */}
                  <mesh position={[w * 0.14, 0, 0.042]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.015, 16]} />
                    <meshStandardMaterial color={ironBlack} metalness={0.9} roughness={0.2} />
                  </mesh>
                  <mesh position={[w * 0.14, -0.04, 0.042]}>
                    <torusGeometry args={[0.03, 0.007, 8, 20]} />
                    <meshStandardMaterial color={ironBlack} metalness={0.9} roughness={0.2} />
                  </mesh>
                </group>

                {/* Right Door Leaf (우측 띠살 판문 - z = 0.015) */}
                <group position={[w * 0.23, 0, 0.015]}>
                  <mesh>
                    <boxGeometry args={[w * 0.45, h * 0.86, 0.045]} />
                    <meshStandardMaterial color={woodWarm} roughness={0.65} />
                  </mesh>
                  {/* Gungpan bottom wooden board */}
                  <mesh position={[0, -h * 0.25, 0.028]}>
                    <boxGeometry args={[w * 0.38, h * 0.28, 0.018]} />
                    <meshStandardMaterial color={woodDark} roughness={0.8} />
                  </mesh>
                  {/* Upper Hanji Paper Screen */}
                  <mesh position={[0, h * 0.16, 0.026]}>
                    <boxGeometry args={[w * 0.38, h * 0.48, 0.008]} />
                    <meshStandardMaterial
                      color={hanjiPaper}
                      roughness={0.96}
                      metalness={0.0}
                    />
                  </mesh>
                  {/* Dtisal Lattice Ribs on screen */}
                  <group position={[0, h * 0.16, 0.038]}>
                    <TraditionalLatticeGrill
                      width={w * 0.36}
                      height={h * 0.46}
                      cols={4}
                      rows={10}
                      barThickness={0.016}
                      color="#23150d"
                    />
                  </group>
                  {/* Traditional Black Iron Hinges */}
                  <mesh position={[w * 0.18, h * 0.28, 0.032]}>
                    <boxGeometry args={[0.07, 0.035, 0.022]} />
                    <meshStandardMaterial color={ironBlack} metalness={0.88} roughness={0.2} />
                  </mesh>
                  <mesh position={[w * 0.18, -h * 0.28, 0.032]}>
                    <boxGeometry args={[0.07, 0.035, 0.022]} />
                    <meshStandardMaterial color={ironBlack} metalness={0.88} roughness={0.2} />
                  </mesh>
                  {/* Traditional Iron Pull Ring */}
                  <mesh position={[-w * 0.14, 0, 0.042]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.03, 0.03, 0.015, 16]} />
                    <meshStandardMaterial color={ironBlack} metalness={0.9} roughness={0.2} />
                  </mesh>
                  <mesh position={[-w * 0.14, -0.04, 0.042]}>
                    <torusGeometry args={[0.03, 0.007, 8, 20]} />
                    <meshStandardMaterial color={ironBlack} metalness={0.9} roughness={0.2} />
                  </mesh>
                </group>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};
