/**
 * [한옥 결구 스냅 포인트 및 규격 명세]
 * 전통 한옥 목구조에서 주춧돌, 기둥, 대들보, 벽체가 서로 맞물리는
 * 결구점(Snap Points)의 물리적 치수와 위치 연산식을 정의합니다.
 */

// 1. 기둥 규격 및 스냅 위치 (두리기둥 / 원형 기둥 기준)
export const PILLAR_SPECS = {
  radius: 0.16, // 기둥 반지름 16cm (지름 32cm 원목)
  height: 2.8,  // 기둥 전체 높이 2.8m
  // 기둥 중심 좌표로부터 바닥 접합면(주춧돌 닿는 곳)과 상단 결구면(주두/보 닿는 곳) 좌표 계산
  getSnapPoints: (centerPos: [number, number, number]) => ({
    bottom: [centerPos[0], centerPos[1] - 1.4, centerPos[2]] as [number, number, number], // 바닥면 (Y - 1.4m)
    top: [centerPos[0], centerPos[1] + 1.4, centerPos[2]] as [number, number, number],    // 기둥 머리 (Y + 1.4m)
  }),
};

// 2. 대들보 규격 및 스냅 위치 (보의 양 끝점 계산)
export const BEAM_SPECS = {
  height: 0.32, // 대들보 세로 춤(높이) 32cm
  depth: 0.28,  // 대들보 가로 폭(두께) 28cm
  // 중심 좌표와 보의 길이를 받아 양쪽 끝 기둥과 만나는 결구 좌표 계산
  getSnapPoints: (
    centerPos: [number, number, number],
    length: number,
    axis: 'x' | 'z'
  ) => {
    if (axis === 'x') {
      // X축 방향 대들보: 좌측(-X) 끝과 우측(+X) 끝 좌표
      return {
        left: [centerPos[0] - length / 2, centerPos[1], centerPos[2]] as [number, number, number],
        right: [centerPos[0] + length / 2, centerPos[1], centerPos[2]] as [number, number, number],
      };
    } else {
      // Z축 방향 대들보: 앞쪽(-Z) 끝과 뒤쪽(+Z) 끝 좌표
      return {
        left: [centerPos[0], centerPos[1], centerPos[2] - length / 2] as [number, number, number],
        right: [centerPos[0], centerPos[1], centerPos[2] + length / 2] as [number, number, number],
      };
    }
  },
};

// 3. 주춧돌(기단석) 규격 및 상단 안착점
export const FOUNDATION_SPECS = {
  size: 0.9,   // 사각 주춧돌 가로/세로 90cm
  height: 0.5, // 주춧돌 높이 50cm
  // 기둥이 주춧돌 윗면에 얹혀지는 지점 (주춧돌 중심 Y + 0.25m)
  getTopSnapPoint: (centerPos: [number, number, number]): [number, number, number] => [
    centerPos[0],
    centerPos[1] + 0.25,
    centerPos[2],
  ],
};

// 4. 벽체 및 창호가 설치될 수 있는 두 기둥 사이의 앵커 포인트 인터페이스
export interface WallAnchorPoint {
  id: string;                         // 앵커 고유 식별자
  pillar1Id: string;                  // 첫 번째 기둥 ID
  pillar2Id: string;                  // 두 번째 기둥 ID
  position: [number, number, number]; // 두 기둥 사이의 정중앙 좌표
  axis: 'x' | 'z';                    // 벽체가 놓일 축 (가로 X축 또는 세로 Z축)
  width: number;                      // 벽체의 실제 가로 폭
  height: number;                     // 벽체의 실제 높이
  rotation: [number, number, number]; // 벽체의 3D 회전각
}

/**
 * 현재 배치된 기둥들을 분석하여, 인접한 두 기둥 사이에 벽체/창호를 설치할 수 있는
 * 유효한 벽 앵커(Wall Anchor) 목록을 자동으로 계산합니다.
 */
export const calculateWallAnchors = (
  pillars: { id: string; position: [number, number, number] }[]
): WallAnchorPoint[] => {
  const anchors: WallAnchorPoint[] = [];

  // 모든 기둥 쌍을 2중 루프로 비교
  for (let i = 0; i < pillars.length; i++) {
    for (let j = i + 1; j < pillars.length; j++) {
      const p1 = pillars[i];
      const p2 = pillars[j];

      const dx = Math.abs(p1.position[0] - p2.position[0]);
      const dz = Math.abs(p1.position[2] - p2.position[2]);

      // X축 또는 Z축으로 나란히 마주보고 있는 인접 기둥인지 판별 (간격 1.5m ~ 6.5m 사이)
      const isXAxis = dz < 0.2 && dx >= 1.5 && dx <= 6.5;
      const isZAxis = dx < 0.2 && dz >= 1.5 && dz <= 6.5;

      if (isXAxis || isZAxis) {
        const axis = isXAxis ? 'x' : 'z';
        const dist = isXAxis ? dx : dz;
        
        // [곡면 유격 보정]: 원통형 기둥의 곡면과 직사각형 벽체 사이의 빛샘을 없애기 위해 기둥 안쪽으로 약간 겹치게 연산
        const width = dist - PILLAR_SPECS.radius * 1.4; 
        const centerX = (p1.position[0] + p2.position[0]) / 2;
        const centerZ = (p1.position[2] + p2.position[2]) / 2;
        const centerY = p1.position[1]; // 기둥 중심 높이와 동일하게 일치

        anchors.push({
          id: `anchor_${p1.id}_${p2.id}`,
          pillar1Id: p1.id,
          pillar2Id: p2.id,
          position: [centerX, centerY, centerZ],
          axis,
          width,
          height: PILLAR_SPECS.height, // 기둥 전체 높이(2.8m)로 확장하여 대들보 하부 틈새 완전 밀착
          rotation: isZAxis ? [0, Math.PI / 2, 0] : [0, 0, 0], // Z축 벽체는 90도 회전
        });
      }
    }
  }

  return anchors;
};

/**
 * 3D 마우스 레이캐스트 지점에서 가장 가까운 주춧돌을 탐색합니다 (근접 스냅용)
 */
export const findNearestFoundation = (
  point: [number, number, number],
  foundations: Array<{ id: string; position: [number, number, number] }>,
  maxDistance: number = 2.0
) => {
  let nearest: { id: string; position: [number, number, number]; distance: number } | null = null;

  for (const f of foundations) {
    const dx = f.position[0] - point[0];
    const dz = f.position[2] - point[2];
    const dist = Math.hypot(dx, dz); // 피타고라스 정리로 수평 거리 계산

    if (dist <= maxDistance) {
      if (!nearest || dist < nearest.distance) {
        nearest = { id: f.id, position: f.position, distance: dist };
      }
    }
  }

  return nearest;
};

/**
 * 3D 마우스 레이캐스트 지점에서 가장 가까운 벽체 앵커를 탐색합니다 (벽체 배치 가이드용)
 */
export const findNearestWallAnchor = (
  point: [number, number, number],
  anchors: WallAnchorPoint[],
  maxDistance: number = 2.2
) => {
  let nearest: { anchor: WallAnchorPoint; distance: number } | null = null;

  for (const anchor of anchors) {
    const dx = anchor.position[0] - point[0];
    const dz = anchor.position[2] - point[2];
    const dist = Math.hypot(dx, dz);

    if (dist <= maxDistance) {
      if (!nearest || dist < nearest.distance) {
        nearest = { anchor, distance: dist };
      }
    }
  }

  return nearest ? nearest.anchor : null;
};

