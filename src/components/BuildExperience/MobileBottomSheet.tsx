import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HANOK_PARTS } from './partsData';
import { useBuildStore, useUIStore } from '../../store';

export const MobileBottomSheet: React.FC = () => {
  const isBottomSheetOpen = useUIStore((state) => state.isBottomSheetOpen);
  const toggleBottomSheet = useUIStore((state) => state.toggleBottomSheet);
  const selectedPart = useBuildStore((state) => state.selectedPart);
  const selectPart = useBuildStore((state) => state.selectPart);
  const addPart = useBuildStore((state) => state.addPart);
  const setStep = useBuildStore((state) => state.setStep);

  const activePart = HANOK_PARTS.find((p) => p.id === selectedPart) || HANOK_PARTS[0];

  const handleAdd = () => {
    if (activePart.step <= 3) {
      setStep(activePart.step);
      toggleBottomSheet();
      return;
    }

    addPart({
      id: `${activePart.id}_${Date.now()}`,
      partId: activePart.id,
      name: activePart.name,
      category: activePart.category,
      position: [0, activePart.step * 0.5, 0],
      rotation: [0, 0, 0],
    });
    setStep(Math.min(5, activePart.step + 1));
  };

  return (
    <>
      {/* Trigger floating button visible on mobile */}
      <button
        onClick={toggleBottomSheet}
        style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 45,
          padding: '10px 20px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-ivory)',
          display: 'none', // Shown via media query in parent
          boxShadow: 'var(--shadow-soft)',
          fontSize: '0.85rem',
          fontWeight: 600,
        }}
        className="mobile-bottomsheet-trigger"
      >
        {isBottomSheetOpen ? '부품 목록 닫기 ▼' : '부품 인벤토리 열기 ▲'}
      </button>

      {/* Bottom Sheet Modal */}
      <AnimatePresence>
        {isBottomSheetOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                toggleBottomSheet();
              }
            }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '75vh',
              backgroundColor: 'rgba(32, 37, 38, 0.96)',
              backdropFilter: 'blur(24px)',
              borderTop: '1px solid var(--color-border)',
              borderRadius: '24px 24px 0 0',
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
              padding: '1rem 1.25rem 2rem 1.25rem',
            }}
          >
            {/* Grab handle */}
            <div
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: 'rgba(239, 231, 214, 0.3)',
                borderRadius: '2px',
                margin: '0 auto 1rem auto',
              }}
            />

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>부품 인벤토리</h3>
                <span style={{ fontSize: '0.75rem', color: 'rgba(239, 231, 214, 0.5)' }}>
                  드래그하거나 아래로 밀어 닫기
                </span>
              </div>
              <button
                onClick={toggleBottomSheet}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  fontSize: '0.8rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* Horizontal Scroll of Categories */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '0.5rem',
                marginBottom: '1rem',
              }}
            >
              {HANOK_PARTS.map((p) => {
                const isSelected = p.id === activePart.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPart(p.id)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--color-celadon)' : 'rgba(21, 24, 26, 0.7)',
                      color: isSelected ? 'var(--color-ink)' : 'var(--color-ivory)',
                      fontWeight: isSelected ? 600 : 400,
                      border: isSelected ? 'none' : '1px solid var(--color-border)',
                    }}
                  >
                    {p.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Selected Item Detail & Add */}
            <div
              style={{
                backgroundColor: 'rgba(21, 24, 26, 0.6)',
                borderRadius: 'var(--radius-sm)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                marginBottom: '1rem',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--color-celadon)' }}>
                {activePart.name}
              </div>
              <div style={{ color: 'rgba(239, 231, 214, 0.7)' }}>
                {activePart.material} • {activePart.style}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(239, 231, 214, 0.5)' }}>
                {activePart.description}
              </div>
            </div>

            <button
              onClick={handleAdd}
              style={{
                width: '100%',
                padding: '0.9rem',
                backgroundColor: 'var(--color-copper)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                letterSpacing: '0.1em',
              }}
            >
              + 이 부품 추가하기
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
