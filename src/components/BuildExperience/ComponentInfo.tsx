import React from 'react';
import { motion } from 'framer-motion';
import { HANOK_PARTS } from './partsData';
import { useBuildStore, useRoofStore } from '../../store';

export const ComponentInfo: React.FC = () => {
  const selectedPartId = useBuildStore((state) => state.selectedPart);
  const selectedObject = useBuildStore((state) => state.selectedObject);
  const floorMesh = useBuildStore((state) => state.floorMesh);
  const setFloorMaterial = useBuildStore((state) => state.setFloorMaterial);
  const currentStep = useBuildStore((state) => state.currentStep);
  const placedParts = useBuildStore((state) => state.placedParts);
  const addPart = useBuildStore((state) => state.addPart);
  const setStep = useBuildStore((state) => state.setStep);
  const setIsComplete = useBuildStore((state) => state.setIsComplete);

  const { hasRoof, params, setRoofParams, createRoof, removeRoof } = useRoofStore();

  const isFloorSelected = selectedObject === 'floorMesh';

  const selectedPart = HANOK_PARTS.find((p) => p.id === selectedPartId) || HANOK_PARTS[0];

  const isRoofStep = currentStep === 4 || currentStep === 5 || selectedPart.category === 'rafter' || selectedPart.category === 'roof';

  const handleAddPart = () => {
    // In STEP 1, 2, 3: selecting the part prepares the 3D scene snap/anchor interaction
    if (selectedPart.step <= 3) {
      setStep(selectedPart.step);
      return;
    }

    if (isRoofStep) {
      createRoof();
      return;
    }

    addPart({
      id: `${selectedPart.id}_${Date.now()}`,
      partId: selectedPart.id,
      name: selectedPart.name,
      category: selectedPart.category,
      position: [0, selectedPart.step * 0.5, 0],
      rotation: [0, 0, 0],
    });
    setStep(Math.min(5, selectedPart.step + 1));
  };

  const handleCompleteHanok = () => {
    if (!hasRoof) {
      createRoof();
    }
    setIsComplete(true);
  };

  return (
    <aside
      style={{
        position: 'absolute',
        top: '80px',
        right: '1.5rem',
        width: '320px',
        backgroundColor: 'rgba(32, 37, 38, 0.88)',
        backdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-soft)',
        zIndex: 40,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        maxHeight: 'calc(100vh - 160px)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div>
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--color-copper)',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          {isFloorSelected
            ? 'Floor Customization'
            : isRoofStep
            ? 'Parametric Roof Generator'
            : 'Structural Specification'}
        </div>
        <h2
          style={{
            fontSize: '1.15rem',
            fontWeight: 600,
            color: 'var(--color-ivory)',
            marginTop: '4px',
            lineHeight: 1.3,
          }}
        >
          {isFloorSelected
            ? '바닥 (Floor)'
            : isRoofStep
            ? '전통 지붕 가구 파라미터'
            : selectedPart.name}
        </h2>
      </div>

      {/* FLOOR CUSTOMIZATION PANEL */}
      {isFloorSelected ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Material Selection Header */}
          <div>
            <span
              style={{
                color: 'rgba(239, 231, 214, 0.6)',
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '8px',
                letterSpacing: '0.05em',
              }}
            >
              재질 선택 (Floor Material)
            </span>

            {/* Material Selection Options (3 options) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(
                [
                  {
                    id: 'wood',
                    label: '마루 (Wood Flooring)',
                    sub: '원목 우물마루 / 대청마루 널판',
                    color: '#68472b',
                  },
                  {
                    id: 'ondol',
                    label: '온돌 (Ondol)',
                    sub: '콩기름 먹인 전통 한지 장판 구들',
                    color: '#d49e48',
                  },
                  {
                    id: 'earth',
                    label: '흙바닥 (Earthen Floor)',
                    sub: '다진 전통 황토 마당 바닥',
                    color: '#7a5538',
                  },
                ] as const
              ).map((option) => {
                const isCurrent = (floorMesh?.material || 'wood') === option.id;
                return (
                  <button
                    key={option.id}
                    id={`btn-floor-mat-${option.id}`}
                    onClick={() => setFloorMaterial(option.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isCurrent
                        ? 'rgba(92, 143, 135, 0.28)'
                        : 'rgba(21, 24, 26, 0.65)',
                      border: isCurrent
                        ? '2px solid var(--color-celadon)'
                        : '1px solid rgba(239, 231, 214, 0.1)',
                      color: isCurrent ? 'var(--color-celadon)' : 'var(--color-ivory)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '3px',
                          backgroundColor: option.color,
                          display: 'inline-block',
                          border: '1px solid rgba(255,255,255,0.3)',
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                          {option.label}
                        </div>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: isCurrent
                              ? 'rgba(92, 143, 135, 0.9)'
                              : 'rgba(239, 231, 214, 0.45)',
                          }}
                        >
                          {option.sub}
                        </div>
                      </div>
                    </div>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--color-celadon)',
                        }}
                      >
                        ✓ 선택됨
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Floor Specifications Info Box */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              backgroundColor: 'rgba(21, 24, 26, 0.5)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(239, 231, 214, 0.08)',
              fontSize: '0.78rem',
            }}
          >
            <div>
              <span style={{ color: 'rgba(239, 231, 214, 0.45)', display: 'block', fontSize: '0.68rem' }}>
                바닥 규격 (Floor Dimensions)
              </span>
              <span style={{ color: 'var(--color-ivory)', fontWeight: 500 }}>
                {floorMesh ? `${floorMesh.size[0].toFixed(2)}m × ${floorMesh.size[1].toFixed(2)}m` : '0m × 0m'}
              </span>
            </div>
            <div>
              <span style={{ color: 'rgba(239, 231, 214, 0.45)', display: 'block', fontSize: '0.68rem' }}>
                중심 좌표 (Center Coordinates)
              </span>
              <span style={{ color: 'var(--color-celadon)', fontWeight: 500 }}>
                {floorMesh ? `(${floorMesh.center[0].toFixed(2)}, ${floorMesh.center[2].toFixed(2)})` : '(0, 0)'}
              </span>
            </div>
          </div>

          <p
            style={{
              fontSize: '0.75rem',
              color: 'rgba(239, 231, 214, 0.65)',
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            ✓ 재질을 변경하면 바닥 형태와 크기는 그대로 유지되며 색상 및 고유 질감이 즉시 반영됩니다.
          </p>
        </div>
      ) : isRoofStep ? (
        /* PARAMETRIC CONTROLS FOR STEP 4 & 5 */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            backgroundColor: 'rgba(21, 24, 26, 0.5)',
            padding: '1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(239, 231, 214, 0.08)',
            fontSize: '0.8rem',
          }}
        >
          {/* 1. Roof Width */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'rgba(239, 231, 214, 0.6)' }}>Roof Width (지붕 폭)</span>
              <span style={{ color: 'var(--color-celadon)', fontWeight: 600 }}>{params.roofWidth.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min="4.5"
              max="12.0"
              step="0.1"
              value={params.roofWidth}
              onChange={(e) => setRoofParams({ roofWidth: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-celadon)', cursor: 'pointer' }}
            />
          </div>

          {/* 2. Roof Depth */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'rgba(239, 231, 214, 0.6)' }}>Roof Depth (지붕 깊이)</span>
              <span style={{ color: 'var(--color-celadon)', fontWeight: 600 }}>{params.roofDepth.toFixed(1)}m</span>
            </div>
            <input
              type="range"
              min="3.5"
              max="10.0"
              step="0.1"
              value={params.roofDepth}
              onChange={(e) => setRoofParams({ roofDepth: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--color-celadon)', cursor: 'pointer' }}
            />
          </div>

          {/* 3. Tile Density (Col Count) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'rgba(239, 231, 214, 0.6)' }}>Tile Count (기와 열 수)</span>
              <span style={{ color: 'var(--color-copper)', fontWeight: 600 }}>{params.tileCount}열</span>
            </div>
            <input
              type="range"
              min="8"
              max="32"
              step="2"
              value={params.tileCount}
              onChange={(e) => setRoofParams({ tileCount: parseInt(e.target.value, 10) })}
              style={{ width: '100%', accentColor: 'var(--color-copper)', cursor: 'pointer' }}
            />
          </div>

          {/* 4. Roof Pitch Angle */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'rgba(239, 231, 214, 0.6)' }}>Roof Angle (물매 각도)</span>
              <span style={{ color: 'var(--color-copper)', fontWeight: 600 }}>{params.roofAngle}°</span>
            </div>
            <input
              type="range"
              min="16"
              max="35"
              step="1"
              value={params.roofAngle}
              onChange={(e) => setRoofParams({ roofAngle: parseInt(e.target.value, 10) })}
              style={{ width: '100%', accentColor: 'var(--color-copper)', cursor: 'pointer' }}
            />
          </div>

          <div style={{ fontSize: '0.72rem', color: 'rgba(239, 231, 214, 0.5)', lineHeight: 1.4, marginTop: '2px' }}>
            ℹ 좌우 대칭(Symmetric Dual Slope)으로 서까래와 암/수기와가 고성능 InstancedMesh로 즉시 연산됩니다.
          </div>
        </div>
      ) : (
        /* STANDARD SPECIFICATION FOR STEPS 1~3 */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            backgroundColor: 'rgba(21, 24, 26, 0.5)',
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
              {selectedPart.material}
            </span>
          </div>
          <div>
            <span style={{ color: 'rgba(239, 231, 214, 0.45)', display: 'block', fontSize: '0.7rem' }}>
              결구 및 양식 (Style)
            </span>
            <span style={{ color: 'var(--color-celadon)', fontWeight: 500 }}>
              {selectedPart.style}
            </span>
          </div>
          <div>
            <span style={{ color: 'rgba(239, 231, 214, 0.45)', display: 'block', fontSize: '0.7rem' }}>
              치수 (Dimensions)
            </span>
            <span style={{ color: 'var(--color-ivory)' }}>{selectedPart.dimensions}</span>
          </div>
        </div>
      )}

      {/* Description */}
      {!isFloorSelected && (
        <p
          style={{
            fontSize: '0.78rem',
            color: 'rgba(239, 231, 214, 0.7)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {isRoofStep
            ? hasRoof
              ? '✓ 지붕과 서까래가 설치되었습니다. 3D 뷰에서 지붕을 Shift+클릭하여 언제든 제거할 수 있습니다.'
              : '아래 버튼을 눌러 파라미터 기반 지붕을 생성하세요.'
            : currentStep === 1
            ? '주춧돌을 4개 이상 배치한 뒤 [다음 단계]를 누르면 바닥(대청마루)이 결구되며 STEP 02로 이동합니다.'
            : selectedPart.description}
        </p>
      )}

      {/* Buttons */}
      {!isFloorSelected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
          {isRoofStep ? (
            <>
              <motion.button
                onClick={() => {
                  if (hasRoof) {
                    removeRoof();
                  } else {
                    createRoof();
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: hasRoof ? 'rgba(180, 50, 50, 0.3)' : 'var(--color-celadon)',
                  color: hasRoof ? '#ff8888' : 'var(--color-ink)',
                  border: hasRoof ? '1px solid rgba(255, 100, 100, 0.4)' : 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {hasRoof ? '지붕 제거 (Shift+클릭)' : '지붕 자동 생성 (Generate Roof)'}
              </motion.button>

              {/* Complete Button */}
              <motion.button
                onClick={handleCompleteHanok}
                whileHover={{ scale: 1.02, backgroundColor: '#d97746' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: 'var(--color-copper)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(197, 106, 61, 0.4)',
                  transition: 'all 0.2s',
                }}
              >
                🎉 한옥 결구 완성 (FINISH & VIEW)
              </motion.button>
            </>
          ) : currentStep === 1 ? (
          /* STEP 01 토대 완료 및 STEP 02(기둥) 전환 버튼 */
          (() => {
            const foundations = placedParts.filter(
              (p) => p.category === 'foundation' || p.partId === 'foundation_stone'
            );
            const count = foundations.length;
            const canProceed = count >= 4;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {!canProceed && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#e07a5f',
                      backgroundColor: 'rgba(224, 122, 95, 0.15)',
                      border: '1px solid rgba(224, 122, 95, 0.3)',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  >
                    ⚠ 주춧돌을 최소 4개 배치해주세요 (현재 {count}개)
                  </div>
                )}
                <motion.button
                  id="btn-step1-next"
                  disabled={!canProceed}
                  onClick={() => {
                    useBuildStore.getState().generateFloorFromFoundations();
                  }}
                  whileHover={canProceed ? { scale: 1.02, backgroundColor: 'var(--color-copper)' } : {}}
                  whileTap={canProceed ? { scale: 0.98 } : {}}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    backgroundColor: canProceed ? 'var(--color-celadon)' : 'rgba(255, 255, 255, 0.08)',
                    color: canProceed ? 'var(--color-ink)' : 'rgba(239, 231, 214, 0.3)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    borderRadius: 'var(--radius-sm)',
                    cursor: canProceed ? 'pointer' : 'not-allowed',
                    border: 'none',
                    boxShadow: canProceed ? '0 4px 16px rgba(92, 143, 135, 0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  다음 단계 (기둥 결구) →
                </motion.button>
              </div>
            );
          })()
        ) : (
          <motion.button
            onClick={handleAddPart}
            whileHover={{ scale: 1.02, backgroundColor: 'var(--color-copper)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '0.85rem',
              backgroundColor: 'var(--color-celadon)',
              color: 'var(--color-ink)',
              fontSize: '0.9rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 4px 16px rgba(92, 143, 135, 0.3)',
              transition: 'all 0.2s',
            }}
          >
            + ADD COMPONENT
          </motion.button>
        )}
      </div>
      )}
    </aside>
  );
};

