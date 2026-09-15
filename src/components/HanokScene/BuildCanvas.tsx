import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useCameraStore, useBuildStore, useRoofStore } from '../../store';
import { CameraController } from './CameraController';
import { Step1FoundationManager } from './Step1FoundationManager';
import { HanokFloorManager } from './HanokFloorManager';
import { Step2TimberManager } from './Step2TimberManager';
import { Step3WallManager } from './Step3WallManager';
import { Step4RoofManager } from './Step4RoofManager';
import { DEMO_BOX_ROOM_PARTS, DEMO_PRESET_PARTS, DEMO_FOUNDATIONS_6, DEMO_6_PILLAR_HOUSE_PARTS } from '../../store/devPresets';

// Optional dev helper mounted to window in development mode
if (typeof window !== 'undefined') {
  (window as any).__hanokDev = {
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
  const controlsRef = React.useRef<any>(null);

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
        <ambientLight intensity={0.7} />
        <directionalLight position={[12, 22, 15]} intensity={1.3} castShadow />
        <directionalLight position={[-10, 8, -10]} intensity={0.4} color="#5C8F87" />

        {/* Dynamic Camera Controller reacting to toolbar presets */}
        <CameraController controlsRef={controlsRef} />

        {/* Traditional Architectural Grid Floor */}
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
          autoRotate={autoRotate}
          autoRotateSpeed={1.0}
          maxPolarAngle={Math.PI / 2 + 0.05}
          minDistance={3}
          maxDistance={40}
        />
      </Canvas>

      {/* Quick Guide Overlay reacting to currentStep */}
      <div
        style={{
          position: 'absolute',
          top: '74px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(32, 37, 38, 0.9)',
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
          }}
        >
          STEP 0{currentStep}
        </span>
        <span>
          {currentStep === 1
            ? '마우스/터치 이동 시 반투명 Ghost 주춧돌(초록: 배치 가능, 빨강: 중복)이 표시되며, 클릭(Confirm) 시 배치됩니다. (4개 이상 배치 후 다음 단계 진행)'
            : currentStep === 2
            ? '주춧돌 위 반투명 Ghost 기둥 확인 후 클릭하여 세우고, 두 기둥 주두를 클릭해 Ghost 대들보를 확정 연결하세요.'
            : currentStep === 3
            ? '기둥 사이 Anchor로 이동하면 부재 형태의 Ghost(초록: 유효, 빨강: 벽체 필요)가 스냅되며, 클릭 시 배치가 확정됩니다.'
            : '우측 파라메트릭 컨트롤을 조정하여 서까래와 기와를 자동 생성하세요. (Shift+클릭 시 지붕 제거)'}
        </span>
      </div>
    </div>
  );
};
