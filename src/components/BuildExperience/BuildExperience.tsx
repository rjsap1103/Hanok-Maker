import React, { useState, useEffect } from 'react';
import { useCameraStore } from '../../store';
import { BuildHeader } from './BuildHeader';
import { ComponentInventory } from './ComponentInventory';
import { ComponentInfo } from './ComponentInfo';
import { BuildToolbar } from './BuildToolbar';
import { MobileBottomSheet } from './MobileBottomSheet';
import { PartDetailModal } from './PartDetailModal';
import { BuildCanvas } from '../HanokScene';
import { CsgDebugTestModal } from '../Debug/CsgDebugTestModal';
import './BuildExperience.css';

interface BuildExperienceProps {
  onOpenAbout?: () => void;
  onOpenGallery?: () => void;
}

export const BuildExperience: React.FC<BuildExperienceProps> = ({
  onOpenAbout,
  onOpenGallery,
}) => {
  const isCinematicMode = useCameraStore((state) => state.isCinematicMode);
  const [isCsgModalOpen, setIsCsgModalOpen] = useState(false);

  useEffect(() => {
    (window as any).__openCsgModal = () => setIsCsgModalOpen(true);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--color-ink)',
      }}
    >
      {/* 1. Header with Step progress & navigation (시네마틱 모드 시 숨김) */}
      {!isCinematicMode && (
        <BuildHeader onOpenAbout={onOpenAbout} onOpenGallery={onOpenGallery} />
      )}

      {/* 2. Desktop Floating Panels (시네마틱 모드 시 숨김) */}
      {!isCinematicMode && (
        <>
          <div className="desktop-inventory">
            <ComponentInventory />
          </div>

          <div className="desktop-info">
            <ComponentInfo />
          </div>
        </>
      )}

      {/* 3. Central 3D Canvas */}
      <BuildCanvas />

      {/* 4. Bottom Toolbar (시네마틱 모드 시 숨김) */}
      {!isCinematicMode && <BuildToolbar />}

      {/* 5. Mobile Bottom Sheet (시네마틱 모드 시 숨김) */}
      {!isCinematicMode && <MobileBottomSheet />}

      {/* 6. 모바일 부품 롱 프레스(Long Press) 상세 정보 모달 */}
      <PartDetailModal />

      {/* 7. CSG 불리언 절단 연산 디버그 모달 (별도 테스트용) */}
      {isCsgModalOpen && (
        <CsgDebugTestModal onClose={() => setIsCsgModalOpen(false)} />
      )}
    </div>
  );
};
