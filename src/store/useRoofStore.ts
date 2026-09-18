import { create } from 'zustand';

/**
 * [지붕 파라미터 규격 인터페이스]
 * 사용자가 슬라이더 및 버튼으로 조절하는 지붕의 모든 기하학적 치수 데이터입니다.
 */
export interface RoofParams {
  roofWidth: number;      // 지붕 가로 전체 폭 (도리/용마루 X축 방향, 미터 단위)
  roofDepth: number;      // 지붕 앞뒤 전체 깊이 (대들보/경사면 Z축 방향, 미터 단위)
  tileCount: number;      // 지붕 가로 방향 기와골 및 서까래 배치 열(Column) 개수
  roofAngle: number;      // 지붕 경사면 물매 각도 (60분법 각도, e.g. 24도)
  rafterPitch: number;    // 서까래 사이의 수평 간격 (미터 단위, 기본 약 35cm)
  eavesOverhang: number;  // 기둥 바깥으로 비바람을 막기 위해 돌출되는 처마 내밀기 길이 (기본 75cm)
  isHalfCutMode?: boolean;// 반반 절개 모드: 전면(남측) 서까래 및 가구 골조를 노출할지 여부 (기본 true)
  roofLayoutType?: 'straight' | 'intersecting'; // L자형 평면 지붕 가구 형식: 'straight' (방법 1: 날개채 단축 일자형), 'intersecting' (방법 2: 직각 직교 교차 지붕 및 합각 골기와)
}

/**
 * [지붕 상태 관리 스토어 인터페이스]
 * 3D 뷰에서 지붕의 렌더링 여부와 일괄 시공 트리거 이벤트들을 관리합니다.
 */
export interface RoofState {
  hasRoof: boolean;            // 지붕 부재들이 씬에 활성화되어 있는지 여부
  params: RoofParams;          // 현재 설정된 지붕 치수 파라미터 모음

  batchPurlinsTrigger: number; // 도리(주심도리/중도리/종도리) 일괄 시공을 트리거하는 카운터
  batchRaftersTrigger: number; // 서까래 전체 일괄 시공을 트리거하는 카운터
  batchTilesTrigger: number;   // 전통 기와골 전체 일괄 시공을 트리거하는 카운터

  // Actions (상태 변경 함수들)
  setRoofParams: (params: Partial<RoofParams>) => void; // 지붕 파라미터를 실시간 업데이트하는 함수
  createRoof: () => void;                              // 지붕을 활성화(생성)하는 함수
  removeRoof: () => void;                              // 지붕을 비활성화(제거)하는 함수
  toggleRoof: () => void;                              // 지붕 활성화 여부를 토글(반전)하는 함수
  triggerBatchPurlins: () => void;                     // 도리 일괄 얹기 신호를 발생시키는 함수
  triggerBatchRafters: () => void;                     // 서까래 일괄 얹기 신호를 발생시키는 함수
  triggerBatchTiles: () => void;                       // 기와 일괄 시공 신호를 발생시키는 함수
}

// Zustand를 이용해 전역에서 접근 가능한 지붕 상태 관리 스토어 생성
export const useRoofStore = create<RoofState>((set) => ({
  hasRoof: false,             // 초기에는 지붕이 없는 상태로 시작
  batchPurlinsTrigger: 0,     // 도리 일괄 시공 트리거 초기값
  batchRaftersTrigger: 0,     // 서까래 일괄 시공 트리거 초기값
  batchTilesTrigger: 0,       // 기와 일괄 시공 트리거 초기값

  // 기본 권장 전통 한옥 비례 수치 설정
  params: {
    roofWidth: 6.8,           // 기본 지붕 폭 6.8m
    roofDepth: 6.2,           // 기본 지붕 깊이 6.2m
    tileCount: 22,            // 기본 기와 22열
    roofAngle: 24,            // 기본 전통 안착 물매 각도 24도
    rafterPitch: 0.35,        // 기본 서까래 간격 35cm
    eavesOverhang: 0.75,      // 기본 처마 내밀기 75cm
    isHalfCutMode: true,      // 기본적으로 전면 가구 골조 전시(반반 절개) 활성화
    roofLayoutType: 'intersecting', // L자형 평면 시 기본적으로 직교 교차 지붕(방법 2) 적용 (토글 가능)
  },

  // 새 파라미터가 들어오면 기존 값에 병합(Merge)하여 업데이트
  setRoofParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams },
    })),

  createRoof: () => set({ hasRoof: true }),
  removeRoof: () => set({ hasRoof: false }),
  toggleRoof: () => set((state) => ({ hasRoof: !state.hasRoof })),
  // 트리거 카운터를 +1 증가시켜 useEffect에서 신호를 감지하고 일괄 시공을 수행하도록 함
  triggerBatchPurlins: () => set((state) => ({ batchPurlinsTrigger: state.batchPurlinsTrigger + 1 })),
  triggerBatchRafters: () => set((state) => ({ batchRaftersTrigger: state.batchRaftersTrigger + 1 })),
  triggerBatchTiles: () => set((state) => ({ batchTilesTrigger: state.batchTilesTrigger + 1 })),
}));

