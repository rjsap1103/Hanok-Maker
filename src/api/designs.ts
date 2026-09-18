import { useBuildStore, type PlacedPart } from '../store';
import { useRoofStore } from '../store/useRoofStore';

/**
 * [한옥 설계 데이터 저장 페이로드 구조 (요구사항 4-3 고정)]
 */
export interface HanokDesignData {
  foundation: PlacedPart[];
  pillars: PlacedPart[];
  beams: PlacedPart[];
  walls: PlacedPart[];
  doors: PlacedPart[];
  rafters: PlacedPart[];
  roofTiles: PlacedPart[];
  // 부가 옵션 정보 (지붕 파라미터 및 바닥 메쉬 보존)
  roofParams?: any;
  floorMesh?: any;
}

/**
 * [작품 메타데이터 인터페이스]
 */
export interface HanokDesignItem {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  design_data: HanokDesignData;
  created_at: string;
  updated_at: string;
}

/**
 * 현재 useBuildStore에 조립된 부재들을 4-3 스펙에 맞는 JSON 페이로드 구조로 분류 추출합니다.
 */
export function serializeCurrentBuild(): HanokDesignData {
  const { placedParts, floorMesh } = useBuildStore.getState();
  const { params } = useRoofStore.getState();

  const foundation: PlacedPart[] = [];
  const pillars: PlacedPart[] = [];
  const beams: PlacedPart[] = [];
  const walls: PlacedPart[] = [];
  const doors: PlacedPart[] = [];
  const rafters: PlacedPart[] = [];
  const roofTiles: PlacedPart[] = [];

  placedParts.forEach((part) => {
    const cat = part.category?.toLowerCase() || '';
    const partId = part.partId?.toLowerCase() || '';
    const type = part.type?.toLowerCase() || '';

    if (cat === 'foundation' || partId.startsWith('foundation_')) {
      foundation.push(part);
    } else if (cat === 'pillar' || partId.startsWith('pillar_')) {
      pillars.push(part);
    } else if (cat === 'beam' || partId.startsWith('beam_') || type === 'purlin' || partId === 'dori_purin') {
      beams.push(part);
    } else if (cat === 'wall' || partId.startsWith('wall_') || cat === 'window' || partId.startsWith('window_')) {
      walls.push(part);
    } else if (cat === 'door' || partId.startsWith('door_') || type === 'door') {
      doors.push(part);
    } else if (cat === 'rafter' || type === 'rafter' || partId.startsWith('rafter_')) {
      rafters.push(part);
    } else if (cat === 'roof' || type === 'roofTile' || partId.startsWith('roof_tile_') || partId === 'roof_tile_line') {
      roofTiles.push(part);
    } else {
      // 기타 부재는 category 기준으로 매핑
      walls.push(part);
    }
  });

  return {
    foundation,
    pillars,
    beams,
    walls,
    doors,
    rafters,
    roofTiles,
    roofParams: params,
    floorMesh: floorMesh,
  };
}

/**
 * 서버에서 받아온 design_data(JSON)를 파싱하여 useBuildStore 및 useRoofStore로 복원합니다.
 */
export function restoreBuildFromDesign(designData: HanokDesignData): void {
  const allParts: PlacedPart[] = [
    ...(designData.foundation || []),
    ...(designData.pillars || []),
    ...(designData.beams || []),
    ...(designData.walls || []),
    ...(designData.doors || []),
    ...(designData.rafters || []),
    ...(designData.roofTiles || []),
  ];

  // useBuildStore 상태 갱신
  useBuildStore.setState({
    placedParts: allParts,
    floorMesh: designData.floorMesh || null,
    isComplete: false,
    currentStep: allParts.some((p) => p.category === 'roof' || p.category === 'rafter')
      ? 4
      : allParts.some((p) => p.category === 'wall' || p.category === 'window' || p.category === 'door')
      ? 3
      : allParts.some((p) => p.category === 'pillar' || p.category === 'beam')
      ? 2
      : 1,
  });

  // 지붕 파라미터 복원
  if (designData.roofParams) {
    useRoofStore.getState().setRoofParams(designData.roofParams);
  }
  if (allParts.some((p) => p.category === 'roof' || p.category === 'rafter' || p.type === 'purlin')) {
    useRoofStore.getState().createRoof();
  }
}

/**
 * 1) GET /api/designs - 전체 작품 목록 조회
 */
export async function getDesigns(): Promise<HanokDesignItem[]> {
  const res = await fetch('/api/designs');
  if (!res.ok) {
    throw new Error(`작품 목록 조회 실패 (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * 2) GET /api/designs/:id - 특정 작품 상세 조회
 */
export async function getDesignById(id: string): Promise<HanokDesignItem> {
  const res = await fetch(`/api/designs/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`작품 조회 실패 (HTTP ${res.status})`);
  }
  return res.json();
}

/**
 * 3) POST /api/designs - 현재 조립된 작품 저장
 */
export async function saveDesign(title: string, description?: string, thumbnail?: string): Promise<{ success: boolean; id: string; message: string }> {
  const designData = serializeCurrentBuild();

  const res = await fetch('/api/designs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description: description || '',
      thumbnail: thumbnail || '',
      design_data: designData,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `작품 저장 실패 (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * 4) PUT /api/designs/:id - 특정 작품 수정
 */
export async function updateDesign(
  id: string,
  payload: { title?: string; description?: string; thumbnail?: string; design_data?: HanokDesignData }
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/designs/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `작품 수정 실패 (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * 5) DELETE /api/designs/:id - 특정 작품 삭제
 */
export async function deleteDesign(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/designs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `작품 삭제 실패 (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * 6) GET /api/ai-content - AI 콘텐츠 목록 조회
 */
export async function getAIContents(category?: string): Promise<any[]> {
  const query = category && category !== 'ALL' ? `?category=${encodeURIComponent(category)}` : '';
  const res = await fetch(`/api/ai-content${query}`);
  if (!res.ok) {
    throw new Error(`AI 콘텐츠 목록 조회 실패 (HTTP ${res.status})`);
  }
  return res.json();
}
