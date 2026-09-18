import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { type ThreeEvent } from '@react-three/fiber';
import { useBuildStore, useRoofStore, type PlacedPart } from '../../store';
import { BEAM_SPECS } from './snapPoints';

// 박공벽(합각벽)의 앞뒤 두께: 대들보 단면(0.28m)을 완전히 감싸서 튀어나오지 않도록 여유(0.04m)를 둔 0.32m로 설정
const GABLE_WALL_DEPTH = BEAM_SPECS.depth + 0.04; // 약 0.32m

/**
 * [STEP 04] 서까래와 기와 (파라메트릭 자동 생성 매니저)
 * -------------------------------------------------------------
 * 1. 기둥들의 실제 위치를 기반으로 지붕의 중심, 폭, 깊이를 자동 계산합니다.
 * 2. 대들보 상단에 서까래가 자연스럽게 안착(Resting)하도록 높이를 정밀 조율합니다.
 * 3. 처마 평고자는 서까래 아랫면 끝에 밀착되어 서까래를 튼튼하게 받칩니다.
 * 4. [용마루 기준 반반 절개]:
 *    - 전면(남측): 기와를 덮지 않고 서까래와 대들보, 주두 결구를 100% 노출
 *    - 후면(북측): 전통 흑회색 기와(암키와+수키와)로 마감하여 지붕 외관 유지
 * 5. 박공벽(합각벽)과 풍판이 건물 외벽선과 오차 없이 수직 정렬됩니다.
 * 6. Shift + 클릭 또는 우클릭 시 지붕/서까래를 쉽게 삭제할 수 있습니다.
 */
export const Step4RoofManager: React.FC = () => {
  const placedParts = useBuildStore((state) => state.placedParts);
  const setIsComplete = useBuildStore((state) => state.setIsComplete);
  const { hasRoof, params, removeRoof, batchPurlinsTrigger, batchRaftersTrigger, batchTilesTrigger } = useRoofStore();
  // params의 모든 지붕 파라미터(roofWidth, roofDepth, tileCount, roofAngle, rafterPitch, eavesOverhang)를 반응형으로 연동
  const { roofAngle, rafterPitch, roofWidth, roofDepth, tileCount: paramTileCount, eavesOverhang: paramEavesOverhang } = params;

  // 실제 배치된 서까래 부재 목록 (기와골 가이드 라인 1:1 매핑용)
  const placedRafters = useMemo(() => {
    return placedParts.filter(
      (p) => p.type === 'rafter' || p.category === 'rafter' || p.id.startsWith('rafter_')
    );
  }, [placedParts]);

  // ---------------------------------------------------------------------------
  // [1단계] 현재 배치된 기둥들의 좌표를 조사하여 건물의 중심점과 외곽 경계선 찾기
  // ---------------------------------------------------------------------------
  const { centerX, centerZ, baseBeamY, minX, maxX, minZ, maxZ, pillarSpanZ } = useMemo(() => {
    const pillars = placedParts.filter((p) => p.category === 'pillar');
    if (pillars.length === 0) {
      // 기둥이 아직 없을 때 기본값 (가로 4m x 세로 4m 기준)
      return {
        centerX: 0,
        centerZ: 0,
        baseBeamY: 3.2,
        minX: -2,
        maxX: 2,
        minZ: -2,
        maxZ: 2,
        pillarSpanZ: 4,
      };
    }
    let min_x = Infinity, max_x = -Infinity;
    let min_z = Infinity, max_z = -Infinity;
    let maxY = 3.0;

    // 모든 기둥의 좌표를 훑으며 가장 바깥쪽 X, Z 좌표와 기둥 꼭대기 높이(Y)를 찾음
    pillars.forEach((p) => {
      min_x = Math.min(min_x, p.position[0]);
      max_x = Math.max(max_x, p.position[0]);
      min_z = Math.min(min_z, p.position[2]);
      max_z = Math.max(max_z, p.position[2]);
      maxY = Math.max(maxY, p.position[1] + 1.4); // 기둥 중심(1.9) + 반지름/높이 절반(1.4) = 기둥 머리 3.3m
    });

    const spanZ = max_z - min_z > 0.5 ? max_z - min_z : 4;

    return {
      centerX: (min_x + max_x) / 2, // 건물 정중앙 X 좌표
      centerZ: (min_z + max_z) / 2, // 건물 정중앙 Z 좌표
      baseBeamY: maxY,              // 기둥 머리 및 대들보 상단 기준 높이 (약 3.3m)
      minX: min_x,                  // 가장 서쪽(좌측) 기둥선
      maxX: max_x,                  // 가장 동쪽(우측) 기둥선
      minZ: min_z,                  // 가장 북쪽(뒤쪽) 기둥선
      maxZ: max_z,                  // 가장 남쪽(앞쪽) 기둥선
      pillarSpanZ: spanZ,           // 기둥 사이의 남북(Z축) 간격 폭
    };
  }, [placedParts]);

  // 바닥 셀 정보(L자/T자 등 다각형 평면 인식용)
  const floorMesh = useBuildStore((state) => state.floorMesh);

  // ---------------------------------------------------------------------------
  // [2단계] 한옥 전통 비례에 맞춘 지붕 및 서까래 치수 연산 (파라미터 슬라이더 연동)
  // ---------------------------------------------------------------------------
  // 기둥 사이 기본 스팬(Span) 폭과 깊이
  const basePillarWidth = maxX - minX;
  const basePillarDepth = pillarSpanZ;

  // [파라미터 연동 1: 처마 내밀기 및 지붕 폭/깊이]:
  // 사용자가 슬라이더(roofWidth, roofDepth)를 조절할 때, 기본 기둥 스팬 대비 확장값을
  // 전통 처마 내밀기(기본 0.75m)에 자연스럽게 가산하여 안전하고 비례에 맞게 연동합니다.
  const extraWidthOverhang = roofWidth ? Math.max(-0.4, (roofWidth - (basePillarWidth + 1.5)) / 2) : 0;
  const extraDepthOverhang = roofDepth ? Math.max(-0.4, (roofDepth - (basePillarDepth + 1.5)) / 2) : 0;

  // 최종 처마 내밀기(Eaves Overhang): 기본 전통 권장치 0.75m + 슬라이더 조절분
  const eavesOverhangX = Math.max(0.35, (paramEavesOverhang || 0.75) + extraWidthOverhang);
  const eavesOverhangZ = Math.max(0.35, (paramEavesOverhang || 0.75) + extraDepthOverhang);

  // 삼각함수용 각도(라디안 변환): 60분법 각도(예: 27도)를 컴퓨터가 이해하는 라디안으로 변환
  const angleRad = (roofAngle * Math.PI) / 180;

  // 건물의 반쪽 깊이: 용마루(중앙)에서 앞뒤 기둥까지의 수평 거리
  // ※ [건축 가구식 위계 절대 보존]: 박공벽(합각벽)과 대공/종보는 기둥선(minX~maxX, basePillarDepth)에 오차 없이 일치
  const halfGableDepth = basePillarDepth / 2;

  // 용마루 삼각 지붕의 높이 (밑변 * tan(지붕각도))
  const ridgeHeight = halfGableDepth * Math.tan(angleRad);

  // [서까래 규격]: 상단과 하단이 동일한 지름(16cm, 반지름 0.08m)을 가지는 전통 균일 원목 연목
  const rafterRadius = 0.08;

  // [주심도리 규격]: 대들보 상단과 기둥 머리 위에서 서까래를 수평으로 받쳐주는 원목 도리 (지름 22cm)
  // ※ [절대 보존 원칙]: 기존 주심도리 좌표 계산 로직(doriRadius, doriY)은 값 자체를 수정하지 않고 그대로 보존 및 참조합니다.
  const doriRadius = 0.11;
  const doriY = baseBeamY + doriRadius; // 주심도리 중심 높이 (대들보 상단 바로 위)

  // [옵션 A 가구식 정통 안착]: 
  // 기둥 머리 사개맞춤 -> 대들보 -> 주심도리(dori) -> 서까래(rafter) 순으로 안착.
  // 서까래 바닥선이 주심도리/대들보 상단에 밀착되어 얹혀지도록 용마루 높이(ridgeY) 산정
  const ridgeY = baseBeamY + doriRadius * 2 + ridgeHeight + rafterRadius;

  // 처마 끝까지 포함한 실제 지붕의 전체 가로폭(X축)과 앞뒤 깊이(Z축)
  const actualRoofWidth = basePillarWidth + eavesOverhangX * 2; // 양쪽 처마 내밀기 포함 전체 폭
  const actualRoofDepth = basePillarDepth + eavesOverhangZ * 2; // 앞뒤 처마 내밀기 포함 전체 깊이
  const halfDepth = actualRoofDepth / 2;                       // 용마루에서 처마 끝까지의 수평 거리

  // 빗변 공식: 용마루에서 처마 끝까지 내려오는 서까래의 실제 비스듬한 총 길이 (밑변 / cos(각도))
  const slopeLength = halfDepth / Math.cos(angleRad);

  // [처마 평고자 높이 연산]: 처마 끝에서 서까래 중심 높이에서 서까래 반지름을 빼서, 서까래 "바로 밑"에 평고자가 딱 붙어 받치도록 설정
  const rafterEndY = ridgeY - halfDepth * Math.tan(angleRad); // 서까래 처마 끝 중심 Y
  const purlinHeight = 0.12;                                  // 평고자 각목의 두께(높이)
  const eavesPurlinY = rafterEndY - rafterRadius - purlinHeight / 2; // 평고자의 중심 Y 위치

  // ---------------------------------------------------------------------------
  // [L자/다각형 평면 인식 및 도리/경사면/박공벽 유효 구간 연산]:
  // 바닥 셀(floorMesh.cells) 및 배치된 기둥(pillars)의 좌표를 교차 분석하여
  // 북측 본채(North)와 남측 날개채(South)의 X축 최소/최대 유효 범위를 정밀 분별합니다.
  // ---------------------------------------------------------------------------
  const wingBounds = useMemo(() => {
    let nMinX = Infinity, nMaxX = -Infinity;
    let sMinX = Infinity, sMaxX = -Infinity;

    const cells = floorMesh?.cells;
    if (cells && cells.length > 0) {
      cells.forEach((c) => {
        const cellCenterZ = (c.z0 + c.z1) / 2;
        if (cellCenterZ >= centerZ - 0.2) {
          sMinX = Math.min(sMinX, c.x0);
          sMaxX = Math.max(sMaxX, c.x1);
        }
        if (cellCenterZ <= centerZ + 0.2) {
          nMinX = Math.min(nMinX, c.x0);
          nMaxX = Math.max(nMaxX, c.x1);
        }
      });
    }

    // 바닥 셀 정보 외에 실제 기둥 좌표로도 북측/남측 외곽 X 검증 보강
    const pillars = placedParts.filter((p) => p.category === 'pillar');
    if (pillars.length > 0) {
      let pillarNMinX = Infinity, pillarNMaxX = -Infinity;
      let pillarSMinX = Infinity, pillarSMaxX = -Infinity;
      let hasPillarSouth = false;
      let hasPillarNorth = false;

      pillars.forEach((p) => {
        if (p.position[2] >= centerZ - 0.3) {
          hasPillarSouth = true;
          pillarSMinX = Math.min(pillarSMinX, p.position[0]);
          pillarSMaxX = Math.max(pillarSMaxX, p.position[0]);
        }
        if (p.position[2] <= centerZ + 0.3) {
          hasPillarNorth = true;
          pillarNMinX = Math.min(pillarNMinX, p.position[0]);
          pillarNMaxX = Math.max(pillarNMaxX, p.position[0]);
        }
      });

      if (hasPillarNorth && nMinX === Infinity) {
        nMinX = pillarNMinX;
        nMaxX = pillarNMaxX;
      }
      if (hasPillarSouth && sMinX === Infinity) {
        sMinX = pillarSMinX;
        sMaxX = pillarSMaxX;
      }
    }

    const northMinX = nMinX !== Infinity ? nMinX : minX;
    const northMaxX = nMaxX !== -Infinity ? nMaxX : maxX;
    const southMinX = sMinX !== Infinity ? sMinX : minX;
    const southMaxX = sMaxX !== -Infinity ? sMaxX : maxX;

    // 남측과 북측의 X축 범위가 0.4m 이상 다르면 L자형으로 인식
    const isLShaped = (Math.abs(southMaxX - northMaxX) > 0.4 || Math.abs(southMinX - northMinX) > 0.4);

    // [다채(Multi-Wing) 교차 결구 분석]: 본채(Main Wing)와 익랑/날개채(Side Wing)의 경계 분석
    // 본채는 가로(X축)로 긴 2~3칸 형태이며, 북측 기준선(minZ)에서 남측으로 일정 깊이(본채 남측선 mainSouthZ)를 형성합니다.
    let mainSouthZ = centerZ;
    if (isLShaped) {
      // 본채에만 속하는 기둥들(날개채가 없는 동측 구간 기둥)의 Z좌표를 통해 본채 남측선 도출
      const eastPillars = pillars.filter((p) => p.position[0] > (northMinX + northMaxX) / 2);
      if (eastPillars.length > 0) {
        const eastSouthZ = Math.max(...eastPillars.map((p) => p.position[2]));
        mainSouthZ = eastSouthZ;
      } else {
        mainSouthZ = minZ + 4.0; // 표준 1칸(4m) 깊이
      }
    }

    // 본채 용마루 중심선 Z: 본채 북측선(minZ)과 본채 남측선(mainSouthZ)의 정중앙
    const mainRidgeZ = isLShaped ? (minZ + mainSouthZ) / 2 : centerZ;
    // 본채 반쪽 깊이: 본채 용마루에서 처마/외벽까지의 수평 거리
    const mainHalfGableDepth = isLShaped ? (mainSouthZ - minZ) / 2 : (maxZ - minZ) / 2;

    return {
      hasLShape: isLShaped,
      northMinX,
      northMaxX,
      southMinX,
      southMaxX,
      mainSouthZ,
      mainRidgeZ,
      mainHalfGableDepth,
      // 서측에 남측/북측 날개 및 벽체가 실제 존재하는지 여부
      hasWestNorth: northMinX <= minX + 0.3,
      hasWestSouth: southMinX <= minX + 0.3,
      // 동측에 남측/북측 날개 및 벽체가 실제 존재하는지 여부
      hasEastNorth: northMaxX >= maxX - 0.3,
      hasEastSouth: southMaxX >= maxX - 0.3,
    };
  }, [floorMesh?.cells, placedParts, minX, maxX, minZ, maxZ, centerZ]);

  // ---------------------------------------------------------------------------
  // [신규 도리(Purlin) 좌표 계산 로직]: 주심도리, 중도리, 종도리 3단 구조
  // (L자형 평면일 경우, 남측 날개채의 도리는 남측 날개채의 X폭에 맞춰 정확히 단축 배치됨)
  // ---------------------------------------------------------------------------
  // 1. 종도리(Ridge Purlin): 용마루 중심선(centerZ)에서 서까래 머리 아랫면을 받치는 위치
  const ridgeDoriY = ridgeY - rafterRadius - doriRadius;

  // 2. 중도리(Middle Purlin): 주심도리와 종도리 사이의 정확한 중간 지점
  const midSouthZ = (maxZ + centerZ) / 2;
  const midNorthZ = (minZ + centerZ) / 2;
  const midDoriY = (doriY + ridgeDoriY) / 2;

  // 도리 5개 슬롯 정의 (주심도리 2개 + 중도리 2개 + 종도리 1개)
  // 각 도리는 독립적인 중심 X좌표와 유효 길이(spanLength)를 가집니다.
  const purlinSlots = useMemo(() => {
    // 남측 도리들의 스팬 폭 및 중심 X 계산
    // L자형 구조에서도 종도리 및 중도리는 본채와 날개채를 안정적으로 연결하도록 전체 지붕 폭을 포괄
    const sMinX = wingBounds.hasLShape ? Math.min(wingBounds.southMinX, wingBounds.northMinX) : wingBounds.southMinX;
    const sMaxX = wingBounds.hasLShape ? Math.max(wingBounds.southMaxX, wingBounds.northMaxX) : wingBounds.southMaxX;
    const sCenterX = (sMinX + sMaxX) / 2;
    const sSpanWidth = (sMaxX - sMinX) + eavesOverhangX * 2;

    // 북측 및 용마루 도리들의 스팬 폭 및 중심 X 계산 (본채 기준)
    const nMinX = wingBounds.northMinX;
    const nMaxX = wingBounds.northMaxX;
    const nCenterX = (nMinX + nMaxX) / 2;
    const nSpanWidth = (nMaxX - nMinX) + eavesOverhangX * 2;

    return [
      {
        id: 'purlin_eave_south',
        name: '남측 주심도리',
        level: 'eave' as const,
        position: [sCenterX, doriY, maxZ] as [number, number, number],
        length: sSpanWidth - 0.2,
      },
      {
        id: 'purlin_eave_north',
        name: '북측 주심도리',
        level: 'eave' as const,
        position: [nCenterX, doriY, minZ] as [number, number, number],
        length: nSpanWidth - 0.2,
      },
      {
        id: 'purlin_middle_south',
        name: '남측 중도리',
        level: 'middle' as const,
        position: [sCenterX, midDoriY, midSouthZ] as [number, number, number],
        length: sSpanWidth - 0.2,
      },
      {
        id: 'purlin_middle_north',
        name: '북측 중도리',
        level: 'middle' as const,
        position: [nCenterX, midDoriY, midNorthZ] as [number, number, number],
        length: nSpanWidth - 0.2,
      },
      {
        id: 'purlin_ridge',
        name: '용마루 종도리',
        level: 'ridge' as const,
        position: [centerX, ridgeDoriY, centerZ] as [number, number, number],
        length: actualRoofWidth - 0.2,
      },
    ];
  }, [wingBounds, eavesOverhangX, doriY, maxZ, minZ, midDoriY, midSouthZ, midNorthZ, centerX, ridgeDoriY, centerZ, actualRoofWidth]);

  // 호버 중인 도리 슬롯 ID 상태 (Ghost 프리뷰용)
  const [hoveredSlotId, setHoveredSlotId] = React.useState<string | null>(null);

  // 스토어 액션 및 현재 선택된 부재
  const addPart = useBuildStore((state) => state.addPart);
  const removePart = useBuildStore((state) => state.removePart);
  const selectedPart = useBuildStore((state) => state.selectedPart);


  // ---------------------------------------------------------------------------
  // [도리 일관성 보장]: 
  // 도리는 사용자가 직접 3D 뷰의 슬롯을 클릭하거나 "도리 일괄 얹기" 버튼을 누를 때 
  // placedParts에 등록됩니다. (3-1, 3-2 인터랙티브 조립 원칙 보존)
  // ---------------------------------------------------------------------------
  // (자동 강제 동기화를 제거하여 수동 클릭 배치와 일괄 버튼 배치를 자유롭게 테스트 가능)


  // ---------------------------------------------------------------------------
  // [도리 일괄 얹기]: 처마/중도리/종도리 3개 레벨(5개 도리)을 한 번에 일괄 배치
  // ---------------------------------------------------------------------------
  const prevBatchPurlinsTriggerRef = useRef(batchPurlinsTrigger);
  useEffect(() => {
    if (batchPurlinsTrigger > prevBatchPurlinsTriggerRef.current) {
      prevBatchPurlinsTriggerRef.current = batchPurlinsTrigger;
      // 현재 placedParts에 없는 모든 도리 슬롯을 추출하여 즉시 일괄 추가
      const existingIds = new Set(placedParts.map((p) => p.id));
      const purlinsToAdd: PlacedPart[] = [];
      purlinSlots.forEach((slot) => {
        if (!existingIds.has(slot.id)) {
          purlinsToAdd.push({
            id: slot.id,
            partId: 'dori_purin',
            category: 'beam',
            type: 'purlin',
            level: slot.level,
            purlinLevel: slot.level,
            name: slot.name,
            position: slot.position,
            rotation: [0, 0, Math.PI / 2],
          });
        }
      });

      if (purlinsToAdd.length > 0) {
        useBuildStore.setState((state) => ({
          placedParts: [...state.placedParts, ...purlinsToAdd],
        }));
      }
    }
  }, [batchPurlinsTrigger, purlinSlots, placedParts]);

  // 도리 슬롯 클릭 시 배치 / 제거 토글 핸들러
  const handlePurlinSlotClick = (
    e: ThreeEvent<MouseEvent>,
    slot: typeof purlinSlots[0],
    isCurrentlyPlaced: boolean
  ) => {
    e.stopPropagation();
    if (isCurrentlyPlaced) {
      // 이미 배치되어 있는 도리 클릭 시 제거
      removePart(slot.id);
    } else {
      // 비어있는 도리 슬롯 클릭 시 새 도리 확정 배치
      addPart({
        id: slot.id,
        partId: 'dori_purin',
        category: 'beam',
        type: 'purlin',
        level: slot.level,
        purlinLevel: slot.level,
        name: slot.name,
        position: slot.position,
        rotation: [0, 0, Math.PI / 2],
      });
    }
  };

  // ===========================================================================
  // [서까래(Rafter) 경사면 검증 및 슬롯 생성]
  // ===========================================================================
  // 1. 도리 존재 여부 확인:
  //    - 종도리 (Ridge Purlin): 지붕 중앙 용마루
  //    - 남측/북측 주심도리 (Eave Purlin): 건물 전후면 외곽선
  //    - 남측/북측 중도리 (Middle Purlin): 주심도리와 종도리 사이
  const hasRidgePurlin = placedParts.some(
    (p) => p.id === 'purlin_ridge' || (p.type === 'purlin' && (p.level === 'ridge' || p.purlinLevel === 'ridge'))
  );
  const hasSouthEave = placedParts.some(
    (p) => p.id === 'purlin_eave_south' || (p.type === 'purlin' && (p.level === 'eave' || p.purlinLevel === 'eave') && p.position[2] > centerZ)
  );
  const hasSouthMid = placedParts.some(
    (p) => p.id === 'purlin_middle_south' || (p.type === 'purlin' && (p.level === 'middle' || p.purlinLevel === 'middle') && p.position[2] > centerZ)
  );
  const hasNorthEave = placedParts.some(
    (p) => p.id === 'purlin_eave_north' || (p.type === 'purlin' && (p.level === 'eave' || p.purlinLevel === 'eave') && p.position[2] < centerZ)
  );
  const hasNorthMid = placedParts.some(
    (p) => p.id === 'purlin_middle_north' || (p.type === 'purlin' && (p.level === 'middle' || p.purlinLevel === 'middle') && p.position[2] < centerZ)
  );

  // [원칙 2]: 경사면별로 3개 도리가 모두 존재할 때만 해당 경사면 활성화 (하나라도 없으면 스킵)
  const isSouthSlopeValid = hasRidgePurlin && hasSouthEave && hasSouthMid;
  const isNorthSlopeValid = hasRidgePurlin && hasNorthEave && hasNorthMid;


  // 마우스 호버 중인 서까래 슬롯 ID 추적 (Ghost 프리뷰용)
  const [hoveredRafterId, setHoveredRafterId] = React.useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // [3단계] 서까래(연목) 인터랙티브 슬롯 데이터 생성 (경사면 도리 3점 관통)
  // ---------------------------------------------------------------------------
  // X축 방향으로 rafterPitch(0.35~0.4m) 간격 또는 params.tileCount로 서까래 슬롯을 생성합니다.
  const rafterSlots = useMemo(() => {
    if (!hasRoof) return [];

    // X축 방향 서까래 및 기와골 개수 (params.tileCount가 설정되어 있으면 그 값을 우선 적용)
    const countAlongWidth = paramTileCount
      ? Math.max(4, paramTileCount)
      : Math.max(4, Math.round(actualRoofWidth / rafterPitch));
    const stepX = actualRoofWidth / (countAlongWidth - 1); // 서까래 간의 X축 간격
    const startX = centerX - actualRoofWidth / 2;          // 가장 좌측 서까래의 시작 X 좌표

    const slots: Array<{
      id: string;
      name: string;
      slope: 'south' | 'north';
      position: [number, number, number];
      rotation: [number, number, number];
      length: number;
    }> = [];

    for (let i = 0; i < countAlongWidth; i++) {
      const rx = startX + i * stepX;

      // [한옥 가구식 위계 - 익랑/날개채 적합성 검사]:
      // L자형 평면 구조일 때, 바닥 및 기둥이 없는 빈 공간(허공) 위에는 서까래가 뜨지 않도록
      // 해당 경사면의 유효 X축 구간(wingBounds) 안에 위치하는지 검사합니다.
      const isSouthValidX = rx >= wingBounds.southMinX - eavesOverhangX - 0.05 && rx <= wingBounds.southMaxX + eavesOverhangX + 0.05;
      const isNorthValidX = rx >= wingBounds.northMinX - eavesOverhangX - 0.05 && rx <= wingBounds.northMaxX + eavesOverhangX + 0.05;

      // 1. 남측 슬로프 서까래 (전면, Z 양수 방향): 주심도리_남 -> 중도리_남 -> 종도리 3점을 관통
      // L자형 구조에서도 본채(북측)의 지붕선이 용마루를 중심으로 온전한 맞배지붕 형태를 띨 수 있도록,
      // 남측 서까래는 남측 날개채뿐만 아니라 본채의 남측 지붕면(처마선)까지 자연스럽게 연속되어 빈 틈새가 생기지 않도록 생성합니다.
      const isSouthCoveredX = isSouthValidX || (wingBounds.hasLShape && rx >= wingBounds.northMinX - eavesOverhangX - 0.05 && rx <= wingBounds.northMaxX + eavesOverhangX + 0.05);

      if (isSouthSlopeValid && isSouthCoveredX) {
        slots.push({
          id: `rafter_south_${i}`,
          name: `남측 서까래 ${i + 1}`,
          slope: 'south',
          position: [rx, ridgeY - (slopeLength / 2) * Math.sin(angleRad), centerZ + (halfDepth / 2)],
          rotation: [angleRad + Math.PI / 2, 0, 0], // X축 회전으로 물매 각도 형성
          length: slopeLength,
        });
      }

      // 2. 북측 슬로프 서까래 (후면, Z 음수 방향): 주심도리_북 -> 중도리_북 -> 종도리 3점을 관통
      if (isNorthSlopeValid && isNorthValidX) {
        slots.push({
          id: `rafter_north_${i}`,
          name: `북측 서까래 ${i + 1}`,
          slope: 'north',
          position: [rx, ridgeY - (slopeLength / 2) * Math.sin(angleRad), centerZ - (halfDepth / 2)],
          rotation: [-angleRad + Math.PI / 2, 0, 0],
          length: slopeLength,
        });
      }
    }

    return slots;
  }, [hasRoof, actualRoofWidth, rafterPitch, paramTileCount, angleRad, centerX, centerZ, ridgeY, slopeLength, halfDepth, isSouthSlopeValid, isNorthSlopeValid, wingBounds, eavesOverhangX]);

  // ---------------------------------------------------------------------------
  // [서까래 및 기와 placedParts 동기화 및 파라미터 변동 추적 관리]
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!hasRoof) return;

    // 1. 도리가 제거되어 경사면이 무효화된 서까래 및 기와 정리
    const currentPlacedRafters = placedParts.filter((p) => p.type === 'rafter' || p.category === 'rafter' || p.id.startsWith('rafter_'));
    const invalidRafterIds = new Set<string>();
    const invalidLineIds = new Set<string>();

    currentPlacedRafters.forEach((r) => {
      const isSouth = r.id.includes('south') || r.position[2] > centerZ;
      const isNorth = r.id.includes('north') || r.position[2] < centerZ;
      if (isSouth && !isSouthSlopeValid) {
        invalidRafterIds.add(r.id);
        invalidLineIds.add(r.id.replace('rafter_', '').replace('_', '-'));
      }
      if (isNorth && !isNorthSlopeValid) {
        invalidRafterIds.add(r.id);
        invalidLineIds.add(r.id.replace('rafter_', '').replace('_', '-'));
      }
    });

    // 2. 파라미터(지붕 폭, 깊이, 각도, 기와 열 수) 조절 시:
    //    (1) 슬롯 범위를 벗어난 초과 서까래 및 기와 정리
    //    (2) 기존 배치된 서까래들의 3D 위치/각도를 새로운 슬롯 좌표로 실시간 동기화
    //    (3) 이미 서까래가 배치되어 있는 상태에서 폭/열수가 늘어나 새 슬롯이 생긴 경우,
    //        새 슬롯의 서까래도 즉시 자동 확장 채움
    //    (4) 이미 기와가 시공되어 있는 경사면(남측/북측)인 경우, 폭/열수 변경으로 생성된 새 서까래에도 기와골을 자동 생성하여
    //        "지붕 폭이나 기와 열수를 변경하면 기와는 없고 서까래만 등장하는 상황"을 원천 방지!
    const slotMap = new Map(rafterSlots.map((s) => [s.id, s]));
    const validSlotIds = new Set(rafterSlots.map((s) => s.id));

    // 서까래가 이미 채워져 있는지 확인 (서까래가 최소 2개 이상 배치되어 있으면 자동 유지)
    const isRafterSystemActive = currentPlacedRafters.length >= 2;

    let hasChanges = false;

    // 1단계: 기존 부재들의 위치/각도 동기화 및 슬롯 범위를 벗어난 서까래/기와 제외
    const updatedPlacedParts = placedParts
      .filter((p) => {
        if (invalidRafterIds.has(p.id)) return false;
        if (p.type === 'rafter' || p.category === 'rafter' || p.id.startsWith('rafter_')) {
          return validSlotIds.has(p.id);
        }
        return true;
      })
      .map((p) => {
        if (p.type === 'rafter' || p.category === 'rafter' || p.id.startsWith('rafter_')) {
          const slot = slotMap.get(p.id);
          if (slot) {
            // 슬롯 위치와 일치하도록 서까래 좌표/회전각 실시간 동기화
            if (
              p.position[0] !== slot.position[0] ||
              p.position[1] !== slot.position[1] ||
              p.position[2] !== slot.position[2] ||
              p.rotation[0] !== slot.rotation[0]
            ) {
              hasChanges = true;
              return {
                ...p,
                position: slot.position,
                rotation: slot.rotation,
              };
            }
          }
        } else if (p.type === 'roofTile' && p.line) {
          // 기와골 역시 대응하는 서까래 슬롯의 위치/각도와 실시간 동기화
          const correspondingRafterId = `rafter_${p.line.replace('-', '_')}`;
          const slot = slotMap.get(correspondingRafterId);
          if (slot) {
            if (
              p.position[0] !== slot.position[0] ||
              p.position[1] !== slot.position[1] ||
              p.position[2] !== slot.position[2] ||
              p.rotation[0] !== slot.rotation[0]
            ) {
              hasChanges = true;
              return {
                ...p,
                position: slot.position,
                rotation: slot.rotation,
              };
            }
          }
        }
        return p;
      });

    // 2단계: 현재 유효한 서까래 ID 집합 파악
    const currentRafterIds = new Set(
      updatedPlacedParts
        .filter((p) => p.type === 'rafter' || p.category === 'rafter' || p.id.startsWith('rafter_'))
        .map((p) => p.id)
    );

    // 3단계: 폭/열수 변경 및 반반 절개(isHalfCutMode) 토글 시 신규 생성 또는 제거
    // [사용자 요구사항]:
    // - ON(반반 절개) 상태: 남측(전면) 서까래는 가구 골조 전시를 위해 기와를 자동 제거/미배치
    // - OFF(전체 시공) 상태: 북측에 기와가 이미 시공되어 있다면, 남측 기와를 사용자가 일일이 누르지 않아도 자동으로 생겨남!
    const newRaftersToAdd: PlacedPart[] = [];
    const newTilesToAdd: PlacedPart[] = [];

    // 반반 절개 모드가 켜져 있을 때(ON), 기존에 배치되어 있던 남측 기와들을 자동 제거
    const isHalfCut = params.isHalfCutMode !== false;
    const partsAfterHalfCutFilter = updatedPlacedParts.filter((p) => {
      if (isHalfCut && p.type === 'roofTile') {
        const isSouthTile = p.id.includes('south') || p.line?.includes('south') || p.position[2] > centerZ;
        if (isSouthTile) {
          hasChanges = true;
          return false; // 남측 기와 자동 제거
        }
      }
      return true;
    });

    if (isRafterSystemActive) {
      rafterSlots.forEach((slot) => {
        const isSouth = slot.slope === 'south';
        const isNorth = slot.slope === 'north';

        // 아직 배치되지 않은 신규 서까래 슬롯인 경우 서까래 추가
        if (!currentRafterIds.has(slot.id)) {
          newRaftersToAdd.push({
            id: slot.id,
            partId: 'rafter_seokkarae',
            category: 'rafter',
            type: 'rafter',
            name: slot.name,
            position: slot.position,
            rotation: slot.rotation,
          });
          currentRafterIds.add(slot.id);
        }

        // 해당 경사면에 기와가 이미 시공되어 있는 상태라면 기와골도 함께 자동 생성
        const lineId = slot.id.replace('rafter_', '').replace('_', '-');
        const tilePartId = `tile_line_${lineId}`;
        const hasTileAlready = partsAfterHalfCutFilter.some((p) => p.type === 'roofTile' && p.line === lineId);

        // [타일 확장 로직]: 사용자가 개별/일부 골만 시공 중일 때는 마음대로 나머지 골을 자동 완공하지 않음.
        // 폭/열수 변경 시 기존에 해당 면의 기와가 90% 이상(사실상 완공) 채워져 있던 경우에만 신규 슬롯을 보충.
        const northRafterCount = rafterSlots.filter((s) => s.slope === 'north').length;
        const currentNorthTilesCount = partsAfterHalfCutFilter.filter((p) => p.type === 'roofTile' && (p.id.includes('north') || p.line?.includes('north'))).length;
        const isNorthFullyTiled = northRafterCount > 0 && currentNorthTilesCount >= northRafterCount - 1;

        const southRafterCount = rafterSlots.filter((s) => s.slope === 'south').length;
        const currentSouthTilesCount = partsAfterHalfCutFilter.filter((p) => p.type === 'roofTile' && (p.id.includes('south') || p.line?.includes('south'))).length;
        const isSouthFullyTiled = southRafterCount > 0 && currentSouthTilesCount >= southRafterCount - 1;

        if (!hasTileAlready) {
          // 북측 기와가 완공 수준으로 시공되어 있을 때 북측 신규 슬롯 서까래에 기와 자동 보충
          if (isNorth && isNorthFullyTiled) {
            newTilesToAdd.push({
              id: tilePartId,
              partId: 'roof_tile_line',
              name: `북측 기와골 (${lineId})`,
              category: 'roof',
              type: 'roofTile',
              line: lineId,
              position: slot.position,
              rotation: slot.rotation,
            });
          }
          // 토글 스위치 OFF (isHalfCutMode === false) 일 때:
          // 남측 기와가 완공 수준으로 시공되어 있다면 신규 남측 서까래에도 보충
          if (isSouth && !isHalfCut && isSouthFullyTiled) {
            newTilesToAdd.push({
              id: tilePartId,
              partId: 'roof_tile_line',
              name: `남측 기와골 (${lineId})`,
              category: 'roof',
              type: 'roofTile',
              line: lineId,
              position: slot.position,
              rotation: slot.rotation,
            });
          }
        }
      });
    }

    // 4단계: 서까래가 없는 고아 기와 정리
    const allFinalRafterLineIds = new Set(
      [...partsAfterHalfCutFilter, ...newRaftersToAdd]
        .filter((r) => r.type === 'rafter' || r.category === 'rafter' || r.id.startsWith('rafter_'))
        .map((r) => r.id.replace('rafter_', '').replace('_', '-'))
    );

    const finalFilteredParts = [...partsAfterHalfCutFilter, ...newRaftersToAdd, ...newTilesToAdd].filter((p) => {
      if (p.type === 'roofTile' && p.line && !allFinalRafterLineIds.has(p.line)) return false;
      return true;
    });

    if (
      hasChanges ||
      newRaftersToAdd.length > 0 ||
      newTilesToAdd.length > 0 ||
      finalFilteredParts.length !== placedParts.length
    ) {
      useBuildStore.setState({ placedParts: finalFilteredParts });
    }
  }, [hasRoof, isSouthSlopeValid, isNorthSlopeValid, centerZ, rafterSlots, placedParts, params.isHalfCutMode]);

  // ---------------------------------------------------------------------------
  // [서까래 일괄 얹기]: 도리가 갖춰진 경사면의 남은 서까래 포인트를 전부 일괄 채움
  // ---------------------------------------------------------------------------
  const prevBatchRaftersTriggerRef = useRef(batchRaftersTrigger);
  useEffect(() => {
    if (batchRaftersTrigger > prevBatchRaftersTriggerRef.current) {
      prevBatchRaftersTriggerRef.current = batchRaftersTrigger;
      // 현재 유효한 rafterSlots 중 placedParts에 없는 서까래들을 일괄 생성
      const existingIds = new Set(placedParts.map((p) => p.id));
      const raftersToAdd: PlacedPart[] = [];
      rafterSlots.forEach((slot) => {
        if (!existingIds.has(slot.id)) {
          raftersToAdd.push({
            id: slot.id,
            partId: 'rafter_seokkarae',
            category: 'rafter',
            type: 'rafter',
            name: slot.name,
            position: slot.position,
            rotation: slot.rotation,
          });
        }
      });

      if (raftersToAdd.length > 0) {
        useBuildStore.setState((state) => ({
          placedParts: [...state.placedParts, ...raftersToAdd],
        }));
      }
    }
  }, [batchRaftersTrigger, rafterSlots, placedParts]);

  // ---------------------------------------------------------------------------
  // [4-2 기와골 적층 시스템]: 서까래 위에 기와골 식별자 매핑 및 클릭 핸들러
  // ---------------------------------------------------------------------------
  // 배치된 기와(roofTile) 목록 조회
  const placedRoofTiles = useMemo(() => {
    return placedParts.filter((p) => p.type === 'roofTile');
  }, [placedParts]);

  // ---------------------------------------------------------------------------
  // [작업 1]: "기와 일괄 시공" 트리거 - 현재 배치된 모든 서까래의 미배치 기와골을 한 번에 채움
  //  - 반반 절개 모드(isHalfCutMode !== false): 전면(남측) 서까래는 가구 골조 전시를 위해 기와 자동 배치에서 제외하고 후면(북측)만 시공
  //  - 전체 시공 모드(isHalfCutMode === false): 남측과 북측 서까래 전체에 기와골 일괄 시공
  // ---------------------------------------------------------------------------
  const prevBatchTilesTriggerRef = useRef(batchTilesTrigger);
  useEffect(() => {
    if (batchTilesTrigger > prevBatchTilesTriggerRef.current) {
      prevBatchTilesTriggerRef.current = batchTilesTrigger;

      // 이미 배치된 기와골 line ID 목록
      const existingLineIds = new Set(
        placedParts.filter((p) => p.type === 'roofTile' && p.line).map((p) => p.line!)
      );

      const tilesToAdd: PlacedPart[] = [];
      placedRafters.forEach((rafter) => {
        const isSouth = rafter.id.includes('south') || rafter.position[2] > centerZ;
        // 반반 절개 모드일 때는 남측(전면) 서까래 기와 자동 시공 건너뜀 (내부 가구 골조 노출)
        if (params.isHalfCutMode !== false && isSouth) {
          return;
        }

        const lineId = rafter.id.replace('rafter_', '').replace('_', '-');
        if (!existingLineIds.has(lineId)) {
          const tilePartId = `tile_line_${lineId}`;
          const slopeName = isSouth ? '남측' : '북측';
          tilesToAdd.push({
            id: tilePartId,
            partId: 'roof_tile_line',
            name: `${slopeName} 기와골 (${lineId})`,
            category: 'roof',
            type: 'roofTile',
            line: lineId,
            position: rafter.position,
            rotation: rafter.rotation,
          });
        }
      });

      if (tilesToAdd.length > 0) {
        useBuildStore.setState((state) => ({
          placedParts: [...state.placedParts, ...tilesToAdd],
        }));
      }
    }
  }, [batchTilesTrigger, placedRafters, placedParts, centerZ, params.isHalfCutMode]);

  // ---------------------------------------------------------------------------
  // [작업 2 & 3]: 기와 시공 완료 여부(전체 완성) 판별
  //  - 반반 절개 모드일 때: 후면(북측) 서까래들의 기와골이 모두 채워지면 완성 인정
  //  - 전체 시공 모드일 때: 남측 및 북측 서까래 전체의 기와골이 채워지면 완성 인정
  // ---------------------------------------------------------------------------
  const isAllRoofTilesFilled = useMemo(() => {
    if (placedRafters.length === 0) return false;
    const filledLineIds = new Set(placedRoofTiles.map((t) => t.line));

    // 완성 판정에 필요한 대상 서까래 목록 필터링
    const targetRafters = params.isHalfCutMode !== false
      ? placedRafters.filter((r) => r.id.includes('north') || r.position[2] < centerZ)
      : placedRafters;

    if (targetRafters.length === 0) return false;

    return targetRafters.every((rafter) => {
      const lineId = rafter.id.replace('rafter_', '').replace('_', '-');
      return filledLineIds.has(lineId);
    });
  }, [placedRafters, placedRoofTiles, centerZ, params.isHalfCutMode]);

  // 전체 완성 시 자동으로 isComplete를 true로 전환 (작업 3: 완성 진입 시점에 1회만 트리거하여 모달 닫기 후 재열림 방지)
  const hasTriggeredCompleteRef = useRef(false);
  useEffect(() => {
    if (isAllRoofTilesFilled) {
      if (!hasTriggeredCompleteRef.current) {
        hasTriggeredCompleteRef.current = true;
        const timer = setTimeout(() => {
          setIsComplete(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } else {
      // 기와가 제거되거나 미완성 상태로 돌아가면 플래그 리셋
      hasTriggeredCompleteRef.current = false;
    }
  }, [isAllRoofTilesFilled, setIsComplete]);

  // 기와골 호버 상태 (가이드 라인 인터랙션 피드백용)
  const [hoveredTileLineId, setHoveredTileLineId] = React.useState<string | null>(null);

  // 기와골 클릭 시 처마~용마루 한 골 전체를 placedParts에 추가하거나 토글 제거하는 핸들러
  const handleTileLineClick = (
    e: ThreeEvent<MouseEvent>,
    lineId: string,
    rafter: PlacedPart,
    isSouth: boolean
  ) => {
    e.stopPropagation();

    // 해당 골이 이미 채워져 있는지 확인
    const existingTile = placedParts.find(
      (p) => p.type === 'roofTile' && p.line === lineId
    );

    if (existingTile) {
      // 4. 이미 채워진 골을 다시 클릭하면 토글로 제거 (도리/서까래와 동일)
      removePart(existingTile.id);
    } else {
      // 1~3. 골 전체(처마→용마루)를 placedParts에 type: 'roofTile', line: lineId 로 일괄 등록
      const tilePartId = `tile_line_${lineId}`;
      const slopeName = isSouth ? '남측' : '북측';
      addPart({
        id: tilePartId,
        partId: 'roof_tile_line',
        name: `${slopeName} 기와골 (${lineId})`,
        category: 'roof',
        type: 'roofTile',
        line: lineId,
        position: rafter.position,
        rotation: rafter.rotation,
      });
    }
  };

  // 브라우저 테스트 및 검증을 위한 헬퍼 바인딩
  useEffect(() => {
    (window as any).__hanokTest = {
      purlinSlots,
      rafterSlots,
      placedRafters,
      placedRoofTiles,
      removePart,
      addPart,
    };
  }, [purlinSlots, rafterSlots, placedRafters, placedRoofTiles, removePart, addPart]);

  // 서까래 슬롯 클릭 토글 핸들러 (실제 서까래 확정 배치 / 제거)
  const handleRafterSlotClick = (
    e: ThreeEvent<MouseEvent>,
    slot: typeof rafterSlots[0],
    isCurrentlyPlaced: boolean
  ) => {
    e.stopPropagation();
    if (isCurrentlyPlaced) {
      // 서까래 제거 시 그 서까래에 얹혀있던 기와골도 함께 정리
      const lineId = slot.id.replace('rafter_', '').replace('_', '-');
      const associatedTile = placedParts.find(
        (p) => p.type === 'roofTile' && p.line === lineId
      );
      if (associatedTile) {
        removePart(associatedTile.id);
      }
      // 이미 배치된 서까래 클릭 시 제거
      removePart(slot.id);
    } else {
      // 빈 스냅 포인트 클릭 시 실제 서까래로 확정 배치 (placedParts에 type: 'rafter' 저장)
      addPart({
        id: slot.id,
        partId: 'rafter_seokkarae',
        category: 'rafter',
        type: 'rafter',
        name: slot.name,
        position: slot.position,
        rotation: slot.rotation,
      });
    }
  };


  // 지붕 우클릭 또는 Shift+클릭 시 지붕 전체 제거 핸들러
  const handleRoofClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.shiftKey || e.button === 2) {
      e.stopPropagation();
      removeRoof();
    }
  };

  // ---------------------------------------------------------------------------
  // [5단계] 전통 박공벽(합각벽) 및 풍판 2D 단면 형상 정의
  // ---------------------------------------------------------------------------
  // 하부 사각 기둥 결구부(대들보 커버) + 상부 삼각형 합각면이 결합된 오각형 단면 (전체 깊이용)
  const gableShape = useMemo(() => {
    const shape = new THREE.Shape();
    const beamCover = BEAM_SPECS.height; // 대들보 몸체를 감싸기 위해 기준선 아래로 32cm 연장
    shape.moveTo(-halfGableDepth, -beamCover);
    shape.lineTo(halfGableDepth, -beamCover);
    shape.lineTo(halfGableDepth, 0);
    shape.lineTo(0, ridgeHeight);        // 용마루 꼭짓점
    shape.lineTo(-halfGableDepth, 0);
    shape.closePath();
    return shape;
  }, [halfGableDepth, ridgeHeight]);

  // [L자형 다채 교차 결구용 본채 전용 맞배 박공벽]
  // 본채(북측)의 동측 끝단(X = maxX)에서 본채의 Z축 구간 [minZ..mainSouthZ]을 온전히 커버하는 대칭 박공벽
  const mainRidgeHeight = (wingBounds.mainHalfGableDepth || halfGableDepth) * Math.tan(angleRad);
  const mainGableShape = useMemo(() => {
    const shape = new THREE.Shape();
    const beamCover = BEAM_SPECS.height;
    const depth = wingBounds.mainHalfGableDepth || halfGableDepth;
    const rHeight = mainRidgeHeight;
    shape.moveTo(-depth, -beamCover);
    shape.lineTo(depth, -beamCover);
    shape.lineTo(depth, 0);
    shape.lineTo(0, rHeight); // 본채 용마루 꼭짓점
    shape.lineTo(-depth, 0);
    shape.closePath();
    return shape;
  }, [wingBounds.mainHalfGableDepth, halfGableDepth, mainRidgeHeight]);

  const mainBargeboardLength = Math.hypot(wingBounds.mainHalfGableDepth || halfGableDepth, mainRidgeHeight) + 0.25;

  // [L자형 맞춤형 박공벽 1] 북측 본채 전용 반쪽 박공벽 (-Z 방향, 북측 경사면만 커버)
  // 기획서 및 가구식 위계 원칙: 빈 허공으로 박공벽이 삐져나가지 않도록 본채 용마루(0)에서 북측 기둥선(-mainHalfGableDepth)까지만 마감
  const halfGableNorthShape = useMemo(() => {
    const shape = new THREE.Shape();
    const beamCover = BEAM_SPECS.height;
    const depth = wingBounds.mainHalfGableDepth || halfGableDepth;
    const rHeight = mainRidgeHeight;
    shape.moveTo(-depth, -beamCover);
    shape.lineTo(0, -beamCover);
    shape.lineTo(0, rHeight); // 용마루 꼭짓점
    shape.lineTo(-depth, 0);
    shape.closePath();
    return shape;
  }, [wingBounds.mainHalfGableDepth, halfGableDepth, mainRidgeHeight]);

  // [L자형 맞춤형 박공벽 2] 남측 날개채 전용 반쪽 박공벽 (+Z 방향, 남측 경사면만 커버)
  // 남측 날개채의 동측 끝단(X = southMaxX)에서 남측 경사면을 마감
  const halfGableSouthShape = useMemo(() => {
    const shape = new THREE.Shape();
    const beamCover = BEAM_SPECS.height;
    shape.moveTo(0, -beamCover);
    shape.lineTo(halfGableDepth, -beamCover);
    shape.lineTo(halfGableDepth, 0);
    shape.lineTo(0, ridgeHeight); // 용마루 꼭짓점
    shape.closePath();
    return shape;
  }, [halfGableDepth, ridgeHeight]);

  // 박공벽 3D 입체 두께(압출) 설정
  const gableWallExtrudeSettings = useMemo(() => ({
    steps: 1,
    depth: GABLE_WALL_DEPTH, // 0.32m
    bevelEnabled: false,
  }), []);

  // 지붕 경사면을 따라 비스듬히 붙는 목재 풍판(박공널)의 사선 길이
  const bargeboardLength = Math.hypot(halfGableDepth, ridgeHeight) + 0.25;

  const currentStep = useBuildStore((state) => state.currentStep);
  // STEP 4 이상이거나 이미 hasRoof가 활성화된 경우 렌더링
  const isRoofActive = hasRoof || currentStep >= 4;
  if (!isRoofActive) return null;

  return (
    <group onClick={handleRoofClick}>
      {/* --------------------------------------------------------------------- */}
      {/* 1. 용마루 종도리 (지붕 꼭대기에서 서까래들의 머리를 받쳐주는 중심 원목 - 종도리가 배치되었을 때만 표시) */}
      {/* --------------------------------------------------------------------- */}
      {hasRidgePurlin && (
        <mesh position={[centerX, ridgeY, centerZ]} castShadow>
          <boxGeometry args={[actualRoofWidth, 0.28, 0.32]} />
          <meshStandardMaterial color="#3d2516" roughness={0.7} />
        </mesh>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 2. 용마루 마감 부재 (전체 완성 시 자동 추가되는 전통 착고/부적/용마루 수키와 적층 마감) */}
      {/* --------------------------------------------------------------------- */}
      {isAllRoofTilesFilled ? (
        <group>
          {/* [마감 부재 1] 착고 및 적새단 (마룻대 받침목 위에 얹히는 다층 흑회색 기와단) */}
          <mesh position={[centerX, ridgeY + 0.16, centerZ]} castShadow>
            <boxGeometry args={[actualRoofWidth + 0.08, 0.18, 0.42]} />
            <meshStandardMaterial color="#222528" roughness={0.7} metalness={0.15} />
          </mesh>

          {/* [마감 부재 2] 상단 2단 적새 (전통 겹기와의 묵직한 마감선) */}
          <mesh position={[centerX, ridgeY + 0.26, centerZ]} castShadow>
            <boxGeometry args={[actualRoofWidth + 0.04, 0.12, 0.32]} />
            <meshStandardMaterial color="#1c1e20" roughness={0.65} metalness={0.2} />
          </mesh>

          {/* [마감 부재 3] 최상단 둥근 용마루 수키와 능선 (Ridge Cap Top) */}
          <mesh position={[centerX, ridgeY + 0.35, centerZ]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, actualRoofWidth + 0.1, 24]} />
            <meshStandardMaterial color="#151718" roughness={0.55} metalness={0.3} />
          </mesh>

          {/* [마감 부재 4] 용마루 양 끝단 망와(취두/치미 모티브 장식 마감) */}
          <mesh position={[centerX - (actualRoofWidth + 0.1) / 2, ridgeY + 0.36, centerZ]} castShadow>
            <boxGeometry args={[0.1, 0.22, 0.26]} />
            <meshStandardMaterial color="#1a1c1d" roughness={0.5} metalness={0.3} />
          </mesh>
          <mesh position={[centerX + (actualRoofWidth + 0.1) / 2, ridgeY + 0.36, centerZ]} castShadow>
            <boxGeometry args={[0.1, 0.22, 0.26]} />
            <meshStandardMaterial color="#1a1c1d" roughness={0.5} metalness={0.3} />
          </mesh>
        </group>
      ) : (
        /* 일부만 채운 미완성 상태: 마룻대 받침목 위에 심플한 얇은 기준선만 유지 */
        <mesh position={[centerX, ridgeY + 0.15, centerZ]}>
          <boxGeometry args={[actualRoofWidth, 0.08, 0.24]} />
          <meshStandardMaterial color="#2a2d30" roughness={0.8} opacity={0.5} transparent />
        </mesh>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. 한옥 도리 시스템 (주심도리, 중도리, 종도리 - 인터랙티브 및 스냅 포인트) */}
      {/* --------------------------------------------------------------------- */}
      {purlinSlots.map((slot) => {
        // [완전 일관성]: 3개 레벨 도리(주심도리, 중도리, 종도리) 모두 placedParts에 실제로 존재하는지 여부로만 배치 판단
        const isPlaced = placedParts.some((p) => p.id === slot.id);
        const isHovered = hoveredSlotId === slot.id;
        const slotLength = slot.length || (actualRoofWidth - 0.2);

        return (
          <group key={slot.id}>
            {isPlaced ? (
              // [실제 도리 부재]: 클릭 시 제거(토글) 가능
              <mesh
                position={slot.position}
                rotation={[0, 0, Math.PI / 2]}
                castShadow
                onClick={(e) => handlePurlinSlotClick(e, slot, true)}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'auto';
                }}
              >
                <cylinderGeometry args={[doriRadius, doriRadius, slotLength, 16]} />
                <meshStandardMaterial color="#3d2516" roughness={0.72} />
              </mesh>
            ) : (
              // [도리 스냅 포인트 & Ghost 프리뷰]: 비어있는 슬롯
              <group>
                {/* 투명 스냅 감지 영역 (마우스 호버 및 클릭 감지) */}
                <mesh
                  position={slot.position}
                  rotation={[0, 0, Math.PI / 2]}
                  onClick={(e) => handlePurlinSlotClick(e, slot, false)}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    setHoveredSlotId(slot.id);
                    document.body.style.cursor = 'pointer';
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    setHoveredSlotId(null);
                    document.body.style.cursor = 'auto';
                  }}
                >
                  <cylinderGeometry args={[doriRadius * 1.5, doriRadius * 1.5, slotLength, 8]} />
                  <meshBasicMaterial visible={false} />
                </mesh>

                {/* 마우스 호버 시 또는 도리 부재 선택 시 보여지는 반투명 Ghost 프리뷰 */}
                {(isHovered || selectedPart === 'dori_purin') && (
                  <mesh
                    position={slot.position}
                    rotation={[0, 0, Math.PI / 2]}
                  >
                    <cylinderGeometry args={[doriRadius, doriRadius, slotLength, 16]} />
                    <meshStandardMaterial
                      color={isHovered ? '#4ade80' : '#38bdf8'}
                      transparent
                      opacity={isHovered ? 0.65 : 0.25}
                      roughness={0.5}
                    />
                  </mesh>
                )}
              </group>
            )}
          </group>
        );
      })}

      {/* --------------------------------------------------------------------- */}
      {/* 4. 처마 평고자 (서까래 끝단 바로 밑에 밀착되어 서까래들을 가지런히 받치는 부재) */}
      {/* [개선 적용]: 서까래가 설치되기 전에 공중에 홀로 떠 보이는 현상을 방지하기 위해, */}
      {/* 해당 경사면에 서까래가 1개 이상 실제로 배치되었을 때만 자연스럽게 나타나도록 조건부 렌더링 */}
      {/* (L자형 평면 시 남측 처마 평고자는 남측 날개채의 폭과 중심에 정밀 정렬) */}
      {/* --------------------------------------------------------------------- */}
      {/* 남측 전면 처마 평고자: 남측 서까래가 1개 이상 존재할 때만 렌더링 */}
      {placedRafters.some((r) => r.id.includes('south') || r.position[2] > centerZ) && (() => {
        const sCenterX = (wingBounds.southMinX + wingBounds.southMaxX) / 2;
        const sWidth = (wingBounds.southMaxX - wingBounds.southMinX) + eavesOverhangX * 2 - 0.08;
        return (
          <mesh position={[sCenterX, eavesPurlinY, centerZ + halfDepth - 0.06]} castShadow>
            <boxGeometry args={[sWidth, purlinHeight, 0.14]} />
            <meshStandardMaterial color="#3d2516" roughness={0.7} />
          </mesh>
        );
      })()}
      {/* 북측 후면 처마 평고자: 북측 서까래가 1개 이상 존재할 때만 렌더링 */}
      {placedRafters.some((r) => r.id.includes('north') || r.position[2] < centerZ) && (() => {
        const nCenterX = (wingBounds.northMinX + wingBounds.northMaxX) / 2;
        const nWidth = (wingBounds.northMaxX - wingBounds.northMinX) + eavesOverhangX * 2 - 0.08;
        return (
          <mesh position={[nCenterX, eavesPurlinY, centerZ - halfDepth + 0.06]} castShadow>
            <boxGeometry args={[nWidth, purlinHeight, 0.14]} />
            <meshStandardMaterial color="#3d2516" roughness={0.7} />
          </mesh>
        );
      })()}

      {/* --------------------------------------------------------------------- */}
      {/* 5. 원목 서까래 시스템 (실제 배치된 서까래 + 비어있는 스냅 슬롯 & Ghost 프리뷰) */}
      {/* --------------------------------------------------------------------- */}
      {rafterSlots.map((slot) => {
        // placedParts에 등록되어 있는지 여부 확인
        const isPlaced = placedParts.some((p) => p.id === slot.id);
        const isHovered = hoveredRafterId === slot.id;

        return (
          <group key={slot.id}>
            {isPlaced ? (
              // [실제 배치된 서까래]: 도리 3점을 관통하며 걸쳐지는 실린더 원목 (클릭 시 제거/토글)
              <mesh
                position={slot.position}
                rotation={slot.rotation}
                castShadow
                onClick={(e) => handleRafterSlotClick(e, slot, true)}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'auto';
                }}
              >
                <cylinderGeometry args={[rafterRadius, rafterRadius, slot.length, 16]} />
                <meshStandardMaterial color="#553721" roughness={0.8} />
              </mesh>
            ) : (
              // [비어있는 서까래 스냅 슬롯]: 호버 감지 및 Ghost 프리뷰
              <group>
                {/* 투명 스냅 감지 영역 (마우스 인터랙션 히트박스) */}
                <mesh
                  position={slot.position}
                  rotation={slot.rotation}
                  onClick={(e) => handleRafterSlotClick(e, slot, false)}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    setHoveredRafterId(slot.id);
                    document.body.style.cursor = 'pointer';
                  }}
                  onPointerOut={(e) => {
                    e.stopPropagation();
                    setHoveredRafterId(null);
                    document.body.style.cursor = 'auto';
                  }}
                >
                  <cylinderGeometry args={[rafterRadius * 2, rafterRadius * 2, slot.length, 8]} />
                  <meshBasicMaterial visible={false} />
                </mesh>

                {/* 마우스 호버 시 또는 서까래 부재(rafter_seokkarae) 선택 시 보여지는 반투명 Ghost 프리뷰 */}
                {(isHovered || selectedPart === 'rafter_seokkarae') && (
                  <mesh
                    position={slot.position}
                    rotation={slot.rotation}
                  >
                    <cylinderGeometry args={[rafterRadius, rafterRadius, slot.length, 16]} />
                    <meshStandardMaterial
                      color={isHovered ? '#4ade80' : '#38bdf8'}
                      transparent
                      opacity={isHovered ? 0.7 : 0.25}
                      roughness={0.5}
                    />
                  </mesh>
                )}
              </group>
            )}
          </group>
        );
      })}

      {/* --------------------------------------------------------------------- */}
      {/* 6. 기와골 가이드 라인 및 암·수키와 적층 시스템 (4-1, 4-2) */}
      {/*    - 각 서까래와 1:1 대응하여 처마(Eave)부터 용마루(Ridge)까지 연결 */}
      {/*    - 가이드 라인 클릭 시: 해당 골 전체에 암키와(아래) + 수키와(위) 적층 */}
      {/*    - 이미 채워진 골 재클릭 시: 토글로 제거 */}
      {/* --------------------------------------------------------------------- */}
      {placedRafters.map((rafter) => {
        const isSouth = rafter.id.includes('south') || rafter.position[2] > centerZ;
        const lineId = rafter.id.replace('rafter_', '').replace('_', '-');
        const isFilled = placedRoofTiles.some((t) => t.line === lineId);
        const isHovered = hoveredTileLineId === lineId;
        const rx = rafter.position[0];

        // 처마 끝 좌표 (Eave Point): 서까래 끝단 표면 (+rafterRadius)
        const eaveZ = isSouth ? centerZ + halfDepth : centerZ - halfDepth;
        const eaveY = rafterEndY + rafterRadius + 0.015;

        // 용마루 좌표 (Ridge Point): 용마루 중심선, 서까래 상부면
        const rZ = centerZ;
        const rY = ridgeY + rafterRadius + 0.015;

        // 중심 위치 및 회전각 (Three.js Cylinder의 주축인 Y축을 경사면 방향으로 눕히기 위해 Math.PI / 2 가산)
        const centerY = (eaveY + rY) / 2;
        const midZ = (eaveZ + rZ) / 2;
        const rotX = isSouth ? (angleRad + Math.PI / 2) : (-angleRad + Math.PI / 2);

        // 반반 절개 모드(isHalfCutMode !== false) 활성화 시:
        // 남측(전면) 서까래는 가구 골조 전시를 위해 기와골 가이드라인을 숨겨 내부 목구조를 100% 훤히 노출
        const isGuideVisible = !isSouth || params.isHalfCutMode === false || isFilled;
        if (!isGuideVisible) return null;

        // 전통 기와 적층 단위 계산 (처마에서 용마루까지 약 30cm 간격으로 중첩 배치)
        const tileCount = Math.max(6, Math.round(slopeLength / 0.32));
        const tileStep = slopeLength / tileCount;

        return (
          <group key={`tile_line_group_${rafter.id}`}>
            {/* ----------------------------------------------------------------- */}
            {/* [A] 기와골 가이드 라인 (4-1): 서까래 상단 안내선 및 앵커 포인트 */}
            {/* [사용자 요구사항]: 이미 기와가 시공된 골(isFilled === true)은 가이드선 메쉬 자체를 완전히 숨김 */}
            {/* 아직 기와가 시공되지 않은 빈 골에 대해서만 녹색 가이드선과 스냅 앵커 닷 렌더링 */}
            {/* ----------------------------------------------------------------- */}
            {!isFilled && (
              <>
                <mesh
                  position={[rx, centerY, midZ]}
                  rotation={[rotX, 0, 0]}
                >
                  <cylinderGeometry args={[0.012, 0.012, slopeLength, 8]} />
                  <meshStandardMaterial
                    color={isHovered ? '#6ee7b7' : '#34d399'}
                    emissive={isHovered ? '#10b981' : '#059669'}
                    emissiveIntensity={isHovered ? 1.2 : 0.8}
                    roughness={0.2}
                  />
                </mesh>

                {/* 처마 시작점 스냅 앵커 포인트 (원형 닷) */}
                <mesh position={[rx, eaveY, eaveZ]}>
                  <sphereGeometry args={[isHovered ? 0.032 : 0.024, 12, 12]} />
                  <meshStandardMaterial
                    color={isHovered ? '#a7f3d0' : '#34d399'}
                    emissive={isHovered ? '#10b981' : '#059669'}
                    emissiveIntensity={isHovered ? 1.4 : 0.9}
                  />
                </mesh>

                {/* 용마루 끝점 스냅 앵커 포인트 (원형 닷) */}
                <mesh position={[rx, rY, rZ]}>
                  <sphereGeometry args={[isHovered ? 0.028 : 0.02, 12, 12]} />
                  <meshStandardMaterial
                    color={isHovered ? '#a7f3d0' : '#6ee7b7'}
                    emissive={isHovered ? '#10b981' : '#059669'}
                    emissiveIntensity={isHovered ? 1.4 : 0.9}
                  />
                </mesh>
              </>
            )}

            {/* ----------------------------------------------------------------- */}
            {/* [B] 투명 클릭/호버 감지 히트박스 (클릭 영역 확장) */}
            {/* ----------------------------------------------------------------- */}
            <mesh
              position={[rx, centerY, midZ]}
              rotation={[rotX, 0, 0]}
              onClick={(e) => handleTileLineClick(e, lineId, rafter, isSouth)}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredTileLineId(lineId);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredTileLineId(null);
                document.body.style.cursor = 'auto';
              }}
            >
              <cylinderGeometry args={[0.16, 0.16, slopeLength, 8]} />
              <meshBasicMaterial visible={false} />
            </mesh>

            {/* ----------------------------------------------------------------- */}
            {/* [C] 전통 암키와·수키와 적층 메쉬 (자연스럽게 누워서 겹쳐지는 전통 와구) */}
            {/* ----------------------------------------------------------------- */}
            {isFilled && (
              <group
                onClick={(e) => handleTileLineClick(e, lineId, rafter, isSouth)}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredTileLineId(lineId);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                  e.stopPropagation();
                  setHoveredTileLineId(null);
                  document.body.style.cursor = 'auto';
                }}
              >
                {Array.from({ length: tileCount }).map((_, idx) => {
                  // 처마(t=0.0)에서부터 용마루(t=1.0) 쪽으로 일정 간격 전진
                  const t = (idx + 0.5) / tileCount;
                  const curY = eaveY + (rY - eaveY) * t;
                  const curZ = eaveZ + (rZ - eaveZ) * t;

                  // 층층이 물려 내려오는 한옥 기와 겹침 두께 오프셋 (+Y 방향 미세 누적)
                  const layerLift = idx * 0.003;

                  // 지붕 경사면 평행 회전각 (boxGeometry는 Z축이 길이이므로 angleRad로 회전)
                  const slopePitch = isSouth ? angleRad : -angleRad;

                  return (
                    <group
                      key={`tile_${lineId}_${idx}`}
                      position={[rx, curY + layerLift, curZ]}
                      rotation={[slopePitch, 0, 0]}
                    >
                      {/* 1. 하단 암키와 (바닥에 넓게 누워 빗물을 받는 오목 바닥 기와) */}
                      {/* 폭 36cm, 두께 2.2cm, 경사길이 방향으로 중첩되는 길이 */}
                      <mesh
                        position={[0, 0.015, 0]}
                        castShadow
                        receiveShadow
                      >
                        <boxGeometry args={[0.36, 0.022, tileStep * 1.25]} />
                        <meshStandardMaterial
                          color="#282a2c"
                          roughness={0.88}
                          metalness={0.12}
                        />
                      </mesh>

                      {/* 2. 상단 수키와 (암키와 이음새 중심을 볼록하게 덮는 반원통 기와) */}
                      {/* X축으로 90도 눕히고, 둥근 곡면이 위(+Y)를 향하도록 Math.PI 오프셋 적용 */}
                      <mesh
                        position={[0, 0.052, 0]}
                        rotation={[Math.PI / 2, 0, 0]}
                        castShadow
                        receiveShadow
                      >
                        <cylinderGeometry
                          args={[0.075, 0.075, tileStep * 1.2, 16, 1, false, Math.PI, Math.PI]}
                        />
                        <meshStandardMaterial
                          color="#1b1c1e"
                          roughness={0.72}
                          metalness={0.22}
                        />
                      </mesh>
                    </group>
                  );
                })}

                {/* 3. 처마 끝단 수막새 (연꽃문양 둥근 마감 기와: 처마 끝 수키와 마구리를 막음) */}
                <mesh
                  position={[rx, eaveY + 0.045, eaveZ + (isSouth ? 0.04 : -0.04)]}
                  rotation={[isSouth ? angleRad : -angleRad, 0, 0]}
                  castShadow
                >
                  <cylinderGeometry args={[0.08, 0.08, 0.035, 20]} />
                  <meshStandardMaterial
                    color="#171819"
                    roughness={0.6}
                    metalness={0.25}
                  />
                </mesh>
              </group>
            )}
          </group>
        );
      })}

      {/* --------------------------------------------------------------------- */}
      {/* 7. 전통 박공벽(합각벽) 및 풍판 (외벽선과 오차 없는 완벽 대칭 정렬) */}
      {/* --------------------------------------------------------------------- */}
      {/* [동측(East) 박공벽 렌더링 분기]:
          - 일반 직사각형 평면: 동측 기둥선(maxX) 전체를 커버하는 기본 오각형 박공벽 1개 렌더링
          - L자형 평면 (방법 1 - 날개채 분기형 가구 구조):
            1) 북측 본채 동측 마감: maxX (= northMaxX)에서 북측 반쪽(halfGableNorthShape)만 압출 마감하여 허공 침범 방지
            2) 남측 날개채 동측 마감: southMaxX에서 남측 반쪽(halfGableSouthShape)을 건물 안쪽(-X)으로 압출 마감
      */}
      {wingBounds.hasLShape ? (
        <>
          {/* [다채 L자형 1] 동측 본채 전체 박공벽 (북측 본채가 동측 끝단 maxX에 위치할 때 본채 Z구간 전체를 커버) */}
          {wingBounds.hasEastNorth && (
            <group position={[wingBounds.northMaxX, baseBeamY, wingBounds.mainRidgeZ]}>
              <mesh rotation={[0, -Math.PI / 2, 0]} position={[0, 0, 0]} castShadow receiveShadow>
                <extrudeGeometry args={[mainGableShape, gableWallExtrudeSettings]} />
                <meshStandardMaterial color="#947553" roughness={0.9} metalness={0.02} />
              </mesh>
              {/* 본채 대공 */}
              <mesh position={[-0.12, mainRidgeHeight / 2, 0]} castShadow>
                <boxGeometry args={[0.22, mainRidgeHeight, 0.18]} />
                <meshStandardMaterial color="#3d2516" roughness={0.75} />
              </mesh>
              {/* 본채 북측 풍판 */}
              <mesh
                position={[0.02, mainRidgeHeight / 2, -wingBounds.mainHalfGableDepth / 2]}
                rotation={[-angleRad, 0, 0]}
                castShadow
              >
                <boxGeometry args={[0.06, 0.18, mainBargeboardLength]} />
                <meshStandardMaterial color="#2d1c11" roughness={0.65} />
              </mesh>
              {/* 본채 남측 풍판 */}
              <mesh
                position={[0.02, mainRidgeHeight / 2, wingBounds.mainHalfGableDepth / 2]}
                rotation={[angleRad, 0, 0]}
                castShadow
              >
                <boxGeometry args={[0.06, 0.18, mainBargeboardLength]} />
                <meshStandardMaterial color="#2d1c11" roughness={0.65} />
              </mesh>
            </group>
          )}

          {/* [다채 L자형 2] 남측 날개채 동측 박공벽 (남측 날개채가 건물 최외곽 동측에 돌출된 경우에만 외벽 박공벽 렌더링) */}
          {wingBounds.hasEastSouth && wingBounds.southMaxX >= maxX - 0.3 && (
            <group position={[wingBounds.southMaxX, baseBeamY, centerZ]}>
              <mesh rotation={[0, -Math.PI / 2, 0]} position={[0, 0, 0]} castShadow receiveShadow>
                <extrudeGeometry args={[halfGableSouthShape, gableWallExtrudeSettings]} />
                <meshStandardMaterial color="#947553" roughness={0.9} metalness={0.02} />
              </mesh>
              {/* 대공 */}
              <mesh position={[-0.12, ridgeHeight / 2, 0.05]} castShadow>
                <boxGeometry args={[0.22, ridgeHeight, 0.15]} />
                <meshStandardMaterial color="#3d2516" roughness={0.75} />
              </mesh>
              {/* 남측 방향 풍판 */}
              <mesh
                position={[0.02, ridgeHeight / 2, halfGableDepth / 2]}
                rotation={[angleRad, 0, 0]}
                castShadow
              >
                <boxGeometry args={[0.06, 0.18, bargeboardLength]} />
                <meshStandardMaterial color="#2d1c11" roughness={0.65} />
              </mesh>
            </group>
          )}
        </>
      ) : (
        /* 일반 직사각형 평면 동측 박공벽: 건물 외벽선(maxX)에서 건물 안쪽(-X)으로 전체 압출 */
        <group position={[maxX, baseBeamY, centerZ]}>
          {/* 합각 흙벽/회벽 채움면 */}
          <mesh
            rotation={[0, -Math.PI / 2, 0]}
            position={[0, 0, 0]}
            castShadow
            receiveShadow
          >
            <extrudeGeometry args={[gableShape, gableWallExtrudeSettings]} />
            <meshStandardMaterial
              color="#947553"
              roughness={0.9}
              metalness={0.02}
            />
          </mesh>

          {/* 대공 (삼각형 중앙을 수직으로 받치는 중심 목재 기둥) */}
          <mesh position={[-0.12, ridgeHeight / 2, 0]} castShadow>
            <boxGeometry args={[0.22, ridgeHeight, 0.2]} />
            <meshStandardMaterial color="#3d2516" roughness={0.75} />
          </mesh>

          {/* 종보 (대공을 좌우에서 잡아주는 가로 구조재) */}
          <mesh position={[-0.12, ridgeHeight * 0.45, 0]} castShadow>
            <boxGeometry args={[0.2, 0.16, halfGableDepth * 0.95]} />
            <meshStandardMaterial color="#3d2516" roughness={0.75} />
          </mesh>

          {/* 풍판(박공널): 외벽선 바로 바깥 2cm(+0.02m)에서 지붕 경사선을 따라 배치 */}
          {/* 남측 방향 풍판 */}
          <mesh
            position={[0.02, ridgeHeight / 2, halfGableDepth / 2]}
            rotation={[angleRad, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.06, 0.18, bargeboardLength]} />
            <meshStandardMaterial color="#2d1c11" roughness={0.65} />
          </mesh>
          {/* 북측 방향 풍판 */}
          <mesh
            position={[0.02, ridgeHeight / 2, -halfGableDepth / 2]}
            rotation={[-angleRad, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.06, 0.18, bargeboardLength]} />
            <meshStandardMaterial color="#2d1c11" roughness={0.65} />
          </mesh>
        </group>
      )}

      {/* 서측(West) 박공벽: 건물 외벽선(minX)에서 건물 안쪽(+X)으로 정확히 압출 */}
      {/* L자형 평면일 때, 서측에 기둥/벽체가 없는 빈 공간으로 박공벽이 돌출되지 않도록 실제 존재하는 반쪽만 마감 */}
      {wingBounds.hasLShape ? (
        <>
          {/* [L자형 서측 1] 북측 본채 서측 박공벽 (북측 기둥/벽체가 서측 끝단까지 도달한 경우, 본채 용마루 기준 북측 반쪽 마감) */}
          {wingBounds.hasWestNorth && (
            <group position={[wingBounds.northMinX, baseBeamY, wingBounds.mainRidgeZ]}>
              <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0]} castShadow receiveShadow>
                <extrudeGeometry args={[halfGableNorthShape, gableWallExtrudeSettings]} />
                <meshStandardMaterial color="#947553" roughness={0.9} metalness={0.02} />
              </mesh>
              {/* 대공 */}
              <mesh position={[0.12, mainRidgeHeight / 2, -0.05]} castShadow>
                <boxGeometry args={[0.22, mainRidgeHeight, 0.15]} />
                <meshStandardMaterial color="#3d2516" roughness={0.75} />
              </mesh>
              {/* 북측 방향 풍판 */}
              <mesh
                position={[-0.02, mainRidgeHeight / 2, -wingBounds.mainHalfGableDepth / 2]}
                rotation={[-angleRad, 0, 0]}
                castShadow
              >
                <boxGeometry args={[0.06, 0.18, mainBargeboardLength]} />
                <meshStandardMaterial color="#2d1c11" roughness={0.65} />
              </mesh>
            </group>
          )}

          {/* [L자형 서측 2] 남측 날개채 서측 박공벽 (남측 기둥/벽체가 서측 끝단까지 도달한 경우에만 렌더링) */}
          {wingBounds.hasWestSouth && (
            <group position={[wingBounds.southMinX, baseBeamY, centerZ]}>
              <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0]} castShadow receiveShadow>
                <extrudeGeometry args={[halfGableSouthShape, gableWallExtrudeSettings]} />
                <meshStandardMaterial color="#947553" roughness={0.9} metalness={0.02} />
              </mesh>
              {/* 대공 */}
              <mesh position={[0.12, ridgeHeight / 2, 0.05]} castShadow>
                <boxGeometry args={[0.22, ridgeHeight, 0.15]} />
                <meshStandardMaterial color="#3d2516" roughness={0.75} />
              </mesh>
              {/* 남측 방향 풍판 */}
              <mesh
                position={[-0.02, ridgeHeight / 2, halfGableDepth / 2]}
                rotation={[angleRad, 0, 0]}
                castShadow
              >
                <boxGeometry args={[0.06, 0.18, bargeboardLength]} />
                <meshStandardMaterial color="#2d1c11" roughness={0.65} />
              </mesh>
            </group>
          )}
        </>
      ) : (
        /* 일반 직사각형 평면 서측 박공벽: 건물 외벽선(minX)에서 건물 안쪽(+X)으로 전체 압출 */
        <group position={[minX, baseBeamY, centerZ]}>
          {/* 합각 흙벽/회벽 채움면 */}
          <mesh
            rotation={[0, Math.PI / 2, 0]}
            position={[0, 0, 0]}
            castShadow
            receiveShadow
          >
            <extrudeGeometry args={[gableShape, gableWallExtrudeSettings]} />
            <meshStandardMaterial
              color="#947553"
              roughness={0.9}
              metalness={0.02}
            />
          </mesh>

          {/* 대공 (중심 기둥) */}
          <mesh position={[0.12, ridgeHeight / 2, 0]} castShadow>
            <boxGeometry args={[0.22, ridgeHeight, 0.2]} />
            <meshStandardMaterial color="#3d2516" roughness={0.75} />
          </mesh>

          {/* 종보 (가로 구조재) */}
          <mesh position={[0.12, ridgeHeight * 0.45, 0]} castShadow>
            <boxGeometry args={[0.2, 0.16, halfGableDepth * 0.95]} />
            <meshStandardMaterial color="#3d2516" roughness={0.75} />
          </mesh>

          {/* 풍판(박공널): 외벽선 바로 바깥 2cm(-0.02m)에서 지붕 경사선을 따라 배치 */}
          {/* 남측 방향 풍판 */}
          <mesh
            position={[-0.02, ridgeHeight / 2, halfGableDepth / 2]}
            rotation={[angleRad, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.06, 0.18, bargeboardLength]} />
            <meshStandardMaterial color="#2d1c11" roughness={0.65} />
          </mesh>
          {/* 북측 방향 풍판 */}
          <mesh
            position={[-0.02, ridgeHeight / 2, -halfGableDepth / 2]}
            rotation={[-angleRad, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.06, 0.18, bargeboardLength]} />
            <meshStandardMaterial color="#2d1c11" roughness={0.65} />
          </mesh>
        </group>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 8. 지붕 클릭 히트박스 (사용자가 지붕을 클릭해 선택하거나 삭제할 수 있는 투명 면) */}
      {/* --------------------------------------------------------------------- */}
      <mesh
        position={[centerX, baseBeamY + ridgeHeight / 2, centerZ + halfDepth / 2]}
        rotation={[angleRad, 0, 0]}
        onClick={handleRoofClick}
      >
        <planeGeometry args={[actualRoofWidth + 0.6, slopeLength + 0.5]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        position={[centerX, baseBeamY + ridgeHeight / 2, centerZ - halfDepth / 2]}
        rotation={[-angleRad, 0, 0]}
        onClick={handleRoofClick}
      >
        <planeGeometry args={[actualRoofWidth + 0.6, slopeLength + 0.5]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
