import React from 'react';
import { motion } from 'framer-motion';
import { HANOK_PARTS } from './partsData';
import { useBuildStore, useUIStore, useRoofStore } from '../../store';
import { isPartCompleted } from './stepCompletion';

export const ComponentInventory: React.FC = () => {
  const selectedPart = useBuildStore((state) => state.selectedPart);
  const selectPart = useBuildStore((state) => state.selectPart);
  const setStep = useBuildStore((state) => state.setStep);
  const placedParts = useBuildStore((state) => state.placedParts);
  const hasRoof = useRoofStore((state) => state.hasRoof);
  const isInventoryOpen = useUIStore((state) => state.isInventoryOpen);
  const toggleInventory = useUIStore((state) => state.toggleInventory);

  const handleSelect = (partId: string, partStep: number) => {
    selectPart(partId);
    setStep(partStep);
  };

  return (
    <aside
      style={{
        position: 'absolute',
        top: '80px',
        left: '1.5rem',
        width: isInventoryOpen ? '280px' : '48px',
        maxHeight: 'calc(100vh - 160px)',
        backgroundColor: 'rgba(32, 37, 38, 0.88)',
        backdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-soft)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Header of Panel */}
      <div
        style={{
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {isInventoryOpen && (
          <div>
            <h3
              style={{
                fontSize: '0.85rem',
                letterSpacing: '0.15em',
                fontWeight: 700,
                color: 'var(--color-ivory)',
                textTransform: 'uppercase',
              }}
            >
              Components
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'rgba(239, 231, 214, 0.5)' }}>
              한옥 결구 부재 목록
            </span>
          </div>
        )}
        <button
          onClick={toggleInventory}
          title={isInventoryOpen ? '패널 접기' : '패널 펼치기'}
          style={{
            padding: '4px 8px',
            fontSize: '0.75rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-celadon)',
            cursor: 'pointer',
          }}
        >
          {isInventoryOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Parts List */}
      {isInventoryOpen && (
        <div
          style={{
            overflowY: 'auto',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          {HANOK_PARTS.map((part) => {
            const isSelected = selectedPart === part.id;
            const isCompleted = isPartCompleted(part.id, placedParts, hasRoof);
            return (
              <motion.div
                key={part.id}
                onClick={() => handleSelect(part.id, part.step)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isSelected
                    ? 'rgba(92, 143, 135, 0.25)'
                    : isCompleted
                    ? 'rgba(92, 143, 135, 0.12)'
                    : 'rgba(21, 24, 26, 0.6)',
                  border: isSelected
                    ? '1px solid var(--color-celadon)'
                    : isCompleted
                    ? '1px solid rgba(92, 143, 135, 0.4)'
                    : '1px solid rgba(239, 231, 214, 0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.2s, border 0.2s',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: isSelected ? 'var(--color-celadon)' : isCompleted ? 'var(--color-celadon)' : 'rgba(239, 231, 214, 0.4)',
                      letterSpacing: '0.1em',
                      fontWeight: 600,
                    }}
                  >
                    STEP 0{part.step} • {part.category.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'var(--color-ivory)',
                      marginTop: '2px',
                    }}
                  >
                    {part.name}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isCompleted ? (
                    <span
                      title="설치 완료"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-celadon)',
                        color: 'var(--color-ink)',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                      }}
                    >
                      ✓
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: isSelected ? 'var(--color-celadon)' : 'rgba(239, 231, 214, 0.3)',
                      }}
                    >
                      {isSelected ? '●' : '○'}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </aside>
  );
};
