import React from 'react';
import { useCameraStore, type CameraPreset } from '../../store';

/**
 * 카메라 시점 프리셋 정의
 * - default: 기본 대각선 조망 뷰
 * - front: 정면 입면 뷰 (벽체와 창호 정렬 확인용)
 * - top: 상단 조감도 뷰 (배치 대칭 및 지붕 폭 확인용)
 * - isometric: 45도 등각 투영 뷰 (가구식 목구조 입체 감상용)
 * - interior: 한옥 방 내부 시점 (마루와 서까래 천장 감상용)
 */
const PRESETS: { id: CameraPreset; label: string }[] = [
  { id: 'default', label: 'DEFAULT' },
  { id: 'front', label: 'FRONT' },
  { id: 'top', label: 'TOP' },
  { id: 'isometric', label: 'ISOMETRIC' },
  { id: 'interior', label: 'INTERIOR' },
];

/**
 * [하단 카메라 툴바 컴포넌트]
 * 화면 하단에 플로팅 형태로 떠서 다양한 카메라 시점(정면, 탑, 아이소메트릭 등) 전환과
 * 자동 360도 회전 및 시점 초기화를 손쉽게 제어하는 툴바입니다.
 */
export const BuildToolbar: React.FC = () => {
  // 카메라 전역 상태 관리 스토어에서 상태와 제어 함수들을 가져옴
  const currentPreset = useCameraStore((state) => state.currentPreset); // 현재 선택된 시점
  const setPreset = useCameraStore((state) => state.setPreset);         // 시점 변경 함수
  const resetCamera = useCameraStore((state) => state.resetCamera);     // 시점 초기화 함수
  const autoRotate = useCameraStore((state) => state.autoRotate);       // 360도 자동 회전 여부
  const toggleAutoRotate = useCameraStore((state) => state.toggleAutoRotate); // 자동 회전 토글 함수

  return (
    <nav
      style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)', // 화면 하단 정중앙에 배치
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        backgroundColor: 'rgba(32, 37, 38, 0.9)', // 반투명 다크 배경
        backdropFilter: 'blur(20px)',               // 글래스모피즘 블러 효과
        padding: '0.5rem 1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-soft)',
        zIndex: 40,
        maxWidth: '90vw',
        overflowX: 'auto', // 모바일이나 작은 창에서 가로 스크롤 허용
      }}
    >
      {/* 툴바 라벨: CAMERA */}
      <span
        style={{
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          color: 'rgba(239, 231, 214, 0.4)',
          textTransform: 'uppercase',
          paddingRight: '0.5rem',
          borderRight: '1px solid var(--color-border)',
          whiteSpace: 'nowrap',
        }}
      >
        CAMERA
      </span>

      {/* 5가지 카메라 시점 버튼 목록 렌더링 */}
      {PRESETS.map((p) => {
        const isActive = currentPreset === p.id;
        return (
          <button
            key={p.id}
            id={`camera-preset-${p.id}`}
            onClick={() => setPreset(p.id)}
            style={{
              padding: '6px 14px',
              fontSize: '0.75rem',
              fontWeight: isActive ? 600 : 400,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: isActive ? 'var(--color-celadon)' : 'transparent', // 활성화 시 청자빛 하이라이트
              color: isActive ? 'var(--color-ink)' : 'var(--color-ivory)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              border: isActive ? '1px solid var(--color-celadon)' : '1px solid transparent',
            }}
          >
            {p.label}
          </button>
        );
      })}

      {/* 시점 버튼과 보조 컨트롤 사이의 세로 구분선 */}
      <div
        style={{
          width: '1px',
          height: '18px',
          backgroundColor: 'var(--color-border)',
          margin: '0 0.25rem',
        }}
      />

      {/* 카메라 위치 초기화 버튼 */}
      <button
        id="camera-reset-btn"
        onClick={resetCamera}
        title="Reset Camera to default view"
        style={{
          padding: '6px 14px',
          fontSize: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'transparent',
          color: 'var(--color-ivory)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}
      >
        ↺ Reset Camera
      </button>

      {/* 360도 한옥 전경 자동 회전 감상 토글 버튼 */}
      <button
        id="camera-autorotate-btn"
        onClick={toggleAutoRotate}
        style={{
          padding: '6px 14px',
          fontSize: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          backgroundColor: autoRotate ? 'rgba(92, 143, 135, 0.2)' : 'transparent',
          color: autoRotate ? 'var(--color-celadon)' : 'var(--color-ivory)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.2s',
        }}
      >
        {autoRotate ? '⟳ 회전 중' : '⟳ 회전'}
      </button>
    </nav>
  );
};
