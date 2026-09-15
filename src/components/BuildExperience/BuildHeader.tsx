import React from 'react';
import { useBuildStore, useUIStore, useRoofStore } from '../../store';
import { getStepCompletionStatus } from './stepCompletion';

interface BuildHeaderProps {
  totalSteps?: number;
  onOpenAbout?: () => void;
  onOpenGallery?: () => void;
}

export const BuildHeader: React.FC<BuildHeaderProps> = ({
  totalSteps = 5,
  onOpenAbout,
  onOpenGallery,
}) => {
  const currentStep = useBuildStore((state) => state.currentStep);
  const placedParts = useBuildStore((state) => state.placedParts);
  const hasRoof = useRoofStore((state) => state.hasRoof);
  const setStep = useBuildStore((state) => state.setStep);
  const setIsComplete = useBuildStore((state) => state.setIsComplete);
  const setIsStarted = useUIStore((state) => state.setIsStarted);

  const completionStatus = getStepCompletionStatus(placedParts, hasRoof);
  const stepCompleted = [
    completionStatus.step1,
    completionStatus.step2,
    completionStatus.step3,
    completionStatus.step4,
    completionStatus.step5,
  ];

  return (
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(21, 24, 26, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)',
        zIndex: 50,
      }}
    >
      {/* Brand / Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => setIsStarted(false)}
          title="처음 화면으로 이동"
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: 'var(--color-ivory)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-celadon)',
              display: 'inline-block',
            }}
          />
          HANOK MAKER
        </button>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(92, 143, 135, 0.15)',
            color: 'var(--color-celadon)',
            border: '1px solid rgba(92, 143, 135, 0.3)',
            letterSpacing: '0.1em',
          }}
        >
          BUILD MODE
        </span>
      </div>

      {/* Step Progress Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              color: 'var(--color-celadon)',
              fontWeight: 600,
            }}
          >
            STEP 0{currentStep} / 0{totalSteps}
          </span>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {Array.from({ length: totalSteps }).map((_, i) => {
              const isCurrent = i + 1 === currentStep;
              const isDone = stepCompleted[i];
              return (
                <div
                  key={i}
                  onClick={() => setStep(i + 1)}
                  title={`STEP 0${i + 1} (${isDone ? '완료' : isCurrent ? '진행중' : '대기'})`}
                  style={{
                    width: isCurrent ? '20px' : '8px',
                    height: '5px',
                    borderRadius: '3px',
                    backgroundColor: isCurrent
                      ? 'var(--color-celadon)'
                      : isDone
                      ? '#4ade80'
                      : 'rgba(239, 231, 214, 0.2)',
                    boxShadow: isDone
                      ? '0 0 6px rgba(74, 222, 128, 0.5)'
                      : isCurrent
                      ? '0 0 8px rgba(92, 143, 135, 0.6)'
                      : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {onOpenGallery && (
          <button
            onClick={onOpenGallery}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'rgba(32, 37, 38, 0.8)',
              color: 'var(--color-ivory)',
              cursor: 'pointer',
              letterSpacing: '0.05em',
              transition: 'background 0.2s',
            }}
          >
            AI Gallery
          </button>
        )}
        {onOpenAbout && (
          <button
            onClick={onOpenAbout}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'rgba(32, 37, 38, 0.8)',
              color: 'var(--color-ivory)',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            About
          </button>
        )}
        {import.meta.env.DEV && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              id="dev-btn-reset"
              onClick={() => (window as any).__hanokDev?.resetEmpty()}
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#bbb',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
              }}
              title="초기화"
            >
              [DEV] 초기화
            </button>
            <button
              id="dev-btn-step1-2"
              onClick={() => (window as any).__hanokDev?.loadStep1TwoFoundations()}
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(255,100,100,0.15)',
                color: '#ff9999',
                borderRadius: '4px',
                border: '1px solid rgba(255,100,100,0.3)',
                cursor: 'pointer',
              }}
              title="주춧돌 2개 배치 (경고 테스트)"
            >
              [DEV] 주춧돌 2개
            </button>
            <button
              id="dev-btn-step1"
              onClick={() => (window as any).__hanokDev?.loadStep1FourFoundations()}
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(92,143,135,0.2)',
                color: 'var(--color-celadon)',
                borderRadius: '4px',
                border: '1px solid rgba(92,143,135,0.4)',
                cursor: 'pointer',
              }}
              title="주춧돌 4개 배치"
            >
              [DEV] 주춧돌 4개
            </button>
            <button
              id="dev-btn-step1-6"
              onClick={() => (window as any).__hanokDev?.loadStep1SixFoundations()}
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(92,143,135,0.35)',
                color: 'var(--color-celadon)',
                borderRadius: '4px',
                border: '1px solid rgba(92,143,135,0.6)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="주춧돌 6개 배치"
            >
              [DEV] 주춧돌 6개
            </button>
            <button
              id="dev-btn-step2"
              onClick={() => (window as any).__hanokDev?.loadStep2Box()}
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(197,106,61,0.2)',
                color: 'var(--color-copper)',
                borderRadius: '4px',
                border: '1px solid rgba(197,106,61,0.4)',
                cursor: 'pointer',
              }}
              title="STEP 2 박스 기둥·대들보"
            >
              [DEV] STEP 2 박스
            </button>
            <button
              id="dev-btn-step3"
              onClick={() => (window as any).__hanokDev?.loadStep3Box()}
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(115,149,174,0.2)',
                color: '#7395ae',
                borderRadius: '4px',
                border: '1px solid rgba(115,149,174,0.4)',
                cursor: 'pointer',
              }}
              title="STEP 3 4면 방 구조"
            >
              [DEV] STEP 3 박스
            </button>
            <button
              id="dev-btn-step4"
              onClick={() => (window as any).__hanokDev?.loadStep4Roof()}
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(224,169,109,0.25)',
                color: '#e0a96d',
                borderRadius: '4px',
                border: '1px solid rgba(224,169,109,0.5)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="STEP 4 서까래·기와 지붕"
            >
              [DEV] STEP 4 지붕
            </button>
            <button
              id="dev-btn-6pillar-house"
              onClick={() => (window as any).__hanokDev?.load6PillarRoof()}
              style={{
                padding: '4px 8px',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(92,143,135,0.25)',
                color: 'var(--color-celadon)',
                borderRadius: '4px',
                border: '1px solid rgba(92,143,135,0.5)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title="6기둥 2베이 완성 구조"
            >
              [DEV] 6기둥 집
            </button>
          </div>
        )}
        <button
          onClick={() => setIsComplete(true)}
          style={{
            padding: '6px 16px',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: 'var(--color-copper)',
            color: '#fff',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            boxShadow: '0 4px 12px rgba(197, 106, 61, 0.3)',
          }}
        >
          완성 미리보기
        </button>
      </div>
    </header>
  );
};
