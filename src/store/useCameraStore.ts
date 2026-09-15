import { create } from 'zustand';

/**
 * 카메라 프리셋 모드 식별자
 * - default: 45도 얼짱각도 기본 뷰
 * - front: 정면 입면 뷰
 * - top: 수직 상공 평면 뷰 (지붕 및 전체 배치 감상)
 * - isometric: 3차원 투각 원근 뷰
 * - interior: 한옥 대청/방 내부 시점
 */
export type CameraPreset = 'default' | 'front' | 'top' | 'isometric' | 'interior';

export interface CameraTransform {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

/**
 * [카메라 프리셋 상대 오프셋(Offset) 및 시야각(FOV) 설정]
 * 건물의 3차원 바운딩 박스 중심(Center)을 기준으로
 * 카메라가 어느 거리와 각도에 위치할지 정의하는 상대 벡터입니다.
 */
export interface CameraOffsetConfig {
  offset: [number, number, number]; // 중심점으로부터의 상대 거리 [dx, dy, dz]
  fov: number;                      // 카메라 화각
  fixedTargetY?: number;            // 필요시 타깃 Y 오버라이드
}

export const CAMERA_OFFSET_CONFIGS: Record<CameraPreset, CameraOffsetConfig> = {
  // 기본 뷰: 한옥의 전경과 높이를 조화롭게 감상할 수 있는 비스듬한 45도 시점
  default: {
    offset: [12, 9, 12],
    fov: 42,
  },
  // 정면 뷰: 수평선상에서 한옥의 정면 외관을 단정하게 정렬하여 관찰
  front: {
    offset: [0, 0, 18],
    fov: 40,
  },
  // 평면(Top) 뷰: 지붕 바로 위 수직 상공(Y축)에서 직하향으로 내려다보아 완벽한 정중앙 평면도 제공
  // ※ z에 0.001을 미세하게 주어 Three.js LookAt 짐벌락(Gimbal Lock) 방지
  top: {
    offset: [0, 24, 0.001],
    fov: 38,
  },
  // 등각(Isometric) 뷰: 건축 모형 다이어그램 느낌의 안정적인 투시도 시점
  isometric: {
    offset: [15, 13, 15],
    fov: 35,
  },
  // 실내 뷰: 방이나 대청마루 내부에서 서까래와 대들보 구조를 올려다보는 시점
  interior: {
    offset: [0, 0.2, 2.5],
    fov: 65,
  },
};

// 하위 호환용 고정 프리셋 설정 (건물이 없을 때 기본값으로 사용)
export const CAMERA_PRESET_CONFIGS: Record<CameraPreset, CameraTransform> = {
  default: {
    position: [12, 11, 12],
    target: [0, 1.8, 0],
    fov: 42,
  },
  front: {
    position: [0, 1.8, 18],
    target: [0, 1.8, 0],
    fov: 40,
  },
  top: {
    position: [0, 24, 0.001],
    target: [0, 1.8, 0],
    fov: 38,
  },
  isometric: {
    position: [15, 14.8, 15],
    target: [0, 1.8, 0],
    fov: 35,
  },
  interior: {
    position: [0, 2, 2],
    target: [0, 2, -2],
    fov: 65,
  },
};

export interface CameraState {
  currentPreset: CameraPreset;
  autoRotate: boolean;

  // Actions
  setPreset: (preset: CameraPreset) => void;
  resetCamera: () => void;
  setAutoRotate: (autoRotate: boolean) => void;
  toggleAutoRotate: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  currentPreset: 'default',
  autoRotate: false,

  setPreset: (currentPreset) => set({ currentPreset }),
  resetCamera: () => set({ currentPreset: 'default' }),
  setAutoRotate: (autoRotate) => set({ autoRotate }),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
}));

