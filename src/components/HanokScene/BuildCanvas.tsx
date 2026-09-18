import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useCameraStore, useBuildStore, useRoofStore } from '../../store';
import { CameraController } from './CameraController';
import { MobileTouchController } from './MobileTouchController';
import { Step1FoundationManager } from './Step1FoundationManager';
import { HanokFloorManager } from './HanokFloorManager';
import { Step2TimberManager } from './Step2TimberManager';
import { Step3WallManager } from './Step3WallManager';
import { Step4RoofManager } from './Step4RoofManager';
import { DEMO_BOX_ROOM_PARTS, DEMO_PRESET_PARTS, DEMO_FOUNDATIONS_6, DEMO_6_PILLAR_HOUSE_PARTS, DEMO_L_SHAPE_HOUSE_PARTS } from '../../store/devPresets';

// Optional dev helper mounted to window in development mode
if (typeof window !== 'undefined') {
  (window as any).__hanokDev = {
    loadLShapeRoof: () => {
      useRoofStore.getState().setRoofParams({ roofWidth: 10.8, roofDepth: 10.2 });
      useBuildStore.setState({
        placedParts: DEMO_L_SHAPE_HOUSE_PARTS.filter((p) => p.category !== 'beam' || !p.id.startsWith('purlin_')),
        currentStep: 4,
        selectedPart: 'dori_purin',
        floorMesh: {
          visible: true,
          center: [-1, 0.505 - 0.04, 1.5],
          size: [8.9, 8.9],
          material: 'wood',
          cells: [
            { x0: -4, x1: 0, z0: -2, z1: 2, center: [-2, 0.465, 0], size: [4.9, 4.9], edges: { north: true, south: false, west: true, east: false } },
            { x0: 0, x1: 4, z0: -2, z1: 2, center: [2, 0.465, 0], size: [4.9, 4.9], edges: { north: true, south: true, west: false, east: true } },
            { x0: -4, x1: 0, z0: 2, z1: 6, center: [-2, 0.465, 4], size: [4.9, 4.9], edges: { north: false, south: true, west: true, east: true } },
          ],
        },
      });
      useRoofStore.getState().createRoof();
    },
    loadBoxRoom: () => {
      useBuildStore.setState({
        placedParts: DEMO_BOX_ROOM_PARTS,
        currentStep: 3,
        selectedPart: 'wall_earth',
        floorMesh: {
          visible: true,
          center: [0, 0.505 - 0.04, 0],
          size: [4.9, 4.9],
          material: 'wood',
        },
      });
    },
    loadShowcase: () => {
      useBuildStore.setState({
        placedParts: DEMO_PRESET_PARTS,
        currentStep: 3,
        selectedPart: 'window_lattice',
      });
    },
    resetEmpty: () => {
      useRoofStore.getState().removeRoof();
      useBuildStore.getState().resetBuild();
    },
    loadStep1Box: () => {
      useRoofStore.getState().removeRoof();
      useBuildStore.setState({
        placedParts: DEMO_BOX_ROOM_PARTS.filter((p) => p.category === 'foundation'),
        currentStep: 1,
        selectedPart: 'foundation_stone',
        floorMesh: null,
      });
    },
    loadStep1TwoFoundations: () => {
      useRoofStore.getState().removeRoof();
      useBuildStore.setState({
        placedParts: DEMO_BOX_ROOM_PARTS.filter((p) => p.category === 'foundation').slice(0, 2),
        currentStep: 1,
        selectedPart: 'foundation_stone',
        floorMesh: null,
      });
    },
    loadStep1FourFoundations: () => {
      useRoofStore.getState().removeRoof();
      useBuildStore.setState({
        placedParts: DEMO_BOX_ROOM_PARTS.filter((p) => p.category === 'foundation'),
        currentStep: 1,
        selectedPart: 'foundation_stone',
        floorMesh: null,
      });
    },
    loadStep1SixFoundations: () => {
      useRoofStore.getState().removeRoof();
      useBuildStore.setState({
        placedParts: DEMO_FOUNDATIONS_6,
        currentStep: 1,
        selectedPart: 'foundation_stone',
        floorMesh: null,
      });
    },
    loadStep2Box: () => {
      useRoofStore.getState().removeRoof();
      useBuildStore.setState({
        placedParts: DEMO_BOX_ROOM_PARTS.filter((p) => p.category === 'foundation' || p.category === 'pillar' || p.category === 'beam'),
        currentStep: 2,
        selectedPart: 'beam_daedeulbo',
        floorMesh: {
          visible: true,
          center: [0, 0.505 - 0.04, 0],
          size: [4.9, 4.9],
          material: 'wood',
        },
      });
    },
    loadStep3Box: () => {
      useRoofStore.getState().removeRoof();
      useBuildStore.setState({
        placedParts: DEMO_BOX_ROOM_PARTS,
        currentStep: 3,
        selectedPart: 'wall_earth',
        floorMesh: {
          visible: true,
          center: [0, 0.505 - 0.04, 0],
          size: [4.9, 4.9],
          material: 'wood',
        },
      });
    },
    loadStep4Roof: () => {
      useRoofStore.getState().setRoofParams({ roofWidth: 6.8, roofDepth: 6.2 });
      useBuildStore.setState({
        placedParts: DEMO_BOX_ROOM_PARTS.filter((p) => p.category !== 'beam' || !p.id.startsWith('purlin_')),
        currentStep: 4,
        selectedPart: 'dori_purin',
        floorMesh: {
          visible: true,
          center: [0, 0.505 - 0.04, 0],
          size: [4.9, 4.9],
          material: 'wood',
        },
      });
      useRoofStore.getState().createRoof();
    },
    load6PillarRoof: () => {
      useRoofStore.getState().setRoofParams({ roofWidth: 10.8, roofDepth: 6.2 });
      useBuildStore.setState({
        placedParts: DEMO_6_PILLAR_HOUSE_PARTS.filter((p) => p.category !== 'beam' || !p.id.startsWith('purlin_')),
        currentStep: 4,
        selectedPart: 'dori_purin',
        floorMesh: {
          visible: true,
          center: [0, 0.505 - 0.04, 0],
          size: [8.9, 4.9],
          material: 'wood',
        },
      });
      useRoofStore.getState().createRoof();
    },
    // 3레벨 도리(주심도리 2개, 중도리 2개, 종도리 1개)를 모두 배치하는 헬퍼
    loadAllPurlinsFor4Pillars: () => {
      const purlins: any[] = [
        { id: 'purlin_eave_south', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'eave', purlinLevel: 'eave', name: '남측 주심도리', position: [0, 3.35, 2], rotation: [0, 0, Math.PI / 2] },
        { id: 'purlin_eave_north', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'eave', purlinLevel: 'eave', name: '북측 주심도리', position: [0, 3.35, -2], rotation: [0, 0, Math.PI / 2] },
        { id: 'purlin_middle_south', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'middle', purlinLevel: 'middle', name: '남측 중도리', position: [0, 3.7952, 1], rotation: [0, 0, Math.PI / 2] },
        { id: 'purlin_middle_north', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'middle', purlinLevel: 'middle', name: '북측 중도리', position: [0, 3.7952, -1], rotation: [0, 0, Math.PI / 2] },
        { id: 'purlin_ridge', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'ridge', purlinLevel: 'ridge', name: '용마루 종도리', position: [0, 4.2405, 0], rotation: [0, 0, Math.PI / 2] },
      ];
      useBuildStore.setState((state) => ({
        placedParts: [...state.placedParts.filter((p) => !p.id.startsWith('purlin_')), ...purlins],
      }));
    },
    loadAllPurlinsFor6Pillars: () => {
      const purlins: any[] = [
        { id: 'purlin_eave_south', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'eave', purlinLevel: 'eave', name: '남측 주심도리', position: [0, 3.35, 2], rotation: [0, 0, Math.PI / 2] },
        { id: 'purlin_eave_north', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'eave', purlinLevel: 'eave', name: '북측 주심도리', position: [0, 3.35, -2], rotation: [0, 0, Math.PI / 2] },
        { id: 'purlin_middle_south', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'middle', purlinLevel: 'middle', name: '남측 중도리', position: [0, 3.7952, 1], rotation: [0, 0, Math.PI / 2] },
        { id: 'purlin_middle_north', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'middle', purlinLevel: 'middle', name: '북측 중도리', position: [0, 3.7952, -1], rotation: [0, 0, Math.PI / 2] },
        { id: 'purlin_ridge', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'ridge', purlinLevel: 'ridge', name: '용마루 종도리', position: [0, 4.2405, 0], rotation: [0, 0, Math.PI / 2] },
      ];
      useBuildStore.setState((state) => ({
        placedParts: [...state.placedParts.filter((p) => !p.id.startsWith('purlin_')), ...purlins],
      }));
    },
    // 도리 3개, 서까래 3개만 수동 클릭 배치된 상태 재현 헬퍼
    loadManualFewPurlinsRafters: () => {
      useRoofStore.getState().setRoofParams({ roofWidth: 6.8, roofDepth: 6.2 });
      useBuildStore.setState({
        placedParts: DEMO_BOX_ROOM_PARTS.filter((p) => p.category !== 'beam' || !p.id.startsWith('purlin_')),
        currentStep: 4,
        selectedPart: 'dori_purin',
        floorMesh: {
          visible: true,
          center: [0, 0.505 - 0.04, 0],
          size: [4.9, 4.9],
          material: 'wood',
        },
      });
      useRoofStore.getState().createRoof();
      const manualParts: any[] = [
        { id: 'purlin_eave_south', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'eave', purlinLevel: 'eave', name: '남측 주심도리', position: [0, 3.35, 2], rotation: [0, 0, Math.PI / 2] },
        { id: 'purlin_middle_south', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'middle', purlinLevel: 'middle', name: '남측 중도리', position: [0, 3.7952, 1], rotation: [0, 0, Math.PI / 2] },
        { id: 'purlin_ridge', partId: 'dori_purin', category: 'beam', type: 'purlin', level: 'ridge', purlinLevel: 'ridge', name: '용마루 종도리', position: [0, 4.2405, 0], rotation: [0, 0, Math.PI / 2] },
        { id: 'rafter_south_2', partId: 'rafter_seokkarae', category: 'rafter', type: 'rafter', name: '남측 서까래 3', position: [-1.7, 3.8, 1.5], rotation: [0.73, 0, 0] },
        { id: 'rafter_south_8', partId: 'rafter_seokkarae', category: 'rafter', type: 'rafter', name: '남측 서까래 9', position: [0, 3.8, 1.5], rotation: [0.73, 0, 0] },
        { id: 'rafter_south_14', partId: 'rafter_seokkarae', category: 'rafter', type: 'rafter', name: '남측 서까래 15', position: [1.7, 3.8, 1.5], rotation: [0.73, 0, 0] },
      ];
      useBuildStore.setState((s) => ({
        placedParts: [...s.placedParts.filter((p) => p.type !== 'purlin' && p.type !== 'rafter' && !p.id.startsWith('purlin_') && !p.id.startsWith('rafter_')), ...manualParts],
      }));
    },
    // 도리 삭제 테스트 헬퍼 (종도리 또는 중도리 등 삭제)
    removePurlin: (purlinId: string) => {
      useBuildStore.getState().removePart(purlinId);
    },
    // 서까래 및 도리 상태 정보 조회 헬퍼
    getRafterPurlinInfo: () => {
      const parts = useBuildStore.getState().placedParts;
      const purlins = parts.filter((p) => p.type === 'purlin' || p.purlinLevel || p.id.startsWith('purlin_'));
      const rafters = parts.filter((p) => p.type === 'rafter' || p.id.startsWith('rafter_'));
      return {
        purlinCount: purlins.length,
        purlins: purlins.map((p) => ({ id: p.id, level: p.level || p.purlinLevel, pos: p.position })),
        rafterCount: rafters.length,
        southRafters: rafters.filter((r) => r.id.includes('south') || r.position[2] > 0).length,
        northRafters: rafters.filter((r) => r.id.includes('north') || r.position[2] < 0).length,
      };
    },
    // 부품 상세 정보 모달 열기 헬퍼 (테스트용)
    openDetailModal: (partId: string) => {
      useBuildStore.getState().openDetailModal(partId);
    },
    // 카메라 프리셋 직접 변경 헬퍼 (front, side, isometric 등)
    setCameraPreset: (preset: 'default' | 'front' | 'side' | 'top' | 'isometric' | 'interior') => {
      useCameraStore.getState().setPreset(preset);
    },
    saveCanvasSnapshot: async (filename: string) => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const dataUrl = canvas.toDataURL('image/png');
      try {
        await fetch('/api/save-screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, image: dataUrl }),
        });
      } catch (e) {
        console.error('Failed to save snapshot:', e);
      }
      return dataUrl;
    },
  };
}

export const BuildCanvas: React.FC = () => {
  const autoRotate = useCameraStore((state) => state.autoRotate);
  const currentStep = useBuildStore((state) => state.currentStep);
  const isCinematicMode = useCameraStore((state) => state.isCinematicMode);
  const cinematicStageName = useCameraStore((state) => state.cinematicStageName);
  const stopCinematicMode = useCameraStore((state) => state.stopCinematicMode);
  const interactionMode = useBuildStore((state) => state.interactionMode);
  const selectedObject = useBuildStore((state) => state.selectedObject);
  const placedParts = useBuildStore((state) => state.placedParts);
  const controlsRef = React.useRef<any>(null);

  // STEP 4 도리 완성도 상태 계산
  const hasSouthEave = placedParts.some(
    (p) => p.id === 'purlin_eave_south' || (p.type === 'purlin' && (p.level === 'eave' || p.purlinLevel === 'eave') && p.position[2] > 0)
  );
  const hasNorthEave = placedParts.some(
    (p) => p.id === 'purlin_eave_north' || (p.type === 'purlin' && (p.level === 'eave' || p.purlinLevel === 'eave') && p.position[2] < 0)
  );
  const hasEavePurlins = hasSouthEave && hasNorthEave;

  const hasRidgePurlin = placedParts.some(
    (p) => p.id === 'purlin_ridge' || (p.type === 'purlin' && (p.level === 'ridge' || p.purlinLevel === 'ridge'))
  );
  const hasMiddlePurlins = placedParts.some(
    (p) => p.id === 'purlin_middle_south' || (p.type === 'purlin' && (p.level === 'middle' || p.purlinLevel === 'middle'))
  );
  const hasAllPurlins = hasEavePurlins && hasRidgePurlin && hasMiddlePurlins;

  // ESC 키로 시네마틱 모드 종료
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCinematicMode) {
        stopCinematicMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCinematicMode, stopCinematicMode]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        backgroundColor: 'var(--color-ink)',
      }}
    >
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        camera={{ position: [12, 11, 12], fov: 42 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Daylight 및 시네마틱 자연광 연출 */}
        <ambientLight intensity={isCinematicMode ? 0.9 : 0.7} color={isCinematicMode ? '#fffdf7' : '#ffffff'} />
        <directionalLight
          position={isCinematicMode ? [14, 25, 18] : [12, 22, 15]}
          intensity={isCinematicMode ? 1.6 : 1.3}
          color={isCinematicMode ? '#fff8eb' : '#ffffff'}
          castShadow
        />
        <directionalLight
          position={[-10, 8, -10]}
          intensity={isCinematicMode ? 0.6 : 0.4}
          color={isCinematicMode ? '#88b5af' : '#5C8F87'}
        />

        {/* Dynamic Camera Controller reacting to toolbar presets & Cinematic Mode */}
        <CameraController controlsRef={controlsRef} />

        {/* Mobile Touch Interactions (1-finger rotate/drag, 2-finger pinch/pan, tap, long-press) */}
        <MobileTouchController controlsRef={controlsRef} />

        {/* Traditional Architectural Grid Floor (시네마틱 모드에서는 소거하여 몰입감 극대화) */}
        {!isCinematicMode && (
          <Grid
            position={[0, -0.01, 0]}
            args={[30, 30]}
            cellSize={1}
            cellThickness={1}
            cellColor="#5C8F87"
            sectionSize={5}
            sectionThickness={1.5}
            sectionColor="#EFE7D6"
            fadeDistance={25}
            fadeStrength={1.5}
          />
        )}

        {/* STEP 1: Foundation (주춧돌) Placer with snap highlight */}
        <Step1FoundationManager />

        {/* Dynamic Wooden Floor (대청/우물마루) automatically generated from foundation bounding box */}
        <HanokFloorManager />

        {/* STEP 2: Pillar & Beam Snap Connections with Error Highlights */}
        <Step2TimberManager />

        {/* STEP 3: Wall & Traditional Openings (Lattice Window / Doors) with Anchor Snap */}
        <Step3WallManager />

        {/* STEP 4 & 5: Parametric Rafters (서까래) and Black Giwa Tiles (기와) */}
        <Step4RoofManager />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[0, 0, 0]}
          enabled={interactionMode !== 'object_drag'}
          autoRotate={isCinematicMode ? false : autoRotate}
          autoRotateSpeed={1.0}
          maxPolarAngle={Math.PI / 2 + 0.05}
          minDistance={3}
          maxDistance={40}
        />
      </Canvas>

      {/* 시네마틱 모드 전용 영화관 레터박스 및 헤드업 디스플레이 (HUD) */}
      {isCinematicMode ? (
        <>
          {/* 상단 시네마틱 레터박스 & 현재 연출 단계 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100vw',
              height: '60px',
              backgroundColor: 'rgba(10, 12, 14, 0.85)',
              backdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 2rem',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#e07a5f',
                  boxShadow: '0 0 10px #e07a5f',
                }}
              />
              <span
                style={{
                  fontSize: '0.78rem',
                  letterSpacing: '0.2em',
                  fontWeight: 700,
                  color: 'var(--color-copper)',
                  textTransform: 'uppercase',
                }}
              >
                CINEMATIC SHOWCASE
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-ivory)', fontWeight: 500, letterSpacing: '0.05em' }}>
                {cinematicStageName}
              </span>
            </div>

            {/* 일반 모드로 복귀 버튼 */}
            <button
              onClick={stopCinematicMode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'var(--color-ivory)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(224, 122, 95, 0.3)';
                e.currentTarget.style.borderColor = 'var(--color-copper)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <span>일반 모드로 복귀</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                ESC
              </span>
            </button>
          </div>

          {/* 하단 시네마틱 레터박스 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100vw',
              height: '40px',
              backgroundColor: 'rgba(10, 12, 14, 0.85)',
              backdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              letterSpacing: '0.12em',
              color: 'rgba(239, 231, 214, 0.5)',
            }}
          >
            TRADITIONAL KOREAN HANOK ARCHITECTURE • CINEMATIC FLIGHT
          </div>
        </>
      ) : (
        /* Quick Guide Overlay reacting to currentStep (일반 모드일 때만 표시) */
        <div
          style={{
            position: 'absolute',
            top: '74px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(32, 37, 38, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 18px',
            fontSize: '0.8rem',
            color: 'var(--color-ivory)',
            pointerEvents: 'none',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-soft)',
            maxWidth: '90vw',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              color:
                currentStep === 1
                  ? 'var(--color-celadon)'
                  : currentStep === 2
                  ? 'var(--color-copper)'
                  : currentStep === 3
                  ? '#7395ae'
                  : '#e0a96d',
              fontWeight: 700,
              borderRight: '1px solid var(--color-border)',
              paddingRight: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            STEP 0{currentStep}
          </span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentStep === 1
              ? '마우스/터치 이동 시 Ghost 주춧돌이 표시되며 탭(클릭) 시 배치됩니다. (손가락 1개: 카메라/이동, 2개: 줌/팬, 길게 누름: 부품 정보)'
              : currentStep === 2
              ? '주춧돌 위 Ghost 기둥을 세우고, 두 기둥 주두를 터치해 대들보를 연결하세요. (선택된 부재는 1손가락으로 드래그 이동 가능)'
              : currentStep === 3
              ? '기둥 사이 Anchor로 이동하면 부재 형태의 Ghost가 스냅되며, 탭 시 배치가 확정됩니다.'
              : !hasEavePurlins
              ? '대들보/기둥 머리 상단의 청자색 안착점을 터치하여 남/북 주심도리를 먼저 얹으세요.'
              : !hasAllPurlins
              ? '중도리와 종도리(용마루) 결구 포인트를 터치하여 지붕 물매 골조를 완성하세요.'
              : '도리 3열 완성! 서까래 결구 포인트가 활성화되었습니다. (서까래 탭하여 얹기)'}
          </span>
          {/* 현재 터치 인터랙션 모드 뱃지 (모바일 조작 상태 시각화) */}
          {selectedObject && (
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(224, 122, 95, 0.25)',
                border: '1px solid var(--color-copper)',
                color: 'var(--color-copper)',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              부품 이동 모드 (1손가락 드래그)
            </span>
          )}
        </div>
      )}
    </div>
  );
};
