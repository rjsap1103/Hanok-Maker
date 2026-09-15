import React from 'react';
import { BuildHeader } from './BuildHeader';
import { ComponentInventory } from './ComponentInventory';
import { ComponentInfo } from './ComponentInfo';
import { BuildToolbar } from './BuildToolbar';
import { MobileBottomSheet } from './MobileBottomSheet';
import { BuildCanvas } from '../HanokScene';
import './BuildExperience.css';

interface BuildExperienceProps {
  onOpenAbout?: () => void;
  onOpenGallery?: () => void;
}

export const BuildExperience: React.FC<BuildExperienceProps> = ({
  onOpenAbout,
  onOpenGallery,
}) => {
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
      {/* 1. Header with Step progress & navigation */}
      <BuildHeader onOpenAbout={onOpenAbout} onOpenGallery={onOpenGallery} />

      {/* 2. Desktop Floating Panels */}
      <div className="desktop-inventory">
        <ComponentInventory />
      </div>

      <div className="desktop-info">
        <ComponentInfo />
      </div>

      {/* 3. Central 3D Canvas */}
      <BuildCanvas />

      {/* 4. Bottom Toolbar */}
      <BuildToolbar />

      {/* 5. Mobile Bottom Sheet */}
      <MobileBottomSheet />
    </div>
  );
};
