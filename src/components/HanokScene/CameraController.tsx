import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useCameraStore, CAMERA_OFFSET_CONFIGS, CAMERA_PRESET_CONFIGS } from '../../store';
import { useBuildStore } from '../../store/useBuildStore';
import { useRoofStore } from '../../store/useRoofStore';

interface CameraControllerProps {
  controlsRef: React.RefObject<any>;
}

/**
 * [CameraController]
 * 한옥 씬의 카메라 위치와 회전축(Target)을 제어하는 컴포넌트입니다.
 * 
 * 주요 역할:
 * 1. 현재 배치된 부재들(placedParts: 주춧돌, 기둥, 보, 벽 등)의 3D 바운딩 박스를 계산하여
 *    "건물의 정중앙 좌표 [centerX, centerY, centerZ]"를 실시간으로 도출합니다.
 * 2. 하단 툴바에서 시점(TOP, FRONT, ISOMETRIC, DEFAULT 등) 버튼을 클릭했을 때,
 *    건물 정중앙을 타깃으로 삼고 카메라를 목표 위치까지 부드럽게(lerp) 이동시킵니다.
 * 3. 이동 완료 후 OrbitControls의 회전축(target)도 건물의 중심에 고정하여,
 *    마우스로 회전하더라도 건물이 화면 정중앙에서 벗어나지 않고 제자리에서 회전하도록 합니다.
 */
export const CameraController: React.FC<CameraControllerProps> = ({ controlsRef }) => {
  const currentPreset = useCameraStore((state) => state.currentPreset);
  const placedParts = useBuildStore((state) => state.placedParts);
  const hasRoof = useRoofStore((state) => state.hasRoof);

  // 현재 애니메이션 목표가 되는 카메라 위치, 주시 지점(Target), 화각(FOV)
  const targetPos = useRef(new THREE.Vector3(...CAMERA_PRESET_CONFIGS.default.position));
  const targetLook = useRef(new THREE.Vector3(...CAMERA_PRESET_CONFIGS.default.target));
  const targetFov = useRef<number>(CAMERA_PRESET_CONFIGS.default.fov);
  const isTransitioning = useRef<boolean>(false);
  const { size, camera } = useThree();

  // ---------------------------------------------------------------------------
  // [1] 배치된 한옥 모델의 3차원 바운딩 박스 중심(Center) 동적 계산
  // ---------------------------------------------------------------------------
  const buildingCenter = useMemo((): [number, number, number] => {
    if (placedParts.length === 0) {
      // 배치된 부재가 전혀 없을 때는 그리드 중심의 기본 시선 높이(Y=1.6m) 반환
      return [0, 1.6, 0];
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    placedParts.forEach((part) => {
      const [px, py, pz] = part.position;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
      if (pz < minZ) minZ = pz;
      if (pz > maxZ) maxZ = pz;
    });

    // 지붕(서까래/기와)이 올라가 있으면 상단 높이를 지붕 꼭대기(용마루 약 4.2~4.5m)까지 확장
    if (hasRoof) {
      maxY = Math.max(maxY, 4.3);
    } else {
      // 기둥(높이 2.8m) 머리 높이까지 반영
      maxY = Math.max(maxY, 3.2);
    }
    // 주춧돌 바닥 최저 높이 보정
    minY = Math.min(minY, 0.0);

    const centerX = (minX + maxX) / 2;
    // 건물의 수직 중심(건물 높이의 정중앙)
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;

    return [centerX, centerY, centerZ];
  }, [placedParts, hasRoof]);

  // 뷰포트 크기가 변경될 때 카메라 종횡비(Aspect Ratio) 자동 갱신
  React.useEffect(() => {
    if ('aspect' in camera && typeof (camera as THREE.PerspectiveCamera).aspect === 'number') {
      const pCam = camera as THREE.PerspectiveCamera;
      pCam.aspect = size.width / size.height;
      pCam.updateProjectionMatrix();
    }
  }, [size, camera]);

  const isCinematicMode = useCameraStore((state) => state.isCinematicMode);
  const setCinematicStageName = useCameraStore((state) => state.setCinematicStageName);

  // 시네마틱 모드 진행 시간 및 스테이지 추적
  const cinematicTimeRef = useRef<number>(0);
  const currentStageIndexRef = useRef<number>(0);

  // ---------------------------------------------------------------------------
  // [2] 시점(Preset) 버튼 클릭 시에만 목표 좌표 설정 및 애니메이션 활성화
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    if (isCinematicMode) return; // 시네마틱 모드 중에는 수동 프리셋 전환 무시

    const offsetConfig = CAMERA_OFFSET_CONFIGS[currentPreset] || CAMERA_OFFSET_CONFIGS.default;
    const [cx, cy, cz] = buildingCenter;

    // 타깃 지점: 건물의 정중앙
    const lookY = offsetConfig.fixedTargetY !== undefined ? offsetConfig.fixedTargetY : cy;
    targetLook.current.set(cx, lookY, cz);

    // 카메라 위치: 건물 중심 + 프리셋별 상대 오프셋 벡터
    const [ox, oy, oz] = offsetConfig.offset;
    targetPos.current.set(cx + ox, cy + oy, cz + oz);

    // 화각 설정
    targetFov.current = offsetConfig.fov;

    // 프리셋 버튼을 눌렀을 때만 부드러운 전환 애니메이션 시작
    isTransitioning.current = true;
  }, [currentPreset, isCinematicMode, buildingCenter]);

  // 시네마틱 모드 시작/종료 시 시간 및 상태 초기화
  React.useEffect(() => {
    if (isCinematicMode) {
      cinematicTimeRef.current = 0;
      currentStageIndexRef.current = 0;
      setCinematicStageName('1. Daylight 연출 (자연광 조망)');
      isTransitioning.current = false;
    }
  }, [isCinematicMode, setCinematicStageName]);

  // ---------------------------------------------------------------------------
  // [3] 마우스 드래그(OrbitControls 조작) 감지:
  // 사용자가 화면을 클릭하거나 드래그하는 순간 중앙정렬 보간을 즉시 해제하여
  // 사용자가 원하는 각도로 완전히 자유롭게 돌아가도록 설정
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // OrbitControls 조작 시작('start' 이벤트: 마우스 좌클릭/우클릭 드래그 시 발생)
    const handleControlStart = () => {
      // 일반 모드일 때만 수동 조작 시 정렬 애니메이션 중단
      if (!isCinematicMode) {
        isTransitioning.current = false;
      }
    };

    controls.addEventListener('start', handleControlStart);
    return () => {
      controls.removeEventListener('start', handleControlStart);
    };
  }, [controlsRef, isCinematicMode]);

  // ---------------------------------------------------------------------------
  // [4] 프레임 단위 보간 애니메이션 및 시네마틱 카메라 시퀀스 연출
  // ---------------------------------------------------------------------------
  useFrame((state, delta) => {
    const [cx, cy, cz] = buildingCenter;

    // A. 시네마틱 모드 (Cinematic Mode) 동작 중일 때
    if (isCinematicMode) {
      cinematicTimeRef.current += delta;
      const t = cinematicTimeRef.current;

      // 총 5개 구간: 각 구간 약 3.6초 (총 18초 루프)
      // 0 ~ 3.6s   : Stage 1 - Daylight 연출 (따스한 햇살 아래 정면 수평 조망)
      // 3.6 ~ 7.2s : Stage 2 - Slow Orbit (한옥 전체를 완만하게 회전하며 360도 입체 감상)
      // 7.2 ~ 10.8s: Stage 3 - Close-up (처마와 기둥, 창호 문살의 정교한 결구 클로즈업)
      // 10.8 ~ 14.4s: Stage 4 - Roof Detail (용마루 수키와 및 지붕 겹기와 능선 디테일 조망)
      // 14.4 ~ 18.0s: Stage 5 - Full Establishing Shot (광활한 하늘 아래 한옥 전경 와이드 샷)
      const stageDuration = 3.6;
      const totalDuration = stageDuration * 5;
      const loopTime = t % totalDuration;
      const stageIndex = Math.floor(loopTime / stageDuration);
      const stageProgress = (loopTime % stageDuration) / stageDuration; // 0.0 ~ 1.0

      if (stageIndex !== currentStageIndexRef.current) {
        currentStageIndexRef.current = stageIndex;
        const stageNames = [
          '1. Daylight 연출 (자연광 정면 조망)',
          '2. Slow Orbit (360도 한옥 가구 회전)',
          '3. Close-up (기둥·창호 결구부 디테일)',
          '4. Roof Detail (용마루 및 기와 능선)',
          '5. Full Establishing Shot (한옥 전경 와이드 샷)',
        ];
        setCinematicStageName(stageNames[stageIndex]);
      }

      let camX = cx;
      let camY = cy + 2;
      let camZ = cz + 10;
      let targetX = cx;
      let targetY = cy;
      let targetZ = cz;
      let fov = 40;

      if (stageIndex === 0) {
        // [Stage 1: Daylight 연출]
        // 낮은 정면에서 부드럽게 약간 위로 상승하며 한옥의 전면 입면과 채광을 감상
        const ease = 0.5 - 0.5 * Math.cos(stageProgress * Math.PI);
        camX = cx + Math.sin(stageProgress * 0.3) * 3;
        camY = cy + 0.8 + ease * 1.2;
        camZ = cz + 14 - ease * 2;
        targetX = cx;
        targetY = cy + 0.5;
        targetZ = cz;
        fov = 38;
      } else if (stageIndex === 1) {
        // [Stage 2: Slow Orbit]
        // 반경 13m 거리에서 중심을 축으로 45도 회전하며 입체적 결구 감상
        const angle = 0.3 + stageProgress * 0.8;
        const radius = 13.5;
        camX = cx + Math.sin(angle) * radius;
        camY = cy + 3.2 + Math.sin(stageProgress * Math.PI) * 0.6;
        camZ = cz + Math.cos(angle) * radius;
        targetX = cx;
        targetY = cy + 0.6;
        targetZ = cz;
        fov = 36;
      } else if (stageIndex === 2) {
        // [Stage 3: Close-up]
        // 기둥 머리와 처마, 격자창호 결구부로 부드럽게 근접
        const ease = 0.5 - 0.5 * Math.cos(stageProgress * Math.PI);
        camX = cx - 2.8 + ease * 0.6;
        camY = cy + 1.2 + ease * 0.4;
        camZ = cz + 4.8 - ease * 0.8;
        targetX = cx - 1.2;
        targetY = cy + 1.2;
        targetZ = cz + 1.5;
        fov = 32;
      } else if (stageIndex === 3) {
        // [Stage 4: Roof Detail]
        // 높은 각도에서 용마루와 겹기와, 풍판, 서까래 끝선으로 활강
        const ease = 0.5 - 0.5 * Math.cos(stageProgress * Math.PI);
        camX = cx + 5.5 - ease * 2.5;
        camY = cy + 4.6 + Math.sin(stageProgress * Math.PI) * 0.4;
        camZ = cz + 6.5 - ease * 1.5;
        targetX = cx;
        targetY = cy + 2.8;
        targetZ = cz;
        fov = 35;
      } else {
        // [Stage 5: Full Establishing Shot]
        // 웅장하게 뒤로 물러나며 한옥 전체와 기단, 지붕을 한눈에 담는 시네마틱 와이드 샷
        const ease = 0.5 - 0.5 * Math.cos(stageProgress * Math.PI);
        camX = cx + 11 + ease * 3;
        camY = cy + 6.5 + ease * 2;
        camZ = cz + 12 + ease * 4;
        targetX = cx;
        targetY = cy + 0.8;
        targetZ = cz;
        fov = 42;
      }

      // 부드러운 프레임 보간 (smooth lerp 0.05)
      state.camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.06);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.06);
        controlsRef.current.update();
      } else {
        state.camera.lookAt(targetX, targetY, targetZ);
      }

      if ('fov' in state.camera && typeof (state.camera as THREE.PerspectiveCamera).fov === 'number') {
        const pCam = state.camera as THREE.PerspectiveCamera;
        pCam.fov = THREE.MathUtils.lerp(pCam.fov, fov, 0.06);
        pCam.updateProjectionMatrix();
      }
      return;
    }

    // B. 일반 인터랙티브 모드 (프리셋 이동 시에만 lerp 적용)
    if (!isTransitioning.current) return;

    // 1. 카메라 위치를 목표 위치로 8%씩 부드럽게 접근 (lerp)
    state.camera.position.lerp(targetPos.current, 0.08);

    // 2. OrbitControls의 target(바라보는 중심점)을 건물 중심으로 부드럽게 이동
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, 0.08);
      controlsRef.current.update();
    } else {
      state.camera.lookAt(targetLook.current);
    }

    // 3. 렌즈 화각(FOV) 부드럽게 조정
    if ('fov' in state.camera && typeof (state.camera as THREE.PerspectiveCamera).fov === 'number') {
      const pCam = state.camera as THREE.PerspectiveCamera;
      pCam.fov = THREE.MathUtils.lerp(pCam.fov, targetFov.current, 0.08);
      pCam.updateProjectionMatrix();
    }

    // 4. 목표 지점에 충분히 근접(오차 3cm 미만)하면 애니메이션을 완전히 종료하여 자유 조작 보장
    const posDist = state.camera.position.distanceTo(targetPos.current);
    const lookDist = controlsRef.current
      ? controlsRef.current.target.distanceTo(targetLook.current)
      : 0;

    if (posDist < 0.03 && lookDist < 0.03) {
      state.camera.position.copy(targetPos.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLook.current);
        controlsRef.current.update();
      }
      isTransitioning.current = false;
    }
  });

  return null;
};
