import { create } from 'zustand';

/**
 * [배치된 한옥 부재 데이터 인터페이스]
 * 3D 씬에 실제로 배치된 주춧돌, 기둥, 대들보, 벽체, 도리, 서까래, 기와 등의 속성을 정의합니다.
 */
export interface PlacedPart {
  id: string;                                // 고유 인스턴스 ID (예: 'pillar_0_0', 'rafter_south_1')
  partId: string;                            // 부재 종류 ID (예: 'pillar_round', 'dori_purin')
  name: string;                              // 부재 한글 이름 (예: '원형 기둥', '남측 주심도리')
  category: string;                          // 부재 대분류 ('foundation', 'pillar', 'beam', 'wall', 'rafter', 'roof')
  type?: string;                             // 부재 상세 타입 ('purlin', 'rafter', 'roofTile', 'door' 등)
  level?: 'eave' | 'middle' | 'ridge';       // 도리 높이 위계 ('eave': 주심도리, 'middle': 중도리, 'ridge': 종도리)
  position: [number, number, number];        // 3D 월드 좌표 [X(좌우), Y(높이), Z(앞뒤)]
  rotation: [number, number, number];        // 오일러 회전각 [X축, Y축, Z축] (라디안 단위)
  scale?: [number, number, number];          // 부재 크기 배율 (기본 [1, 1, 1])
  purlinLevel?: 'eave' | 'middle' | 'ridge'; // 기존 코드 호환용 도리 레벨 필드
  line?: string;                             // 기와골 서까래 결속 식별자 (예: "south-0", "north-1")
}

/**
 * [바닥 재질 타입]
 * - 'wood': 우물마루 (원목 널판)
 * - 'ondol': 온돌 (콩기름 전통 한지 장판)
 * - 'earth': 흙바닥 (다진 황토 마당)
 */
export type FloorMaterialType = 'wood' | 'ondol' | 'earth';

/**
 * [바닥 세부 구역(베이 단위) 셀 데이터]
 * L자형, T자형, ㄷ자형 등 다양한 평면 형태에서 주춧돌로 둘러싸인 각 칸(베이)의 바닥 메쉬 정보입니다.
 */
export interface FloorCellData {
  x0: number;                        // 셀 시작 X 좌표
  x1: number;                        // 셀 끝 X 좌표
  z0: number;                        // 셀 시작 Z 좌표
  z1: number;                        // 셀 끝 Z 좌표
  center: [number, number, number];  // 셀 중심 좌표 [X, Y, Z]
  size: [number, number];            // [셀 가로 폭(width), 세로 깊이(depth)]
  edges: {                           // 외곽 테두리(몰딩) 노출 여부 (인접 셀이 없는 외벽 쪽만 true)
    north: boolean;                  // 북측 (-Z)
    south: boolean;                  // 남측 (+Z)
    west: boolean;                   // 서측 (-X)
    east: boolean;                   // 동측 (+X)
  };
}

/**
 * [자동 생성 바닥 메쉬 데이터 인터페이스]
 * 주춧돌들의 배치를 감지하여 실제로 주춧돌이 놓인 구역에만 정밀하게 생성되는 바닥 판자 정보입니다.
 */
export interface FloorMeshData {
  visible: boolean;                  // 바닥 렌더링 노출 여부
  center: [number, number, number];  // 전체 바닥 판자의 대표 중심 좌표 [X, Y, Z]
  size: [number, number];            // 전체 바닥의 외곽 [가로 폭(width), 세로 깊이(depth)] (미터 단위)
  material?: FloorMaterialType;      // 적용된 바닥 재질 (기본값: 'wood')
  cells?: FloorCellData[];           // 주춧돌이 4개 꼭짓점에 모두 존재하는 유효 베이(칸) 목록
}

/**
 * [3D 모바일 터치 및 인터랙션 모드 정의]
 * - camera: 손가락 1개 드래그 시 카메라 360도 궤도 회전
 * - object_drag: 부품 선택 후 1개 손가락 드래그 시 3D 공간 상에서 부품 이동
 * - pinch_zoom: 두 손가락 간격 확대/축소에 따른 카메라 줌 인/아웃
 * - pan: 두 손가락 동시 이동에 따른 카메라 시점 평행 이동
 */
export type InteractionMode = 'camera' | 'object_drag' | 'pinch_zoom' | 'pan';

/**
 * [한옥 조립 전체 상태 관리 인터페이스]
 */
export interface BuildState {
  currentStep: number;               // 현재 건축 단계 (1:기단/토대, 2:기둥/보, 3:벽체/문, 4:지붕, 5:완성)
  selectedPart: string | null;       // 사용자가 배치하기 위해 선택한 부재 ID
  placedParts: PlacedPart[];         // 3D 씬에 조립된 모든 부품 배열
  floorMesh: FloorMeshData | null;   // 자동 연산된 바닥 메쉬 정보
  selectedObject: string | null;     // 3D 뷰에서 현재 클릭하여 선택한 객체 ID
  isBuilding: boolean;               // 조립 진행 중 모드 여부
  isComplete: boolean;               // 건축 전체 완공 여부 (완공 시 쇼케이스 모달 활성화)

  // 모바일 터치 인터랙션 모드 상태
  interactionMode: InteractionMode;
  // 부품 상세 정보 팝업 모달 상태 (Long Press 제스처 시 활성화)
  isDetailModalOpen: boolean;
  detailModalPartId: string | null;

  // Actions (상태 변경 함수들)
  setStep: (step: number) => void;                                              // 건축 단계 직접 지정
  nextStep: () => void;                                                         // 다음 단계로 이동 (+1)
  prevStep: () => void;                                                         // 이전 단계로 이동 (-1)
  selectPart: (partId: string | null) => void;                                  // 배치할 부재 선택
  addPart: (part: PlacedPart) => void;                                          // 새 부재를 3D 공간에 확정 배치
  removePart: (id: string) => void;                                             // 부재 ID를 찾아 배치 목록에서 삭제
  updatePartPosition: (id: string, position: [number, number, number]) => void; // 부재 좌표 이동
  setFloorMesh: (floorMesh: FloorMeshData | null) => void;                      // 바닥 메쉬 수동 설정
  setFloorMaterial: (material: FloorMaterialType) => void;                      // 바닥 재질(마루/온돌/흙) 교체
  generateFloorFromFoundations: () => boolean;                                  // 주춧돌 기반 바닥 자동 연산 생성
  selectObject: (id: string | null) => void;                                    // 3D 객체 선택/해제
  setInteractionMode: (mode: InteractionMode) => void;                          // 터치 조작 모드 변경
  openDetailModal: (partId: string) => void;                                    // 부재 상세 사양 모달 열기
  closeDetailModal: () => void;                                                 // 부재 상세 사양 모달 닫기
  setIsBuilding: (isBuilding: boolean) => void;                                 // 건축 모드 토글
  setIsComplete: (isComplete: boolean) => void;                                 // 완공 여부 설정
  resetBuild: () => void;                                                       // 전체 공사 초기화
}

// Zustand를 이용해 전역에서 접근 가능한 한옥 건축 상태 스토어 생성
export const useBuildStore = create<BuildState>((set, get) => ({
  currentStep: 1,                       // 1단계(기단/주춧돌)부터 시작
  selectedPart: 'foundation_stone',     // 기본 선택 부재: 주춧돌
  placedParts: [],                      // 배치된 부재 초기값: 빈 배열
  floorMesh: null,                      // 바닥 메쉬 초기값: 없음
  selectedObject: null,                 // 선택된 3D 객체 초기값: 없음
  isBuilding: true,                     // 건축 모드 활성화
  isComplete: false,                    // 초기 완공 상태: 미완공
  interactionMode: 'camera',            // 기본 조작: 카메라 궤도 회전
  isDetailModalOpen: false,             // 상세 모달 닫힘 상태
  detailModalPartId: null,

  setStep: (currentStep) => set({ currentStep }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
  selectPart: (selectedPart) => set({ selectedPart }),
  addPart: (part) => set((state) => ({ placedParts: [...state.placedParts, part] })),
  removePart: (id) => set((state) => ({ placedParts: state.placedParts.filter((p) => p.id !== id) })),
  updatePartPosition: (id, position) =>
    set((state) => ({
      placedParts: state.placedParts.map((p) => (p.id === id ? { ...p, position } : p)),
    })),
  setFloorMesh: (floorMesh) => set({ floorMesh }),
  // 바닥 재질 실시간 변경: 기존 바닥 형태와 크기는 그대로 유지하고 재질만 교체
  setFloorMaterial: (material: FloorMaterialType) =>
    set((state) => ({
      floorMesh: state.floorMesh ? { ...state.floorMesh, material } : null,
    })),

  /**
   * [바닥 자동 생성 함수: generateFloorFromFoundations]
   * 1. 3D 공간에 배치된 모든 주춧돌의 위치를 감지합니다.
   * 2. X축과 Z축 좌표를 각각 정렬 및 군집화(Clustering)하여 직사각형 베이(Bay, 칸) 격자를 구성합니다.
   * 3. 각 베이의 4개 꼭짓점(모서리)에 주춧돌이 실제로 존재하는지 판별합니다.
   *    - 4개 모서리에 주춧돌이 모두 놓인 유효한 구역에만 개별 바닥 메쉬 셀(Cell)을 형성합니다.
   *    - 이를 통해 'ㄱ'자, 'ㄷ'자, 'T'자 등 꺾인 평면 구조에서도 주춧돌이 없는 빈 공간에는 바닥이 깔리지 않습니다.
   * 4. 각 셀별로 인접 셀 유무를 검사하여 외곽 방향으로만 디딤턱/몰딩 테두리를 노출합니다.
   * 5. 계산된 바닥 데이터를 스토어에 안착시키고 2단계(목구조)로 자동 전환합니다.
   */
  generateFloorFromFoundations: () => {
    const foundations = get().placedParts.filter(
      (p) => p.category === 'foundation' || p.partId === 'foundation_stone'
    );
    // 최소 4개 이상의 주춧돌이 놓여야 사각형 바닥을 형성 가능
    if (foundations.length < 4) return false;

    // 1) X, Z 좌표 클러스터링 함수 (0.4m 이내의 좌표는 동일 선상으로 간주하여 오차 보정)
    const clusterCoords = (coords: number[]) => {
      const sorted = [...coords].sort((a, b) => a - b);
      const clusters: number[] = [];
      sorted.forEach((c) => {
        if (clusters.length === 0 || Math.abs(c - clusters[clusters.length - 1]) > 0.4) {
          clusters.push(c);
        }
      });
      return clusters;
    };

    const xs = clusterCoords(foundations.map((f) => f.position[0]));
    const zs = clusterCoords(foundations.map((f) => f.position[2]));

    const FOUNDATION_OVERHANG = 0.9; // 주춧돌 바깥으로 살짝 튀어나오는 디딤턱 여유 치수 (양쪽 합산 0.9m)
    const FLOOR_TOP_Y = 0.505;       // 주춧돌 상단에 밀착되는 바닥 상단면 높이
    const FLOOR_THICKNESS = 0.08;    // 전통 우물마루 널판의 두께 (8cm)
    const HALF_OVERHANG = FOUNDATION_OVERHANG / 2; // 한쪽 모서리당 0.45m 여유

    // 특정 좌표(cx, cz) 반경 0.45m 내에 주춧돌이 존재하는지 확인하는 헬퍼
    const hasFoundationNear = (cx: number, cz: number) => {
      return foundations.some((f) => Math.hypot(f.position[0] - cx, f.position[2] - cz) < 0.45);
    };

    // 2) 격자 칸(Bay) 단위로 4개 꼭짓점에 주춧돌이 완비된 유효 셀 탐색
    interface RawBay {
      x0: number;
      x1: number;
      z0: number;
      z1: number;
    }
    const validBays: RawBay[] = [];

    for (let i = 0; i < xs.length - 1; i++) {
      for (let j = 0; j < zs.length - 1; j++) {
        const x0 = xs[i];
        const x1 = xs[i + 1];
        const z0 = zs[j];
        const z1 = zs[j + 1];

        // 한옥의 한 칸(Bay) 기둥 간격은 보통 1.5m ~ 6.5m 범위입니다.
        const spanX = x1 - x0;
        const spanZ = z1 - z0;
        if (spanX < 0.8 || spanX > 7.0 || spanZ < 0.8 || spanZ > 7.0) {
          continue;
        }

        // 해당 칸의 4개 모서리 좌표 검사
        const corners = [
          [x0, z0],
          [x1, z0],
          [x0, z1],
          [x1, z1],
        ];
        const cornerCount = corners.filter(([cx, cz]) => hasFoundationNear(cx, cz)).length;

        // 4개 꼭짓점에 모두 주춧돌이 존재하면 실제 방/대청으로 바닥이 깔릴 수 있는 유효 베이로 확정
        if (cornerCount >= 4) {
          validBays.push({ x0, x1, z0, z1 });
        }
      }
    }

    // 3) 만약 격자망 분할이 성립하지 않는 단순 배치(예: 사다리꼴 등)인 경우 전체 바운딩 박스를 1개 셀로 폴백
    let floorCells: FloorCellData[] = [];

    let minX = Math.min(...foundations.map((f) => f.position[0]));
    let maxX = Math.max(...foundations.map((f) => f.position[0]));
    let minZ = Math.min(...foundations.map((f) => f.position[2]));
    let maxZ = Math.max(...foundations.map((f) => f.position[2]));

    const overallWidth = maxX - minX + FOUNDATION_OVERHANG;
    const overallDepth = maxZ - minZ + FOUNDATION_OVERHANG;
    const overallCenterX = (minX + maxX) / 2;
    const overallCenterZ = (minZ + maxZ) / 2;

    if (validBays.length > 0) {
      floorCells = validBays.map((bay) => {
        // 인접 셀 존재 여부 판별 (인접 셀이 없으면 외벽 모서리이므로 테두리/디딤턱 적용)
        const hasNorthNeighbor = validBays.some(
          (other) => other !== bay && other.x0 === bay.x0 && other.x1 === bay.x1 && Math.abs(other.z1 - bay.z0) < 0.05
        );
        const hasSouthNeighbor = validBays.some(
          (other) => other !== bay && other.x0 === bay.x0 && other.x1 === bay.x1 && Math.abs(other.z0 - bay.z1) < 0.05
        );
        const hasWestNeighbor = validBays.some(
          (other) => other !== bay && other.z0 === bay.z0 && other.z1 === bay.z1 && Math.abs(other.x1 - bay.x0) < 0.05
        );
        const hasEastNeighbor = validBays.some(
          (other) => other !== bay && other.z0 === bay.z0 && other.z1 === bay.z1 && Math.abs(other.x0 - bay.x1) < 0.05
        );

        // 외곽 모서리는 HALF_OVERHANG(0.45m)만큼 확장, 인접 칸과 맞닿는 내부는 0m 경계선 일치
        const cellMinX = bay.x0 - (hasWestNeighbor ? 0 : HALF_OVERHANG);
        const cellMaxX = bay.x1 + (hasEastNeighbor ? 0 : HALF_OVERHANG);
        const cellMinZ = bay.z0 - (hasNorthNeighbor ? 0 : HALF_OVERHANG);
        const cellMaxZ = bay.z1 + (hasSouthNeighbor ? 0 : HALF_OVERHANG);

        const cellW = cellMaxX - cellMinX;
        const cellD = cellMaxZ - cellMinZ;
        const cellCX = (cellMinX + cellMaxX) / 2;
        const cellCZ = (cellMinZ + cellMaxZ) / 2;

        return {
          x0: bay.x0,
          x1: bay.x1,
          z0: bay.z0,
          z1: bay.z1,
          center: [cellCX, FLOOR_TOP_Y - FLOOR_THICKNESS / 2, cellCZ] as [number, number, number],
          size: [cellW, cellD] as [number, number],
          edges: {
            north: !hasNorthNeighbor,
            south: !hasSouthNeighbor,
            west: !hasWestNeighbor,
            east: !hasEastNeighbor,
          },
        };
      });
    } else {
      // 주춧돌이 4개 미만 격자이거나 불규칙한 경우 전체 바운딩박스 단일 셀 생성
      floorCells = [
        {
          x0: minX,
          x1: maxX,
          z0: minZ,
          z1: maxZ,
          center: [overallCenterX, FLOOR_TOP_Y - FLOOR_THICKNESS / 2, overallCenterZ],
          size: [overallWidth, overallDepth],
          edges: { north: true, south: true, west: true, east: true },
        },
      ];
    }

    const floorMesh: FloorMeshData = {
      visible: true,
      center: [overallCenterX, FLOOR_TOP_Y - FLOOR_THICKNESS / 2, overallCenterZ],
      size: [overallWidth, overallDepth],
      material: 'wood', // 기본 재질: 우물마루(Wood Flooring)
      cells: floorCells, // 실제로 주춧돌이 형성된 칸(Bay)들의 개별 바닥 목록
    };

    // 바닥 생성 완료 후 2단계(목구조 세우기)로 자동 이동 및 기둥 선택
    set({
      floorMesh,
      currentStep: 2,
      selectedPart: 'pillar_round',
    });

    return true;
  },

  selectObject: (selectedObject) => set({ selectedObject }),
  setInteractionMode: (interactionMode) => set({ interactionMode }),
  openDetailModal: (detailModalPartId) => set({ isDetailModalOpen: true, detailModalPartId }),
  closeDetailModal: () => set({ isDetailModalOpen: false, detailModalPartId: null }),
  setIsBuilding: (isBuilding) => set({ isBuilding }),
  setIsComplete: (isComplete) => set({ isComplete }),
  // 전체 초기화 시 기본 1단계 상태로 리셋
  resetBuild: () => set({
    currentStep: 1,
    selectedPart: 'foundation_stone',
    placedParts: [],
    floorMesh: null,
    selectedObject: null,
    isBuilding: true,
    isComplete: false,
    interactionMode: 'camera',
    isDetailModalOpen: false,
    detailModalPartId: null,
  }),
}));
