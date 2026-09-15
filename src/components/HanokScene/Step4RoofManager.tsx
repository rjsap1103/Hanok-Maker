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
  const { hasRoof, params, removeRoof } = useRoofStore();
  const { tileCount, roofAngle, rafterPitch } = params;

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

  // ---------------------------------------------------------------------------
  // [2단계] 한옥 전통 비례에 맞춘 지붕 및 서까래 치수 연산
  // ---------------------------------------------------------------------------
  // 전통 처마 내밀기(Eaves Overhang): 빗물이 벽체에 들이치지 않도록 기둥선 바깥으로 75cm 돌출
  const EAVES_OVERHANG = 0.75;

  // 삼각함수용 각도(라디안 변환): 60분법 각도(예: 27도)를 컴퓨터가 이해하는 라디안으로 변환
  const angleRad = (roofAngle * Math.PI) / 180;

  // 건물의 반쪽 깊이: 용마루(중앙)에서 앞뒤 기둥까지의 수평 거리
  const halfGableDepth = pillarSpanZ / 2;

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
  const actualRoofWidth = (maxX - minX) + EAVES_OVERHANG * 2; // 양쪽 처마 내밀기 포함 전체 폭
  const actualRoofDepth = pillarSpanZ + EAVES_OVERHANG * 2;   // 앞뒤 처마 내밀기 포함 전체 깊이
  const halfDepth = actualRoofDepth / 2;                      // 용마루에서 처마 끝까지의 수평 거리

  // 빗변 공식: 용마루에서 처마 끝까지 내려오는 서까래의 실제 비스듬한 총 길이 (밑변 / cos(각도))
  const slopeLength = halfDepth / Math.cos(angleRad);

  // [처마 평고자 높이 연산]: 처마 끝에서 서까래 중심 높이에서 서까래 반지름을 빼서, 서까래 "바로 밑"에 평고자가 딱 붙어 받치도록 설정
  const rafterEndY = ridgeY - halfDepth * Math.tan(angleRad); // 서까래 처마 끝 중심 Y
  const purlinHeight = 0.12;                                  // 평고자 각목의 두께(높이)
  const eavesPurlinY = rafterEndY - rafterRadius - purlinHeight / 2; // 평고자의 중심 Y 위치

  // ---------------------------------------------------------------------------
  // [신규 도리(Purlin) 좌표 계산 로직]: 주심도리, 중도리, 종도리 3단 구조
  // ---------------------------------------------------------------------------
  // 1. 종도리(Ridge Purlin): 용마루 중심선(centerZ)에서 서까래 머리 아랫면을 받치는 위치
  const ridgeDoriY = ridgeY - rafterRadius - doriRadius;

  // 2. 중도리(Middle Purlin): 주심도리와 종도리 사이의 정확한 중간 지점
  //    - Z축: 주심도리 위치(maxZ 또는 minZ)와 용마루(centerZ)의 정중앙
  //    - Y축: 지붕 경사각(angleRad)을 따라 서까래 하부면에 자연스럽게 접촉하는 높이 (doriY와 ridgeDoriY의 중간)
  const midSouthZ = (maxZ + centerZ) / 2;
  const midNorthZ = (minZ + centerZ) / 2;
  const midDoriY = (doriY + ridgeDoriY) / 2;

  // 도리 5개 슬롯 정의 (주심도리 2개 + 중도리 2개 + 종도리 1개)
  const purlinSlots = useMemo(() => {
    return [
      {
        id: 'purlin_eave_south',
        name: '남측 주심도리',
        level: 'eave' as const,
        position: [centerX, doriY, maxZ] as [number, number, number],
      },
      {
        id: 'purlin_eave_north',
        name: '북측 주심도리',
        level: 'eave' as const,
        position: [centerX, doriY, minZ] as [number, number, number],
      },
      {
        id: 'purlin_middle_south',
        name: '남측 중도리',
        level: 'middle' as const,
        position: [centerX, midDoriY, midSouthZ] as [number, number, number],
      },
      {
        id: 'purlin_middle_north',
        name: '북측 중도리',
        level: 'middle' as const,
        position: [centerX, midDoriY, midNorthZ] as [number, number, number],
      },
      {
        id: 'purlin_ridge',
        name: '용마루 종도리',
        level: 'ridge' as const,
        position: [centerX, ridgeDoriY, centerZ] as [number, number, number],
      },
    ];
  }, [centerX, doriY, maxZ, minZ, midDoriY, midSouthZ, midNorthZ, ridgeDoriY, centerZ]);

  // 호버 중인 도리 슬롯 ID 상태 (Ghost 프리뷰용)
  const [hoveredSlotId, setHoveredSlotId] = React.useState<string | null>(null);

  // 스토어 액션 및 현재 선택된 부재
  const addPart = useBuildStore((state) => state.addPart);
  const removePart = useBuildStore((state) => state.removePart);
  const selectedPart = useBuildStore((state) => state.selectedPart);
  // 수동으로 제거된 도리 ID 목록 상태
  const [removedPurlinIds, setRemovedPurlinIds] = React.useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // [도리 일관성 보장]: 
  // 지붕이 생성되어 있을 때, 아직 도리가 placedParts에 등록되지 않았다면 
  // 3개 레벨의 도리(주심도리, 중도리, 종도리)를 동일한 방식으로 placedParts에 자동 동기화합니다.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!hasRoof) return;

    // 현재 placedParts에 등록된 도리 ID 확인
    const existingPurlinIds = new Set(
      placedParts.filter((p) => p.type === 'purlin' || p.purlinLevel || p.id.startsWith('purlin_')).map((p) => p.id)
    );

    // 아직 등록되지 않은 도리 슬롯 탐색 (사용자가 의도적으로 제거한 도리는 제외)
    const missingPurlins: PlacedPart[] = [];
    purlinSlots.forEach((slot) => {
      if (!existingPurlinIds.has(slot.id) && !removedPurlinIds.has(slot.id)) {
        missingPurlins.push({
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

    if (missingPurlins.length > 0) {
      useBuildStore.setState((state) => ({
        placedParts: [...state.placedParts, ...missingPurlins],
      }));
    }
  }, [hasRoof, purlinSlots, removedPurlinIds]);

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
      setRemovedPurlinIds((prev) => new Set([...prev, slot.id]));
    } else {
      // 비어있는 도리 슬롯 클릭 시 새 도리 확정 배치
      setRemovedPurlinIds((prev) => {
        const next = new Set(prev);
        next.delete(slot.id);
        return next;
      });
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

  // ---------------------------------------------------------------------------
  // [3단계] 서까래(연목) 3D 배열 데이터 생성 (앞뒤 경사면 전체에 촘촘하게 배치)
  // ---------------------------------------------------------------------------
  const rafterData = useMemo(() => {
    if (!hasRoof) return [];
    // 지붕 가로폭에 서까래 간격(rafterPitch)을 나누어 필요한 서까래 열(기둥 개수) 계산
    const countAlongWidth = Math.max(4, Math.round(actualRoofWidth / rafterPitch));
    const stepX = actualRoofWidth / (countAlongWidth - 1); // 서까래 간의 X축 간격
    const startX = centerX - actualRoofWidth / 2;          // 가장 좌측 서까래의 시작 X 좌표

    const list: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
      length: number;
    }> = [];

    // 가로 폭을 따라 서까래 쌍(전면 남측 1개 + 후면 북측 1개)을 규칙적으로 생성
    for (let i = 0; i < countAlongWidth; i++) {
      const rx = startX + i * stepX;

      // 남측 슬로프 (전면, Z 양수 방향): 용마루에서 앞쪽 처마로 비스듬히 기울어짐
      list.push({
        position: [rx, ridgeY - (slopeLength / 2) * Math.sin(angleRad), centerZ + (halfDepth / 2)],
        rotation: [angleRad + Math.PI / 2, 0, 0], // X축 회전을 통해 지붕 물매 각도 형성
        length: slopeLength,
      });

      // 북측 슬로프 (후면, Z 음수 방향): 용마루에서 뒤쪽 처마로 비스듬히 기울어짐
      list.push({
        position: [rx, ridgeY - (slopeLength / 2) * Math.sin(angleRad), centerZ - (halfDepth / 2)],
        rotation: [-angleRad + Math.PI / 2, 0, 0],
        length: slopeLength,
      });
    }

    return list;
  }, [hasRoof, actualRoofWidth, rafterPitch, angleRad, centerX, centerZ, ridgeY, slopeLength, halfDepth]);

  // ---------------------------------------------------------------------------
  // [4단계] 전통 기와 배치 (용마루 기준 반반 절개: 전면은 골조 노출, 후면만 기와 마감)
  // ---------------------------------------------------------------------------
  const femaleTileRef = useRef<THREE.InstancedMesh>(null); // 바닥에 깔리는 오목한 암키와 메쉬 참조
  const maleTileRef = useRef<THREE.InstancedMesh>(null);   // 암키와 이음매를 덮는 볼록한 수키와 메쉬 참조

  const cols = tileCount;                                 // 가로 방향 기와 골 개수 (예: 20열)
  const colStepX = actualRoofWidth / (cols - 1);          // 기와 1열당 가로 간격
  const startX = centerX - actualRoofWidth / 2;           // 기와 1열의 시작 위치

  // 경사면을 따라 내려갈 기와 단수 계산 (기와 1장 길이 약 35cm 기준)
  const tilesPerSlope = Math.max(5, Math.round(slopeLength / 0.35)) + 1;
  const rowStepS = slopeLength / tilesPerSlope;           // 기와 1단당 경사면 간격

  // [핵심]: 후면(북측 슬로프 1면)에만 기와를 얹으므로 총 인스턴스 수는 가로열 * 단수
  const totalInstances = cols * tilesPerSlope;

  useEffect(() => {
    if (!hasRoof) return;
    if (!femaleTileRef.current || !maleTileRef.current) return;

    const fMesh = femaleTileRef.current;
    const mMesh = maleTileRef.current;

    const tempObj = new THREE.Object3D();
    let index = 0;

    // 북측 슬로프(후면, -Z 방향)에만 기와 배치 루프 실행
    const rotX = -angleRad;

    for (let c = 0; c < cols; c++) {
      const tx = startX + c * colStepX;

      for (let r = 0; r < tilesPerSlope; r++) {
        // r=0: 용마루 바로 밑에서 시작, r=끝: 처마 끝단까지 완벽히 내려앉음
        const sDist = (r + 0.12) * rowStepS;
        const ty = ridgeY - sDist * Math.sin(angleRad);
        const tz = centerZ - (sDist * Math.cos(angleRad)); // 후면(-Z) 방향으로 배치

        // 한옥 특유의 완만한 지붕 처마 곡선(물매 곡선미) 적용
        const sag = Math.sin((r / tilesPerSlope) * Math.PI) * -0.06;

        // 1) 암키와 (바닥에 평평하게 깔리는 기와)
        tempObj.position.set(tx, ty + sag, tz);
        tempObj.rotation.set(rotX, 0, 0);
        tempObj.scale.set(colStepX * 1.02, 0.04, rowStepS * 1.18); // 약간 겹치게 하여 틈새 빛샘 차단
        tempObj.updateMatrix();
        fMesh.setMatrixAt(index, tempObj.matrix);

        // 2) 수키와 (암키와 위에 반원통형으로 덮이는 기와)
        tempObj.position.set(tx, ty + sag + 0.035, tz);
        tempObj.rotation.set(rotX + Math.PI / 2, 0, 0); // 지붕 경사 방향으로 원통 회전
        tempObj.scale.set(0.09, rowStepS * 1.08, 0.09);
        tempObj.updateMatrix();
        mMesh.setMatrixAt(index, tempObj.matrix);

        index++;
      }
    }

    // Three.js 인스턴스 행렬 버퍼 갱신 (화면에 즉시 반영)
    fMesh.instanceMatrix.needsUpdate = true;
    mMesh.instanceMatrix.needsUpdate = true;
  }, [hasRoof, cols, startX, colStepX, tilesPerSlope, rowStepS, angleRad, centerZ, ridgeY, slopeLength]);

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
  // 하부 사각 기둥 결구부(대들보 커버) + 상부 삼각형 합각면이 결합된 오각형 단면
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

  // 박공벽 3D 입체 두께(압출) 설정
  const gableWallExtrudeSettings = useMemo(() => ({
    steps: 1,
    depth: GABLE_WALL_DEPTH, // 0.32m
    bevelEnabled: false,
  }), []);

  // 지붕 경사면을 따라 비스듬히 붙는 목재 풍판(박공널)의 사선 길이
  const bargeboardLength = Math.hypot(halfGableDepth, ridgeHeight) + 0.25;

  if (!hasRoof) return null;

  return (
    <group onClick={handleRoofClick}>
      {/* --------------------------------------------------------------------- */}
      {/* 1. 용마루 종도리 (지붕 꼭대기에서 서까래들의 머리를 받쳐주는 중심 원목) */}
      {/* --------------------------------------------------------------------- */}
      <mesh position={[centerX, ridgeY, centerZ]} castShadow>
        <boxGeometry args={[actualRoofWidth, 0.28, 0.32]} />
        <meshStandardMaterial color="#3d2516" roughness={0.7} />
      </mesh>

      {/* --------------------------------------------------------------------- */}
      {/* 2. 용마루 장식 기와단 (용마루 중심선 전체를 정갈하게 덮어주는 수키와 마감) */}
      {/* --------------------------------------------------------------------- */}
      <mesh position={[centerX, ridgeY + 0.18, centerZ]} castShadow>
        <boxGeometry args={[actualRoofWidth, 0.22, 0.38]} />
        <meshStandardMaterial color="#222528" roughness={0.65} metalness={0.2} />
      </mesh>
      {/* 용마루 최상단 둥근 수키와 능선 */}
      <mesh position={[centerX, ridgeY + 0.3, centerZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, actualRoofWidth, 24]} />
        <meshStandardMaterial color="#1a1c1e" roughness={0.6} metalness={0.25} />
      </mesh>

      {/* --------------------------------------------------------------------- */}
      {/* 3. 한옥 도리 시스템 (주심도리, 중도리, 종도리 - 인터랙티브 및 스냅 포인트) */}
      {/* --------------------------------------------------------------------- */}
      {purlinSlots.map((slot) => {
        // [완전 일관성]: 3개 레벨 도리(주심도리, 중도리, 종도리) 모두 placedParts에 실제로 존재하는지 여부로만 배치 판단
        const isPlaced = placedParts.some((p) => p.id === slot.id);
        const isHovered = hoveredSlotId === slot.id;

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
                <cylinderGeometry args={[doriRadius, doriRadius, actualRoofWidth - 0.2, 16]} />
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
                  <cylinderGeometry args={[doriRadius * 1.5, doriRadius * 1.5, actualRoofWidth - 0.2, 8]} />
                  <meshBasicMaterial visible={false} />
                </mesh>

                {/* 마우스 호버 시 또는 도리 부재 선택 시 보여지는 반투명 Ghost 프리뷰 */}
                {(isHovered || selectedPart === 'dori_purin') && (
                  <mesh
                    position={slot.position}
                    rotation={[0, 0, Math.PI / 2]}
                  >
                    <cylinderGeometry args={[doriRadius, doriRadius, actualRoofWidth - 0.2, 16]} />
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
      {/* --------------------------------------------------------------------- */}
      {/* 남측 전면 처마 평고자 */}
      <mesh position={[centerX, eavesPurlinY, centerZ + halfDepth - 0.06]} castShadow>
        <boxGeometry args={[actualRoofWidth - 0.08, purlinHeight, 0.14]} />
        <meshStandardMaterial color="#3d2516" roughness={0.7} />
      </mesh>
      {/* 북측 후면 처마 평고자 */}
      <mesh position={[centerX, eavesPurlinY, centerZ - halfDepth + 0.06]} castShadow>
        <boxGeometry args={[actualRoofWidth - 0.08, purlinHeight, 0.14]} />
        <meshStandardMaterial color="#3d2516" roughness={0.7} />
      </mesh>

      {/* --------------------------------------------------------------------- */}
      {/* 5. 원목 서까래 열 (상단과 하단이 동일한 지름 16cm의 균일한 원목 기둥) */}
      {/* --------------------------------------------------------------------- */}
      {rafterData.map((raf, i) => (
        <mesh key={i} position={raf.position} rotation={raf.rotation} castShadow>
          {/* 상단(radiusTop)과 하단(radiusBottom) 모두 rafterRadius로 통일하여 매끄러운 원통형 서까래 형성 */}
          <cylinderGeometry args={[rafterRadius, rafterRadius, raf.length, 16]} />
          <meshStandardMaterial color="#553721" roughness={0.8} />
        </mesh>
      ))}

      {/* --------------------------------------------------------------------- */}
      {/* 5. 암키와 바닥단 (후면 북측 슬로프 덮개 - 고성능 인스턴스 렌더링) */}
      {/* --------------------------------------------------------------------- */}
      <instancedMesh
        ref={femaleTileRef}
        args={[undefined, undefined, totalInstances]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#2e3338"
          roughness={0.75}
          metalness={0.15}
        />
      </instancedMesh>

      {/* --------------------------------------------------------------------- */}
      {/* 6. 수키와 볼록단 (후면 북측 슬로프 이음매 덮개 - 고성능 인스턴스 렌더링) */}
      {/* --------------------------------------------------------------------- */}
      <instancedMesh
        ref={maleTileRef}
        args={[undefined, undefined, totalInstances]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.8, 0.8, 1, 14]} />
        <meshStandardMaterial
          color="#1e2124"
          roughness={0.6}
          metalness={0.22}
        />
      </instancedMesh>

      {/* --------------------------------------------------------------------- */}
      {/* 7. 전통 박공벽(합각벽) 및 풍판 (외벽선과 오차 없는 완벽 대칭 정렬) */}
      {/* --------------------------------------------------------------------- */}
      {/* 동측(East) 박공벽: 건물 외벽선(maxX)에서 건물 안쪽(-X)으로 정확히 압출 */}
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

      {/* 서측(West) 박공벽: 건물 외벽선(minX)에서 건물 안쪽(+X)으로 정확히 압출 */}
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
