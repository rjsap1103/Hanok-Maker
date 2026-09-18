import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBuildStore } from '../../store';
import { HANOK_PARTS } from './partsData';

/**
 * [모바일 부품 상세 정보 모달 (PartDetailModal)]
 * -------------------------------------------------------------
 * 모바일 환경에서 3D 부품을 500ms 이상 롱 프레스(Long Press)했을 때
 * 해당 부품의 전통 한옥 건축학적 가치와 상세 스펙을 보여주는 반응형 팝업 모달입니다.
 */
export const PartDetailModal: React.FC = () => {
  const isDetailModalOpen = useBuildStore((state) => state.isDetailModalOpen);
  const detailModalPartId = useBuildStore((state) => state.detailModalPartId);
  const closeDetailModal = useBuildStore((state) => state.closeDetailModal);
  const placedParts = useBuildStore((state) => state.placedParts);
  const removePart = useBuildStore((state) => state.removePart);

  // 현재 모달 대상 부품 찾기 (placedParts의 instanceId 또는 partId 매칭)
  const targetPlacedPart = placedParts.find((p) => p.id === detailModalPartId);
  const basePartId = targetPlacedPart?.partId || detailModalPartId || 'pillar_round';
  const partData = HANOK_PARTS.find((p) => p.id === basePartId) || HANOK_PARTS[0];

  const handleRemove = () => {
    if (targetPlacedPart) {
      removePart(targetPlacedPart.id);
    }
    closeDetailModal();
  };

  return (
    <AnimatePresence>
      {isDetailModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            boxSizing: 'border-box',
          }}
        >
          {/* 배경 오버레이 (클릭 시 닫기) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetailModal}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(10, 12, 14, 0.75)',
              backdropFilter: 'blur(12px)',
            }}
          />

          {/* 모달 카드 본체 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              backgroundColor: 'rgba(32, 37, 38, 0.96)',
              backdropFilter: 'blur(24px)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              color: 'var(--color-ivory)',
              zIndex: 91,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {/* 상단 뱃지 및 닫기 버튼 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    fontWeight: 700,
                    color: 'var(--color-copper)',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  STEP 0{partData.step} • {partData.category.toUpperCase()}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#ffffff', margin: 0 }}>
                  {targetPlacedPart ? targetPlacedPart.name : partData.name}
                </h3>
              </div>
              <button
                onClick={closeDetailModal}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'var(--color-ivory)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* 전통 건축 사양 명세표 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                backgroundColor: 'rgba(21, 24, 26, 0.6)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(239, 231, 214, 0.08)',
                fontSize: '0.8rem',
              }}
            >
              <div>
                <span style={{ color: 'rgba(239, 231, 214, 0.45)', display: 'block', fontSize: '0.7rem' }}>
                  재질 (Material)
                </span>
                <span style={{ color: 'var(--color-ivory)', fontWeight: 500 }}>
                  {partData.material}
                </span>
              </div>
              <div>
                <span style={{ color: 'rgba(239, 231, 214, 0.45)', display: 'block', fontSize: '0.7rem' }}>
                  결구 양식 (Style)
                </span>
                <span style={{ color: 'var(--color-celadon)', fontWeight: 500 }}>
                  {partData.style}
                </span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'rgba(239, 231, 214, 0.45)', display: 'block', fontSize: '0.7rem' }}>
                  표준 규격 (Dimensions)
                </span>
                <span style={{ color: 'var(--color-ivory)', fontWeight: 500 }}>
                  {partData.dimensions}
                </span>
              </div>
              {targetPlacedPart && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'rgba(239, 231, 214, 0.45)', display: 'block', fontSize: '0.7rem' }}>
                    배치 좌표 (Position)
                  </span>
                  <span style={{ color: 'var(--color-copper)', fontWeight: 500 }}>
                    X: {targetPlacedPart.position[0].toFixed(2)}m, Y: {targetPlacedPart.position[1].toFixed(2)}m, Z: {targetPlacedPart.position[2].toFixed(2)}m
                  </span>
                </div>
              )}
            </div>

            {/* 건축 해설 설명 */}
            <div style={{ fontSize: '0.82rem', color: 'rgba(239, 231, 214, 0.75)', lineHeight: 1.55 }}>
              {partData.description}
            </div>

            {/* 모바일 조작 가이드 안내 팁 */}
            <div
              style={{
                backgroundColor: 'rgba(92, 143, 135, 0.15)',
                border: '1px solid rgba(92, 143, 135, 0.3)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: 'var(--color-celadon)',
                lineHeight: 1.4,
              }}
            >
              💡 <strong>터치 팁</strong>: 1손가락 드래그로 3D 위치를 이동할 수 있고, 2손가락 핀치로 확대/축소할 수 있습니다.
            </div>

            {/* 하단 액션 버튼 (닫기 및 필요시 부품 삭제) */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              {targetPlacedPart && (
                <button
                  onClick={handleRemove}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: 'rgba(224, 122, 95, 0.2)',
                    border: '1px solid rgba(224, 122, 95, 0.5)',
                    color: '#ff7b6b',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  부품 제거
                </button>
              )}
              <button
                onClick={closeDetailModal}
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  backgroundColor: 'var(--color-celadon)',
                  border: 'none',
                  color: 'var(--color-ink)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
