import React, { useState } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useBuildStore, type PlacedPart } from '../../store';
import { PILLAR_SPECS, BEAM_SPECS, FOUNDATION_SPECS, findNearestFoundation } from './snapPoints';

export const Step2TimberManager: React.FC = () => {
  const currentStep = useBuildStore((state) => state.currentStep);
  const setStep = useBuildStore((state) => state.setStep);
  const placedParts = useBuildStore((state) => state.placedParts);
  const addPart = useBuildStore((state) => state.addPart);
  const removePart = useBuildStore((state) => state.removePart);

  // Pillar top snap selection for beam connection
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);

  // Hover states for preview
  const [hoveredFoundationId, setHoveredFoundationId] = useState<string | null>(null);
  const [hoveredPillarId, setHoveredPillarId] = useState<string | null>(null);

  // Warning state for invalid beam placement
  const [invalidAttemptPos, setInvalidAttemptPos] = useState<[number, number, number] | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const isStep2 = currentStep === 2;

  // Filter components: 주춧돌, 기둥, 대들보
  const foundations = placedParts.filter((p) => p.category === 'foundation');
  const pillars = placedParts.filter((p) => p.category === 'pillar');
  // ※ [도리 간섭 방지]: 도리(dori_purin, purlinLevel)는 Step 4 지붕 매니저에서 원목 실린더로 전담 렌더링되므로 대들보 목록에서 제외합니다.
  const beams = placedParts.filter(
    (p) => p.category === 'beam' && p.partId !== 'dori_purin' && !p.purlinLevel && !p.id.startsWith('purlin_')
  );

  // Compute building envelope for beam depth clamping at gable positions (Fix A)
  const buildingMinX = pillars.length > 0 ? Math.min(...pillars.map(p => p.position[0])) : -Infinity;
  const buildingMaxX = pillars.length > 0 ? Math.max(...pillars.map(p => p.position[0])) : Infinity;

  // Helper: check if a pillar already stands on a foundation
  const hasPillarAt = (x: number, z: number) => {
    return pillars.some(
      (p) => Math.abs(p.position[0] - x) < 0.2 && Math.abs(p.position[2] - z) < 0.2
    );
  };

  // Helper to trigger temporary red warning indicator
  const triggerWarning = (pos: [number, number, number], message: string) => {
    setInvalidAttemptPos(pos);
    setWarningMessage(message);
    setTimeout(() => {
      setInvalidAttemptPos(null);
      setWarningMessage(null);
    }, 2000);
  };

  // Floor raycast pointer tracking to detect nearest anchor dynamically
  const handleFloorPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isStep2) return;
    e.stopPropagation();

    // If beam placing mode (first pillar selected), track hovered pillar
    if (selectedPillarId) {
      // Find nearest pillar top
      let nearestPillar: { id: string; dist: number } | null = null;
      for (const p of pillars) {
        const top = PILLAR_SPECS.getSnapPoints(p.position).top;
        const dist = Math.hypot(top[0] - e.point.x, top[2] - e.point.z);
        if (dist < 1.8) {
          if (!nearestPillar || dist < nearestPillar.dist) {
            nearestPillar = { id: p.id, dist };
          }
        }
      }
      if (nearestPillar && nearestPillar.id !== selectedPillarId) {
        setHoveredPillarId(nearestPillar.id);
      } else if (!nearestPillar) {
        setHoveredPillarId(null);
      }
      return;
    }

    // Pillar mode: detect nearest foundation within 1.8m
    const nearest = findNearestFoundation([e.point.x, e.point.y, e.point.z], foundations, 1.8);
    if (nearest) {
      setHoveredFoundationId(nearest.id);
    } else {
      setHoveredFoundationId(null);
    }
  };

  const handleFloorPointerOut = () => {
    setHoveredFoundationId(null);
    if (!selectedPillarId) {
      setHoveredPillarId(null);
    }
  };

  // Floor click when nearest foundation or pillar is highlighted
  const handleFloorClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isStep2) return;
    e.stopPropagation();

    // If selected pillar exists and hovered pillar is present -> confirm beam
    if (selectedPillarId && hoveredPillarId) {
      const targetPillar = pillars.find((p) => p.id === hoveredPillarId);
      if (targetPillar) {
        handlePillarTopClick(targetPillar, e);
        return;
      }
    }

    // If pillar mode and hovered foundation exists -> confirm pillar
    if (!selectedPillarId && hoveredFoundationId) {
      const targetF = foundations.find((f) => f.id === hoveredFoundationId);
      if (targetF) {
        handleFoundationClick(targetF, e);
        return;
      }
    }

    // If clicked on empty air while selecting beam
    if (selectedPillarId) {
      handleEmptyAirClick(e);
    }
  };


  // 1. Click on a foundation to erect a pillar (Placement Confirmation)
  const handleFoundationClick = (fPart: PlacedPart, e: ThreeEvent<MouseEvent>) => {
    if (!isStep2) return;
    e.stopPropagation();

    const [fx, fy, fz] = fPart.position;
    if (hasPillarAt(fx, fz)) {
      triggerWarning([fx, fy + 1.5, fz], '이미 기둥이 세워진 주춧돌입니다.');
      return; // Pillar already exists here
    }

    // Foundation top snap point
    const topSnap = FOUNDATION_SPECS.getTopSnapPoint([fx, fy, fz]);
    // Pillar center position: top of foundation + half of pillar height
    const pillarCenterY = topSnap[1] + PILLAR_SPECS.height / 2;

    addPart({
      id: `pillar_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      partId: 'pillar_round',
      name: `원목 기둥 (${fx.toFixed(1)}, ${fz.toFixed(1)})`,
      category: 'pillar',
      position: [fx, pillarCenterY, fz],
      rotation: [0, 0, 0],
      scale: [PILLAR_SPECS.radius * 2, PILLAR_SPECS.height, PILLAR_SPECS.radius * 2],
    });
  };

  // Compute beam preview parameters if selectedPillarId and hoveredPillarId exist
  let beamPreview: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    isValid: boolean;
  } | null = null;

  if (isStep2 && selectedPillarId && hoveredPillarId && selectedPillarId !== hoveredPillarId) {
    const p1 = pillars.find((p) => p.id === selectedPillarId);
    const p2 = pillars.find((p) => p.id === hoveredPillarId);

    if (p1 && p2) {
      const p1Top = PILLAR_SPECS.getSnapPoints(p1.position).top;
      const p2Top = PILLAR_SPECS.getSnapPoints(p2.position).top;

      const dx = p2Top[0] - p1Top[0];
      const dz = p2Top[2] - p1Top[2];
      const horizontalDist = Math.sqrt(dx * dx + dz * dz);

      const angleY = -Math.atan2(dz, dx);
      // Beam length clamped to pillar center-to-center distance (사개맞춤: tenon fits within pillar capital)
      const totalLength = horizontalDist;

      const midX = (p1Top[0] + p2Top[0]) / 2;
      // Traditional Sagae-machum: Mortised into pillar capital so beam top aligns with pillar head
      const midY = (p1Top[1] + p2Top[1]) / 2 - BEAM_SPECS.height * 0.2;
      const midZ = (p1Top[2] + p2Top[2]) / 2;

      const alreadyHasBeam = beams.some(
        (b) =>
          Math.abs(b.position[0] - midX) < 0.3 &&
          Math.abs(b.position[2] - midZ) < 0.3 &&
          Math.abs(b.position[1] - midY) < 0.2
      );

      const isValid = horizontalDist >= 0.4 && !alreadyHasBeam;

      beamPreview = {
        position: [midX, midY, midZ],
        rotation: [0, angleY, 0],
        scale: [totalLength, BEAM_SPECS.height, BEAM_SPECS.depth],
        isValid,
      };
    }
  }

  // 2. Click on Pillar Top Point to connect Beam (Placement Confirmation)
  const handlePillarTopClick = (pillar: PlacedPart, e: ThreeEvent<MouseEvent>) => {
    if (!isStep2) return;
    e.stopPropagation();

    if (!selectedPillarId) {
      // First pillar selected
      setSelectedPillarId(pillar.id);
    } else if (selectedPillarId === pillar.id) {
      // Unselect if clicking the same pillar
      setSelectedPillarId(null);
    } else {
      // Second pillar selected -> Attempt to bridge beam between two pillars
      const firstPillar = pillars.find((p) => p.id === selectedPillarId);
      if (!firstPillar) {
        setSelectedPillarId(pillar.id);
        return;
      }

      const p1Top = PILLAR_SPECS.getSnapPoints(firstPillar.position).top;
      const p2Top = PILLAR_SPECS.getSnapPoints(pillar.position).top;

      // Difference vector (B - A)
      const dx = p2Top[0] - p1Top[0];
      const dz = p2Top[2] - p1Top[2];

      const horizontalDist = Math.sqrt(dx * dx + dz * dz);

      if (horizontalDist < 0.4) {
        triggerWarning(
          [(p1Top[0] + p2Top[0]) / 2, p1Top[1] + 0.5, (p1Top[2] + p2Top[2]) / 2],
          '기둥 사이 거리가 너무 가깝습니다.'
        );
        setSelectedPillarId(null);
        return;
      }

      // Calculate Y-axis rotation angle from direction vector (B - A)
      const angleY = -Math.atan2(dz, dx);
      // Beam length clamped to pillar center-to-center distance (사개맞춤: tenon fits within pillar capital)
      const totalLength = horizontalDist;

      // Midpoint between top points mortised into pillar capitals (sagae-machum)
      const midX = (p1Top[0] + p2Top[0]) / 2;
      const midY = (p1Top[1] + p2Top[1]) / 2 - BEAM_SPECS.height * 0.2;
      const midZ = (p1Top[2] + p2Top[2]) / 2;

      // Check if beam already exists between these positions
      const alreadyHasBeam = beams.some(
        (b) =>
          Math.abs(b.position[0] - midX) < 0.3 &&
          Math.abs(b.position[2] - midZ) < 0.3 &&
          Math.abs(b.position[1] - midY) < 0.2
      );

      if (alreadyHasBeam) {
        triggerWarning([midX, midY + 0.5, midZ], '이미 대들보가 연결된 위치입니다.');
        setSelectedPillarId(null);
        return;
      }

      // Add Beam with dynamic rotation and scale (Placement Confirmed)
      addPart({
        id: `beam_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        partId: 'beam_daedeulbo',
        name: `대들보 (${(angleY * (180 / Math.PI)).toFixed(1)}° 결구)`,
        category: 'beam',
        position: [midX, midY, midZ],
        rotation: [0, angleY, 0],
        scale: [totalLength, BEAM_SPECS.height, BEAM_SPECS.depth],
      });

      setStep(2);
      setSelectedPillarId(null);
    }
  };

  // 3. User clicks on empty space while trying to place beam without pillars
  const handleEmptyAirClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isStep2) return;
    if (selectedPillarId) {
      e.stopPropagation();
      triggerWarning(
        [e.point.x, e.point.y + 0.5, e.point.z],
        '기둥이 없는 공중에는 대들보를 놓을 수 없습니다.'
      );
      setSelectedPillarId(null);
    }
  };

  // Find currently hovered foundation for pillar ghost preview
  const hoveredFoundation = foundations.find((f) => f.id === hoveredFoundationId);
  const isHoveredFoundationOccupied = hoveredFoundation
    ? hasPillarAt(hoveredFoundation.position[0], hoveredFoundation.position[2])
    : false;

  return (
    <group>
      {/* Active Raycast Floor to continuously track mouse/touch for Nearest Anchor Snapping in Step 2 */}
      {isStep2 && (
        <mesh
          position={[0, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerMove={handleFloorPointerMove}
          onPointerOut={handleFloorPointerOut}
          onClick={handleFloorClick}
        >
          <planeGeometry args={[50, 50]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      )}

      {/* Red Warning Indicator for Invalid Placement */}
      {invalidAttemptPos && (
        <group position={invalidAttemptPos}>
          <mesh>
            <boxGeometry args={[1.5, 0.4, 0.4]} />
            <meshStandardMaterial
              color="#ff2244"
              emissive="#ff0033"
              emissiveIntensity={0.8}
              transparent
              opacity={0.8}
            />
          </mesh>
          <mesh>
            <boxGeometry args={[1.6, 0.5, 0.5]} />
            <meshBasicMaterial color="#ff6666" wireframe />
          </mesh>
          {warningMessage && (
            <Html center position={[0, 0.6, 0]}>
              <div
                style={{
                  backgroundColor: 'rgba(180, 20, 40, 0.9)',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                ⚠ {warningMessage}
              </div>
            </Html>
          )}
        </group>
      )}

      {/* 1. Ghost Pillar Preview on Hovered Foundation */}
      {isStep2 && !selectedPillarId && hoveredFoundation && (
        (() => {
          const [fx, fy, fz] = hoveredFoundation.position;
          const topSnap = FOUNDATION_SPECS.getTopSnapPoint([fx, fy, fz]);
          const ghostCenterY = topSnap[1] + PILLAR_SPECS.height / 2;
          const ghostColor = isHoveredFoundationOccupied ? '#ff3355' : '#5C8F87';
          const ghostEmissive = isHoveredFoundationOccupied ? '#ff1133' : '#5C8F87';

          return (
            <group position={[fx, ghostCenterY, fz]}>
              {/* Translucent Ghost Cylinder */}
              <mesh>
                <cylinderGeometry
                  args={[
                    PILLAR_SPECS.radius * 0.95,
                    PILLAR_SPECS.radius * 1.05,
                    PILLAR_SPECS.height,
                    24,
                  ]}
                />
                <meshStandardMaterial
                  color={ghostColor}
                  emissive={ghostEmissive}
                  emissiveIntensity={0.55}
                  transparent
                  opacity={0.6}
                  roughness={0.2}
                />
              </mesh>
              {/* Ghost Wireframe Contour */}
              <mesh>
                <cylinderGeometry
                  args={[
                    PILLAR_SPECS.radius * 0.98,
                    PILLAR_SPECS.radius * 1.08,
                    PILLAR_SPECS.height * 1.01,
                    16,
                  ]}
                />
                <meshBasicMaterial
                  color={isHoveredFoundationOccupied ? '#ff9999' : '#EFE7D6'}
                  wireframe
                  transparent
                  opacity={0.75}
                />
              </mesh>

              {/* Status Badge Tag above Ghost Pillar */}
              <Html center position={[0, PILLAR_SPECS.height / 2 + 0.4, 0]}>
                <div
                  style={{
                    backgroundColor: isHoveredFoundationOccupied
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
                  {isHoveredFoundationOccupied
                    ? '기둥 중복 설치 불가 (Occupied)'
                    : '기둥 세우기 (Click to Confirm)'}
                </div>
              </Html>
            </group>
          );
        })()
      )}

      {/* 2. Ghost Beam Preview between Selected Pillar and Hovered Pillar */}
      {beamPreview && (
        <group position={beamPreview.position} rotation={beamPreview.rotation}>
          <mesh>
            <boxGeometry args={beamPreview.scale} />
            <meshStandardMaterial
              color={beamPreview.isValid ? '#5C8F87' : '#ff3355'}
              emissive={beamPreview.isValid ? '#5C8F87' : '#ff1133'}
              emissiveIntensity={0.6}
              transparent
              opacity={0.65}
              roughness={0.2}
            />
          </mesh>
          <mesh>
            <boxGeometry
              args={[
                beamPreview.scale[0] * 1.01,
                beamPreview.scale[1] * 1.02,
                beamPreview.scale[2] * 1.02,
              ]}
            />
            <meshBasicMaterial
              color={beamPreview.isValid ? '#EFE7D6' : '#ff9999'}
              wireframe
              transparent
              opacity={0.75}
            />
          </mesh>

          {/* Status Badge Tag above Ghost Beam */}
          <Html center position={[0, BEAM_SPECS.height / 2 + 0.35, 0]}>
            <div
              style={{
                backgroundColor: beamPreview.isValid
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
              {beamPreview.isValid
                ? '대들보 결구 (Click to Confirm)'
                : '대들보 연결 불가 (Invalid Connection)'}
            </div>
          </Html>
        </group>
      )}

      {/* Interactive Foundation Top Snap Points for Pillar Placement */}
      {foundations.map((fPart) => {
        const [fx, fy, fz] = fPart.position;
        const alreadyPlanted = hasPillarAt(fx, fz);
        const topSnap = FOUNDATION_SPECS.getTopSnapPoint([fx, fy, fz]);

        return (
          <group key={`f_snap_${fPart.id}`} position={topSnap}>
            {isStep2 && (
              <mesh
                position={[0, 0.05, 0]}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredFoundationId(fPart.id);
                }}
                onPointerOut={() => setHoveredFoundationId(null)}
                onClick={(e) => handleFoundationClick(fPart, e)}
              >
                <cylinderGeometry args={[0.26, 0.26, 0.1, 24]} />
                <meshStandardMaterial
                  color={alreadyPlanted ? '#ff4455' : '#5C8F87'}
                  emissive={alreadyPlanted ? '#ff1133' : '#5C8F87'}
                  emissiveIntensity={alreadyPlanted ? 0.3 : 0.6}
                  roughness={0.3}
                  transparent
                  opacity={alreadyPlanted ? 0.4 : 0.85}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Rendered Pillars */}
      {pillars.map((pillar) => {
        const isSelected = selectedPillarId === pillar.id;
        const topSnap = PILLAR_SPECS.getSnapPoints(pillar.position).top;

        return (
          <group key={pillar.id}>
            {/* Main Pillar Cylinder (둥근 기둥) */}
            <mesh
              position={pillar.position}
              castShadow
              receiveShadow
              onClick={(e) => {
                if (e.button === 2 || e.shiftKey) {
                  e.stopPropagation();
                  removePart(pillar.id);
                  return;
                }
                e.stopPropagation();
                useBuildStore.getState().selectObject(pillar.id);
                useBuildStore.getState().selectPart('pillar_round');
              }}
            >
              <cylinderGeometry
                args={[
                  PILLAR_SPECS.radius * 0.95, // slight taper (민흘림)
                  PILLAR_SPECS.radius * 1.05,
                  PILLAR_SPECS.height,
                  24,
                ]}
              />
              <meshStandardMaterial
                color="#5d4332" // Traditional cured Korean pine
                roughness={0.75}
                metalness={0.05}
              />
            </mesh>

            {/* Pillar Top Snap Joint (주두 / 대들보 연결부) */}
            {isStep2 && (
              <mesh
                position={topSnap}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredPillarId(pillar.id);
                }}
                onPointerOut={() => setHoveredPillarId(null)}
                onClick={(e) => handlePillarTopClick(pillar, e)}
              >
                {/* Joint Capital (주두) */}
                <boxGeometry args={[0.38, 0.16, 0.38]} />
                <meshStandardMaterial
                  color={isSelected ? '#C56A3D' : '#5C8F87'}
                  emissive={isSelected ? '#C56A3D' : '#5C8F87'}
                  emissiveIntensity={isSelected ? 0.9 : 0.4}
                  roughness={0.2}
                />
              </mesh>
            )}

            {/* Selection Pulsing Aura */}
            {isSelected && (
              <mesh position={pillar.position}>
                <cylinderGeometry
                  args={[PILLAR_SPECS.radius * 1.2, PILLAR_SPECS.radius * 1.2, PILLAR_SPECS.height * 1.02, 16]}
                />
                <meshBasicMaterial color="#C56A3D" wireframe transparent opacity={0.4} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Rendered Beams (대들보) */}
      {beams.map((beam) => {
        // Fix A: Clamp Z-axis beam depth at gable positions to prevent exterior protrusion
        const rawScale: [number, number, number] = beam.scale || [2, BEAM_SPECS.height, BEAM_SPECS.depth];
        const isZAxisBeam = beam.rotation &&
          Math.abs(Math.abs(beam.rotation[1]) - Math.PI / 2) < 0.15;
        const isAtGable =
          Math.abs(beam.position[0] - buildingMinX) < 0.3 ||
          Math.abs(beam.position[0] - buildingMaxX) < 0.3;
        const clampedDepth = (isZAxisBeam && isAtGable)
          ? Math.min(rawScale[2], PILLAR_SPECS.radius * 2)
          : rawScale[2];
        const renderScale: [number, number, number] = [rawScale[0], rawScale[1], clampedDepth];

        return (
          <group
            key={beam.id}
            position={beam.position}
            rotation={beam.rotation}
            onClick={(e) => {
              if (e.button === 2 || e.shiftKey) {
                e.stopPropagation();
                removePart(beam.id);
                return;
              }
              e.stopPropagation();
              useBuildStore.getState().selectObject(beam.id);
              useBuildStore.getState().selectPart('beam_daedeulbo');
            }}
          >
            {/* Main Beam Timber Box */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={renderScale} />
              <meshStandardMaterial
                color="#6b4c39" // Stately main beam timber
                roughness={0.7}
                metalness={0.08}
              />
            </mesh>

            {/* Beam Decorative End Tenons / Wireframe Guide (Only in STEP 02) */}
            {isStep2 && (
              <mesh>
                <boxGeometry
                  args={[
                    renderScale[0] * 1.01,
                    BEAM_SPECS.height * 1.01,
                    clampedDepth * 1.01,
                  ]}
                />
                <meshBasicMaterial color="rgba(239, 231, 214, 0.12)" wireframe />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Active Step Advancement Check */}
      {/* If user places both pillars and at least one beam in Step 1, or finishes in Step 2 */}
    </group>
  );
};
